import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { RepairJob } from "../types";
import {
  QrCode,
  X,
  Camera,
  Upload,
  Search,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Wrench,
  Building,
  Home,
  Clock
} from "lucide-react";

interface CustomerTrackQrScannerModalProps {
  onClose: () => void;
  onTrackJob: (jobId: string) => void;
  repairsList?: RepairJob[];
}

export const CustomerTrackQrScannerModal: React.FC<CustomerTrackQrScannerModalProps> = ({
  onClose,
  onTrackJob,
  repairsList = [],
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual" | "room">("camera");
  const [scannedResult, setScannedResult] = useState<string>("");
  const [scannerError, setScannerError] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [roomSearchInput, setRoomSearchInput] = useState<string>("");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = "customer-track-qr-region";

  // Parse scanned or entered result to extract clean jobId
  useEffect(() => {
    if (!scannedResult) return;

    let foundJobId = scannedResult.trim();

    try {
      // 1. Try URL parameter match: ?view=customer&jobId=JOB-xxx or ?jobId=JOB-xxx
      const paramMatch = foundJobId.match(/[?&]jobId=([^&]+)/i);
      if (paramMatch && paramMatch[1]) {
        foundJobId = decodeURIComponent(paramMatch[1]).trim();
      } else if (foundJobId.includes("jobId=")) {
        const dummyUrl = foundJobId.startsWith("http")
          ? foundJobId
          : `https://dummy.com/${foundJobId.startsWith("?") ? "" : "?"}${foundJobId}`;
        const urlObj = new URL(dummyUrl);
        const jId = urlObj.searchParams.get("jobId");
        if (jId) foundJobId = jId.trim();
      } else if (foundJobId.startsWith("{") && foundJobId.endsWith("}")) {
        const parsed = JSON.parse(foundJobId);
        if (parsed.jobId) foundJobId = String(parsed.jobId).trim();
        else if (parsed.id) foundJobId = String(parsed.id).trim();
      } else {
        // 2. Match JOB-xxx pattern if contained within longer string
        const match = foundJobId.match(/(JOB-[\w-]+)/i);
        if (match && match[1]) {
          foundJobId = match[1].toUpperCase();
        }
      }
    } catch (e) {
      // Keep string as is
    }

    if (foundJobId) {
      stopCamera();
      onTrackJob(foundJobId);
    }
  }, [scannedResult]);

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
            }
          },
          () => {}
        );
      } catch (err: any) {
        if (isMounted) {
          console.warn("Camera start warning:", err);
          setScannerError(
            "ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์กล้องในเบราว์เซอร์ หรือสลับใช้อัปโหลดรูป QR / ค้นหาตามเบอร์ห้อง"
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
        if (
          html5QrcodeRef.current.getState() === Html5QrcodeScannerState.SCANNING ||
          html5QrcodeRef.current.getState() === Html5QrcodeScannerState.PAUSED
        ) {
          await html5QrcodeRef.current.stop();
        }
      } catch (e) {
        // ignore stop error
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerError("");
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrRegionId);
      }
      const result = await html5QrcodeRef.current.scanFile(file, true);
      setScannedResult(result);
    } catch (err: any) {
      setScannerError("ไม่สามารถอ่าน QR Code จากรูปภาพนี้ได้ กรุณาลองอัปโหลดรูปภาพที่มีความคมชัดมากขึ้น");
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setScannedResult(manualInput.trim());
  };

  // Filter jobs by room number or condo name
  const matchedRoomJobs = repairsList.filter((job) => {
    if (!roomSearchInput.trim()) return true;
    const term = roomSearchInput.trim().toLowerCase();
    return (
      job.roomNo.toLowerCase().includes(term) ||
      job.condoName.toLowerCase().includes(term) ||
      job.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg flex items-center gap-2">
                <span>สแกน QR Code ติดตามงานซ่อม</span>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-400/30">
                  Tenant Mode
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                สำหรับผู้พักอาศัยสแกนป้ายงานหรือค้นหาเลขห้องเพื่อดูความคืบหน้า
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
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-3 pt-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`pb-2 px-3 font-bold text-xs flex items-center space-x-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>สแกนกล้อง</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`pb-2 px-3 font-bold text-xs flex items-center space-x-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>อัปโหลดรูป QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`pb-2 px-3 font-bold text-xs flex items-center space-x-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>รหัส Job ID</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("room")}
            className={`pb-2 px-3 font-bold text-xs flex items-center space-x-1 border-b-2 transition-all cursor-pointer ${
              activeTab === "room"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>ค้นหาเลขห้อง</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Camera Region */}
          <div className={activeTab === "camera" ? "block" : "hidden"}>
            <div className="bg-slate-900 rounded-2xl overflow-hidden relative p-3 border border-slate-800 text-center shadow-inner">
              <div id={qrRegionId} className="w-full min-h-[220px] rounded-xl overflow-hidden" />
              <p className="text-[11px] text-slate-400 mt-2">
                นำกล้องส่องไปที่ QR Code บนใบนัดหมายหรือใบบันทึกงานซ่อม
              </p>
            </div>
          </div>

          {/* Upload Region */}
          {activeTab === "upload" && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-100/80 transition-all">
              <Upload className="h-10 w-10 text-blue-500 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-800">เลือกรูปภาพ QR Code เพื่อติดตามงาน</h4>
              <p className="text-[11px] text-slate-500 mt-1 mb-4">รองรับไฟล์ PNG, JPG, JPEG</p>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center space-x-1.5">
                <Upload className="h-4 w-4" />
                <span>เลือกรูปภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Manual Job ID Entry Region */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                ป้อนรหัสงานซ่อม (Job ID) หรือวางลิงก์ที่ได้รับ
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="เช่น JOB-1748281902 หรือ วางลิงก์ URL"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>ติดตาม</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Room Number / Condo Search Tab */}
          {activeTab === "room" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ค้นหางานซ่อมตามเลขที่ห้อง หรือชื่อคอนโด
                </label>
                <input
                  type="text"
                  placeholder="เช่น ห้อง 101, 202, B.O.B.A."
                  value={roomSearchInput}
                  onChange={(e) => setRoomSearchInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {matchedRoomJobs.length > 0 ? (
                  matchedRoomJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        stopCamera();
                        onTrackJob(job.id);
                      }}
                      className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <Home className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-black text-slate-900">
                            ห้อง {job.roomNo}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({job.condoName.split(" (")[0]})
                          </span>
                        </div>
                        <p className="text-xxs text-slate-600 mt-1 line-clamp-1">
                          {job.details}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-blue-600 font-mono">
                          {job.id}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    ไม่พบรายการงานซ่อมสำหรับเลขห้องนี้
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scanner Error Display */}
          {scannerError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
