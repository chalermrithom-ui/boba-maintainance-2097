import React, { useState, useEffect, useRef } from "react";
import { Part } from "../types";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
  QrCode,
  X,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Package,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowRight
} from "lucide-react";

interface PartQrScannerModalProps {
  inventory: Part[];
  onClose: () => void;
  onUpdateQty: (partId: string, additionalQty: number) => Promise<void>;
}

export const PartQrScannerModal: React.FC<PartQrScannerModalProps> = ({
  inventory,
  onClose,
  onUpdateQty,
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [scannedResult, setScannedResult] = useState<string>("");
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [scannerError, setScannerError] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");

  // Adjustment state for found part
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>("");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "qr-reader-region";

  // Lookup part when scanned code changes
  useEffect(() => {
    if (!scannedResult) {
      setFoundPart(null);
      return;
    }

    let codeToSearch = scannedResult.trim();

    // Handle JSON formatted QR code e.g. {"id": "PART-123"}
    try {
      if (codeToSearch.startsWith("{") && codeToSearch.endsWith("}")) {
        const parsed = JSON.parse(codeToSearch);
        if (parsed.id) codeToSearch = parsed.id;
        else if (parsed.partId) codeToSearch = parsed.partId;
        else if (parsed.name) codeToSearch = parsed.name;
      }
    } catch (e) {
      // not JSON, keep string
    }

    const matched = inventory.find(
      (p) =>
        p.id.toLowerCase() === codeToSearch.toLowerCase() ||
        p.name.toLowerCase().includes(codeToSearch.toLowerCase())
    );

    if (matched) {
      setFoundPart(matched);
      setScannerError("");
    } else {
      setFoundPart(null);
      setScannerError(`ไม่พบข้อมูลอะไหล่ที่ตรงกับรหัส QR Code: "${codeToSearch}"`);
    }
  }, [scannedResult, inventory]);

  // Handle Camera initialization
  useEffect(() => {
    if (activeTab !== "camera") {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      try {
        setScannerError("");
        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode(qrRegionId);
        }

        const qrScanner = html5QrcodeRef.current;
        if (qrScanner.getState() === Html5QrcodeScannerState.SCANNING) {
          await qrScanner.stop();
        }

        await qrScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            if (isMounted) {
              setScannedResult(decodedText);
              // Pause scanning after success
              try {
                qrScanner.pause(true);
              } catch (e) {
                // ignore
              }
            }
          },
          () => {
            // Ignore scan parse frame errors
          }
        );
      } catch (err: any) {
        if (isMounted) {
          console.warn("Camera start warning:", err);
          setScannerError(
            "ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง (Camera Permission) หรือเลือกอัปโหลดรูปภาพ / พิมพ์รหัสแทน"
          );
        }
      }
    };

    const timer = setTimeout(startCamera, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [activeTab]);

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.getState() === Html5QrcodeScannerState.SCANNING ||
            html5QrcodeRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
          await html5QrcodeRef.current.stop();
        }
      } catch (e) {
        // ignore stop errors
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError("");
    setScannedResult("");
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const result = await html5QrcodeRef.current.scanFile(file, true);
      setScannedResult(result);
    } catch (err: any) {
      setScannerError("ไม่สามารถอ่าน QR Code จากรูปภาพนี้ได้ กรุณาลองใช้รูปที่มีความคมชัดมากขึ้น");
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScannedResult(manualInput.trim());
  };

  const handleStockAction = async (delta: number) => {
    if (!foundPart) return;
    setIsUpdating(true);
    setActionSuccess("");
    try {
      await onUpdateQty(foundPart.id, delta);
      const actionText = delta > 0 ? `เติมสต็อกเพิ่ม +${delta}` : `เบิกใช้ไป ${delta}`;
      setActionSuccess(`ปรับยอดสำเร็จ: ${actionText} ${foundPart.unit}`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      setScannerError(err.message || "เกิดข้อผิดพลาดในการอัปเดตจำนวน");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeScanner = () => {
    setScannedResult("");
    setFoundPart(null);
    setScannerError("");
    setActionSuccess("");
    if (html5QrcodeRef.current && activeTab === "camera") {
      try {
        if (html5QrcodeRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
          html5QrcodeRef.current.resume();
        }
      } catch (e) {
        // restart
        setActiveTab("manual");
        setTimeout(() => setActiveTab("camera"), 100);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
                <span>สแกน QR Code คลังอะไหล่</span>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-400/30">
                  Quick Stock Scan
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                สแกนลาเบล QR Code เพื่อดูรายละเอียดหรือเบิก/เติมสต็อกทันที
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              handleResumeScanner();
              setActiveTab("camera");
            }}
            className={`pb-2.5 px-4 font-bold text-xs flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>สแกนด้วยกล้อง</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleResumeScanner();
              setActiveTab("upload");
            }}
            className={`pb-2.5 px-4 font-bold text-xs flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>อัปโหลดรูป QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleResumeScanner();
              setActiveTab("manual");
            }}
            className={`pb-2.5 px-4 font-bold text-xs flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>ค้นหาด้วยรหัส</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Scanner Viewport (Hidden element for html5-qrcode) */}
          <div className={activeTab === "camera" ? "block" : "hidden"}>
            <div className="bg-slate-900 rounded-2xl overflow-hidden relative p-3 border border-slate-800 text-center shadow-inner">
              <div id={qrRegionId} className="w-full min-h-[220px] rounded-xl overflow-hidden" />
              <p className="text-[11px] text-slate-400 mt-2">
                นำกล้องส่องไปที่ QR Code บนป้ายลาเบลของอะไหล่
              </p>
            </div>
          </div>

          {/* Upload Viewport */}
          {activeTab === "upload" && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-100/80 transition-all">
              <Upload className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-800">เลือกไฟล์รูปภาพ QR Code เพื่อสแกน</h4>
              <p className="text-[11px] text-slate-500 mt-1 mb-4">รองรับไฟล์ PNG, JPG, JPEG</p>
              <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center space-x-1.5">
                <Upload className="h-4 w-4" />
                <span>อัปโหลดรูปภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Manual Entry Viewport */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                ป้อนรหัสอะไหล่ (Part ID) หรือชื่ออะไหล่
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="เช่น PART-17482819 หรือ ท่อ PVC"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Search className="h-4 w-4" />
                  <span>ค้นหา</span>
                </button>
              </div>

              {/* Quick Select Presets for testing */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  หรือคลิกเลือกอะไหล่ทดสอบจากคลัง:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {inventory.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setScannedResult(p.id)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-mono transition-all cursor-pointer"
                    >
                      {p.id} ({p.name})
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Scanner Error Display */}
          {scannerError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}

          {/* Success Banner */}
          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* FOUND PART DETAILS & QUICK STOCK ADJUSTMENT CARD */}
          {foundPart && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg border border-indigo-500/30 space-y-4 animate-in zoom-in-95">
              
              {/* Part Title Header */}
              <div className="flex items-start justify-between gap-2 border-b border-indigo-800/60 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold block">
                      รหัส: {foundPart.id}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-white">{foundPart.name}</h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResumeScanner}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>สแกนรายการอื่น</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-0.5">คงเหลือปัจจุบัน</span>
                  <span className="font-extrabold text-base text-indigo-300 font-mono">
                    {foundPart.qty} <span className="text-xs font-normal text-slate-300">{foundPart.unit}</span>
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-0.5">ราคาต่อหน่วย</span>
                  <span className="font-extrabold text-sm text-emerald-400 font-mono">
                    ฿{foundPart.price.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block mb-0.5">เตือนสต็อกต่ำ</span>
                  <span className="font-extrabold text-xs text-amber-300 font-mono">
                    &le; {foundPart.minQty} {foundPart.unit}
                  </span>
                </div>
              </div>

              {/* Quick Stock Action Controls */}
              <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-700/50 space-y-3">
                <span className="text-xs font-bold text-indigo-200 flex items-center space-x-1">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>ปรับยอดสต็อกด่วน (Quick Stock Action):</span>
                </span>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-indigo-500/50 text-white text-xs rounded-lg font-bold text-center focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-indigo-300">{foundPart.unit}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Deduct Button */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStockAction(-adjustQty)}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                    <span>เบิกใช้งาน (-{adjustQty})</span>
                  </button>

                  {/* Restock Button */}
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStockAction(adjustQty)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>เติมเข้าสต็อก (+{adjustQty})</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
