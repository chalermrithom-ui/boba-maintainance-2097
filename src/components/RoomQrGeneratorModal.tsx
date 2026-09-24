import React, { useState, useRef } from "react";
import { RepairJob } from "../types";
import {
  QrCode,
  X,
  Printer,
  Download,
  Copy,
  Check,
  Building,
  Home,
  Plus,
  Trash2,
  Sparkles,
  Phone,
  Info,
  CheckCircle2,
  Eye,
  Grid,
  FileText
} from "lucide-react";

interface RoomQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairsList?: RepairJob[];
}

export const RoomQrGeneratorModal: React.FC<RoomQrGeneratorModalProps> = ({
  isOpen,
  onClose,
  repairsList = [],
}) => {
  if (!isOpen) return null;

  // Extract unique condo names and room numbers from existing repair jobs
  const existingCondos: string[] = Array.from(
    new Set(repairsList.map((j) => j.condoName).filter(Boolean))
  );
  if (existingCondos.length === 0) {
    existingCondos.push("B.O.B.A. Residence Condo");
  }

  const existingRooms: string[] = Array.from(
    new Set(repairsList.map((j) => j.roomNo).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Form States
  const [condoName, setCondoName] = useState<string>(existingCondos[0] || "B.O.B.A. Residence Condo A");
  const [roomsInput, setRoomsInput] = useState<string>(
    existingRooms.length > 0 ? existingRooms.slice(0, 4).join(", ") : "101, 102, 103, 104"
  );
  const [headline, setHeadline] = useState<string>("ศูนย์แจ้งซ่อม & ติดตามสถานะงานซ่อมแซม");
  const [contactInfo, setContactInfo] = useState<string>("นิติบุคคลโทร: 02-123-4567 | LINE Official: @boba-residence");
  const [layoutStyle, setLayoutStyle] = useState<"card" | "grid" | "sticker">("card");
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  // Parse room numbers from comma/space/newline separated string
  const roomList: string[] = Array.from(
    new Set(
      roomsInput
        .split(/[\n,;]+/)
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
    )
  );

  const getTrackingUrl = (roomNo: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=customer&jobId=${encodeURIComponent(roomNo)}`;
  };

  const getQrCodeUrl = (roomNo: string) => {
    const targetUrl = getTrackingUrl(roomNo);
    if (imgErrorMap[roomNo]) {
      return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(targetUrl)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
  };

  const handleCopyUrl = async (roomNo: string, index: number) => {
    const url = getTrackingUrl(roomNo);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error("Copy link error:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSingleCard = async (roomNo: string) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 650;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Frame Border
      ctx.strokeStyle = "#0F172A"; // slate-900
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Header Banner Box
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(30, 30, canvas.width - 60, 110);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(condoName, canvas.width / 2, 75);

      ctx.fillStyle = "#38BDF8"; // sky-400
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(headline, canvas.width / 2, 108);

      // Room Badge Box
      ctx.fillStyle = "#F1F5F9"; // slate-100
      ctx.fillRect(160, 160, canvas.width - 320, 70);
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2;
      ctx.strokeRect(160, 160, canvas.width - 320, 70);

      ctx.fillStyle = "#0F172A";
      ctx.font = "extrabold 32px sans-serif";
      ctx.fillText(`ห้องพักเลขที่ ${roomNo}`, canvas.width / 2, 206);

      // Draw QR Code Image
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = getQrCodeUrl(roomNo);

      qrImg.onload = () => {
        ctx.drawImage(qrImg, canvas.width / 2 - 150, 250, 300, 300);

        // Subtext box
        ctx.fillStyle = "#1E293B";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("สแกน QR Code ด้วยกล้องมือถือ", canvas.width / 2, 590);

        ctx.fillStyle = "#2563EB";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("เพื่อติดตามสถานะ หรือแจ้งซ่อมแซมห้องพัก", canvas.width / 2, 620);

        // Footnote Contact
        ctx.fillStyle = "#64748B";
        ctx.font = "14px sans-serif";
        ctx.fillText(contactInfo, canvas.width / 2, 680);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "12px sans-serif";
        ctx.fillText("Powered by B.O.B.A. Maintenance System", canvas.width / 2, 740);

        const a = document.createElement("a");
        a.download = `QR_Code_Room_${roomNo}_${condoName.replace(/\s+/g, "_")}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      };
    } catch (e) {
      console.error("Canvas export failed:", e);
    }
  };

  const handleAddRoomQuick = (room: string) => {
    if (!roomList.includes(room)) {
      setRoomsInput((prev) => (prev ? `${prev}, ${room}` : room));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 text-left font-sans">
      
      {/* Printable Style Inject Block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-sheet-container, #printable-qr-sheet-container * {
            visibility: visible !important;
          }
          #printable-qr-sheet-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] no-print">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white relative border-b border-blue-900/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xxs font-extrabold text-blue-400 uppercase tracking-wider block">
                Condo Unit QR Code Generator
              </span>
              <h2 className="text-lg font-black text-white font-display flex items-center gap-2">
                <span>สร้างแผ่น QR Code ประจำห้องพักคอนโด</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-400/30">
                  Print Ready
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            สร้างป้าย QR Code ติดห้องพัก/ยูนิตเพื่อให้ผู้เช่าสแกนดูสถานะงานซ่อม หรือส่งเรื่องแจ้งซ่อมประจำห้องได้ทันที
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Controls Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Condo Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ชื่อคอนโด / อาคาร
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={condoName}
                    onChange={(e) => setCondoName(e.target.value)}
                    placeholder="เช่น B.O.B.A. Residence Condo A"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Room Numbers Input */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  หมายเลขห้องพัก (คั่นด้วยเครื่องหมายจุลภาค , )
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={roomsInput}
                    onChange={(e) => setRoomsInput(e.target.value)}
                    placeholder="เช่น 101, 102, 103, 104"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Headline Subtitle */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ข้อความหัวเรื่องบนแผ่น
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="เช่น ศูนย์แจ้งซ่อม & ติดตามสถานะงานซ่อมแซม"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Contact Info Footer */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ข้อมูลการติดต่อ / เบอร์นิติบุคคล
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="เช่น นิติบุคคลโทร: 02-123-4567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Quick add rooms from existing repair jobs */}
            {existingRooms.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  เลือกห้องพักจากระบบงานซ่อมที่มีในคลัง:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {existingRooms.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleAddRoomQuick(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                        roomList.includes(r)
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <span>ห้อง {r}</span>
                      {!roomList.includes(r) && <Plus className="w-3 h-3 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
            <div className="flex items-center space-x-2 text-xs text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                พร้อมพิมพ์จำนวน <strong className="font-extrabold text-blue-900">{roomList.length}</strong> ยูนิต/ห้องพัก
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์กระดาษ (Print All)</span>
              </button>
            </div>
          </div>

          {/* QR Cards Preview Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>ตัวอย่างแผ่น QR Code ที่จะถูกพิมพ์ (Print Preview)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                สามารถคลิก "ดาวน์โหลดรูป" รายห้องแยกไฟล์ได้
              </span>
            </h3>

            {roomList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                กรุณาระบุหมายเลขห้องพักที่ต้องการสร้างแผ่น QR Code
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roomList.map((roomNo, idx) => {
                  const trackingUrl = getTrackingUrl(roomNo);
                  const qrUrl = getQrCodeUrl(roomNo);

                  return (
                    <div
                      key={roomNo}
                      className="bg-white border-2 border-slate-900 rounded-3xl p-5 shadow-lg flex flex-col items-center text-center relative space-y-3 hover:border-blue-600 transition-colors"
                    >
                      {/* Top Condo Header */}
                      <div className="w-full bg-slate-900 text-white p-2.5 rounded-xl">
                        <h4 className="text-xs font-black tracking-wide text-white">
                          {condoName}
                        </h4>
                        <p className="text-[10px] text-blue-300 font-bold mt-0.5">
                          {headline}
                        </p>
                      </div>

                      {/* Room Number Badge */}
                      <div className="bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-xl">
                        <span className="text-xs font-extrabold text-slate-600 block text-[10px]">
                          UNIT / ROOM
                        </span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          ห้องพัก {roomNo}
                        </span>
                      </div>

                      {/* QR Image Frame */}
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner relative group">
                        <img
                          src={qrUrl}
                          alt={`QR Code Room ${roomNo}`}
                          onError={() => {
                            setImgErrorMap((prev) => ({ ...prev, [roomNo]: true }));
                          }}
                          className="w-44 h-44 object-contain mx-auto"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center p-2 text-white text-xxs font-bold">
                          สแกนเพื่อเข้าสู่หน้าติดตามงานซ่อม
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="text-slate-800 text-xs font-bold leading-tight">
                        <p className="text-slate-900">สแกน QR Code ด้วยกล้องมือถือ</p>
                        <p className="text-blue-600 text-[11px] font-extrabold mt-0.5">
                          ติดตามสถานะ หรือแจ้งซ่อมแซมห้อง {roomNo}
                        </p>
                      </div>

                      {/* Footer Contact */}
                      <div className="pt-2 border-t border-slate-200 w-full text-[10px] text-slate-500 font-semibold space-y-1">
                        <p>{contactInfo}</p>
                        <p className="text-[9px] text-slate-400 font-mono">
                          B.O.B.A. Maintenance System • Unit ID: {roomNo}
                        </p>
                      </div>

                      {/* Card Individual Action Buttons */}
                      <div className="w-full pt-2 flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(roomNo, idx)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>คัดลอกลิงก์</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingleCard(roomNo)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ดาวน์โหลดรูป</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between flex-shrink-0 text-xs">
          <span className="text-slate-500 text-xxs font-mono">
            ระบบสร้างแผ่น QR Code สำหรับติดห้องพัก B.O.B.A. Maintenance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>

      {/* Hidden Container for Clean Print Layout */}
      <div id="printable-qr-sheet-container" className="hidden">
        <div className="grid grid-cols-2 gap-6 p-4">
          {roomList.map((roomNo) => {
            const qrUrl = getQrCodeUrl(roomNo);
            return (
              <div
                key={`print-${roomNo}`}
                style={{
                  border: "4px solid #0F172A",
                  borderRadius: "20px",
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#FFFFFF",
                  pageBreakInside: "avoid",
                  marginBottom: "20px",
                }}
              >
                <div style={{ backgroundColor: "#0F172A", color: "#FFFFFF", padding: "12px", borderRadius: "10px", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>{condoName}</h2>
                  <p style={{ fontSize: "12px", color: "#38BDF8", margin: "4px 0 0 0", fontWeight: "bold" }}>{headline}</p>
                </div>

                <div style={{ backgroundColor: "#F1F5F9", border: "1px solid #CBD5E1", padding: "8px 16px", borderRadius: "10px", display: "inline-block", marginBottom: "16px" }}>
                  <span style={{ fontSize: "22px", fontWeight: "900", color: "#0F172A" }}>ห้องพัก {roomNo}</span>
                </div>

                <div style={{ margin: "16px 0" }}>
                  <img
                    src={qrUrl}
                    alt={`QR Code Room ${roomNo}`}
                    style={{ width: "220px", height: "220px", margin: "0 auto", display: "block" }}
                  />
                </div>

                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#0F172A", marginTop: "12px" }}>
                  สแกน QR Code ด้วยกล้องมือถือ
                  <br />
                  <span style={{ color: "#2563EB" }}>เพื่อติดตามสถานะ หรือแจ้งซ่อมแซมห้องพัก</span>
                </div>

                <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #E2E8F0", fontSize: "11px", color: "#64748B" }}>
                  {contactInfo}
                  <br />
                  <span style={{ fontSize: "10px", color: "#94A3B8" }}>B.O.B.A. Maintenance System</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
