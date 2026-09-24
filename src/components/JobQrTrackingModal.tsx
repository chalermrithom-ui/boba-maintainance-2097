import React, { useState } from "react";
import { RepairJob } from "../types";
import {
  QrCode,
  X,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Building,
  Home,
  Calendar,
  Clock,
  Wrench,
  Share2,
  Download,
  Loader2
} from "lucide-react";

interface JobQrTrackingModalProps {
  job: RepairJob;
  onClose: () => void;
}

export const JobQrTrackingModal: React.FC<JobQrTrackingModalProps> = ({ job, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [qrImgError, setQrImgError] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Generate public tracking URL
  const trackingUrl = `${window.location.origin}${window.location.pathname}?view=customer&jobId=${encodeURIComponent(
    job.id
  )}`;

  // Primary & fallback QR code image URLs
  const primaryQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    trackingUrl
  )}`;
  const fallbackQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
    trackingUrl
  )}`;
  const qrImageUrl = qrImgError ? fallbackQrUrl : primaryQrUrl;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "เสร็จสิ้น":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "กำลังดำเนินการ":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "รอดำเนินการ":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "รอตรวจสอบ":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      case "ยกเลิก":
        return "bg-rose-100 text-rose-800 border border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(trackingUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = trackingUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy link error:", e);
    }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 760;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context failed");

      // White Card Background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Border
      ctx.strokeStyle = "#0F172A"; // slate-900
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Header Band
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(20, 20, canvas.width - 40, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("B.O.B.A. REPAIR TRACKING", canvas.width / 2, 68);

      // Load QR Code Image
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = qrImageUrl;
      });

      // QR Frame Container
      const qrSize = 320;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 125;

      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 20);
      ctx.fill();
      ctx.stroke();

      // Draw QR
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Job ID Text Under QR
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 26px font-mono, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`รหัสงาน (JOB ID): ${job.id}`, canvas.width / 2, 505);

      // Status Badge Box
      const statusText = `สถานะปัจจุบัน: ${job.status}`;
      ctx.font = "bold 20px sans-serif";
      const textWidth = ctx.measureText(statusText).width;
      const badgeWidth = textWidth + 44;
      const badgeHeight = 46;
      const badgeX = (canvas.width - badgeWidth) / 2;
      const badgeY = 530;

      let bgCol = "#2563EB";
      if (job.status === "เสร็จสิ้น") bgCol = "#059669";
      else if (job.status === "กำลังดำเนินการ") bgCol = "#2563EB";
      else if (job.status === "รอดำเนินการ") bgCol = "#D97706";
      else if (job.status === "รอตรวจสอบ") bgCol = "#7C3AED";
      else if (job.status === "ยกเลิก") bgCol = "#DC2626";

      ctx.fillStyle = bgCol;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 23);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(statusText, canvas.width / 2, badgeY + 30);

      // Location Details Box
      ctx.fillStyle = "#F1F5F9";
      ctx.beginPath();
      ctx.roundRect(40, 600, canvas.width - 80, 80, 16);
      ctx.fill();

      ctx.fillStyle = "#1E293B";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(`${job.condoName} • ห้อง ${job.roomNo}`, canvas.width / 2, 638);

      ctx.fillStyle = "#64748B";
      ctx.font = "15px sans-serif";
      ctx.fillText(`วันนัดเข้าทำ: ${job.apptDate || job.workDate || "-"} (${job.apptTime || "00:00"} น.)`, canvas.width / 2, 665);

      // Footer Note
      ctx.fillStyle = "#475569";
      ctx.font = "14px sans-serif";
      ctx.fillText("📱 สแกน QR Code เพื่อติดตามสถานะการซ่อมแซมได้ตลอด 24 ชั่วโมง", canvas.width / 2, 712);

      // Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `QR_Tracking_${job.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("Canvas download failed, falling back to blob fetch download:", err);
      try {
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `QR_Tracking_${job.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (fallbackErr) {
        alert("ไม่สามารถดาวน์โหลดภาพ QR Code ได้ในขณะนี้");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ติดตามงานซ่อม ${job.id} - ${job.condoName}`,
          text: `ติดตามสถานะงานซ่อมคอนโด ${job.condoName} ห้อง ${job.roomNo} (รหัสงาน ${job.id})`,
          url: trackingUrl,
        });
      } catch (err) {
        console.warn("Share sheet closed or cancelled:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between no-print border-b border-indigo-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base">QR Code ติดตามสถานะงานซ่อม</h3>
              <p className="text-[11px] text-slate-300">
                สำหรับผู้พักอาศัยสแกนดูความคืบหน้างานซ่อม (Resident Tracking)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-5 sm:p-6 space-y-4">
          
          <div className="border-2 border-slate-800 rounded-2xl p-5 bg-white shadow-sm space-y-3 text-center relative overflow-hidden">
            
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="font-extrabold text-slate-900 text-xs tracking-wider uppercase font-mono">
                B.O.B.A. REPAIR TICKET
              </span>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                JOB ID: {job.id}
              </span>
            </div>

            {/* QR Code Graphic */}
            <div className="flex justify-center my-1">
              <div className="p-2 bg-white rounded-2xl border-2 border-indigo-100 shadow-md">
                <img
                  src={qrImageUrl}
                  alt={`QR Code for Tracking Job ${job.id}`}
                  referrerPolicy="no-referrer"
                  onError={() => setQrImgError(true)}
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>

            {/* Job ID & Status Badges directly UNDER QR Code */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs text-slate-600 font-semibold flex items-center justify-center gap-1.5">
                <span>รหัสงาน:</span>
                <span className="font-mono font-black text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {job.id}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">สถานะปัจจุบัน:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-2xs ${getStatusBadgeClass(job.status)}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                  {job.status}
                </span>
              </div>
            </div>

            {/* Info Summary */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-left">
              <div className="flex items-center space-x-1.5 text-slate-800 text-xs font-bold">
                <Building className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                <span className="truncate">{job.condoName}</span>
                <span className="text-slate-400 font-normal">•</span>
                <Home className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                <span>ห้อง {job.roomNo}</span>
              </div>

              <div className="flex items-center justify-between text-xxs text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {job.workDate || job.createdAt || "ไม่ระบุ"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {job.apptTime || "00:00"} น.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight font-medium">
              📱 ใช้กล้องโทรศัพท์สแกน QR Code เพื่อเปิดติดตามสถานะการซ่อมแซมได้ทันทีตลอด 24 ชั่วโมง
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 no-print">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                <span>{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownloadImage}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="ดาวน์โหลดรูปภาพ QR Code พร้อมรายละเอียด"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>ดาวน์โหลดภาพ</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>พิมพ์ป้าย QR</span>
              </button>
            </div>

            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-emerald-600" />
                <span>แชร์ไปยังแอปอื่น (LINE / Facebook)</span>
              </button>
            )}

            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer block text-center"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-300" />
              <span>เปิดดูหน้าติดตามงานของผู้พักอาศัย (Resident View)</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

