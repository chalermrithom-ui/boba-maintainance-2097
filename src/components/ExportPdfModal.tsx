import React, { useRef, useState } from "react";
import { RepairJob, JobStatus } from "../types";
import { X, Download, Printer, Wrench, ShieldCheck, FileText, CheckCircle2, Clock, Calendar, AlertCircle, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";

// Helper function for formatting appointment dates
const formatApptDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      return `${day} ${thaiMonths[month]} ${year + 543}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

interface ExportPdfModalProps {
  job: RepairJob;
  imageBlobCache?: { [key: string]: string };
  onClose: () => void;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  job,
  imageBlobCache = {},
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const beforeImgIds = job.beforeImg ? job.beforeImg.split(",").map(i => i.trim()).filter(Boolean) : [];
  const afterImgIds = job.afterImg ? job.afterImg.split(",").map(i => i.trim()).filter(Boolean) : [];

  const trackingUrl = `${window.location.origin}${window.location.pathname}?view=customer&jobId=${encodeURIComponent(job.id)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackingUrl)}`;

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      const element = printRef.current;
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: `Repair_Report_${job.id}_${job.roomNo}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใช้ปุ่มพิมพ์เอกสารแทน");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=1000");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ใบสรุปงานแจ้งซ่อม - ${job.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 20px; font-family: sans-serif; -webkit-print-color-adjust: exact; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body className="bg-white text-slate-900 p-6">
            ${printContent}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Toolbar Header */}
        <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base tracking-tight font-display">
                ส่งออกเอกสารใบแจ้งซ่อม (PDF / Print Summary)
              </h3>
              <p className="text-[11px] text-slate-400">
                รหัสงาน {job.id} • ห้อง {job.roomNo}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              title="พิมพ์เอกสารผ่านเครื่องพิมพ์"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
              title="ดาวน์โหลดเป็นไฟล์ PDF"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Document Preview Printable Container */}
        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-100">
          <div
            ref={printRef}
            className="bg-white rounded-xl p-6 md:p-10 border border-slate-200 shadow-sm space-y-6 text-slate-800 text-xs font-sans max-w-2xl mx-auto"
          >
            {/* Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-base tracking-tight font-display">
                    B.O.B.A. Maintainance Request System
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  เอกสารสรุปประวัติงานซ่อมบำรุงอาคารชุดและที่พักอาศัย (Official Maintenance Job Sheet)
                </p>
              </div>

              <div className="text-right space-y-1 flex items-center space-x-3">
                <div className="text-center p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <img
                    src={qrImageUrl}
                    alt={`QR Tracking Code ${job.id}`}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain"
                  />
                  <span className="text-[8px] font-bold text-slate-500 block">สแกนติดตามงาน</span>
                </div>
                <div>
                  <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded border border-slate-200 text-xs">
                    {job.id}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                  สถานะการดำเนินการ (Job Status)
                </span>
                <span className="font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                  {job.status === JobStatus.PENDING && (
                    <>
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-700">รอดำเนินการ (Pending)</span>
                    </>
                  )}
                  {job.status === JobStatus.IN_PROGRESS && (
                    <>
                      <Wrench className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-blue-700">กำลังดำเนินการซ่อม (In Progress)</span>
                    </>
                  )}
                  {job.status === JobStatus.UNDER_REVIEW && (
                    <>
                      <AlertCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-700">รอตรวจสอบงานซ่อม (Under Review)</span>
                    </>
                  )}
                  {job.status === JobStatus.COMPLETED && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">เสร็จสิ้นเรียบร้อย (Completed)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                  วันที่บันทึกซ่อม
                </span>
                <span className="font-semibold text-slate-700">
                  {job.createdAt || "-"}
                </span>
              </div>
            </div>

            {/* Main Primary Information Section: Ordered as Condo Name -> Room No -> Job ID -> Appt Date & Time */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3.5 shadow-sm">
              {/* 1. Condo Name (Extra Large, Bold, Clear) */}
              <div className="border-b border-slate-700/80 pb-2.5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">
                  🏢 ชื่ออาคารคอนโด (CONDOMINIUM)
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-wide leading-tight font-display">
                  {job.condoName || "ไม่ระบุชื่อคอนโด"}
                </h2>
              </div>

              {/* 2 & 3: Room No & Job Number */}
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                {/* 2. Room No */}
                <div className="bg-amber-400 text-slate-950 p-2.5 rounded-lg border border-amber-300">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-900/80">
                    🏠 เลขที่ห้อง (ROOM NO.)
                  </span>
                  <span className="text-lg font-black block font-mono">
                    ห้อง {job.roomNo || "-"}
                  </span>
                </div>

                {/* 3. Job ID */}
                <div className="bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    🔢 รันเลขนัมเบอร์งาน (JOB CODE)
                  </span>
                  <span className="text-base font-black font-mono text-blue-400 block">
                    {job.id}
                  </span>
                </div>
              </div>

              {/* 4. Appt Date & Appt Time */}
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      📅 วันนัดหมายเข้าซ่อม
                    </span>
                    <span className="text-sm font-black text-white font-mono">
                      {formatApptDate(job.apptDate) || "ไม่ระบุวัน"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-right">
                  <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider block">
                      ⏰ เวลานัดหมาย
                    </span>
                    <span className="text-sm font-black text-amber-300 font-mono">
                      {job.apptTime ? `${job.apptTime} น.` : "ไม่ระบุเวลา"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Information Grid */}
            <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">ช่างผู้รับผิดชอบ (Technicians)</span>
                <span className="font-extrabold text-blue-900 text-xs block">{job.technician || job.technicianName || "ยังไม่ระบุช่าง"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">ระดับความสำคัญ</span>
                <span className={`font-black text-xs block ${job.priority === "ด่วนมาก" ? "text-rose-600" : "text-slate-800"}`}>
                  {job.priority || "งานปกติ"}
                </span>
              </div>
            </div>

            {/* Repair Description */}
            <div className="space-y-1.5 border-t border-slate-200 pt-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                รายละเอียดการแจ้งซ่อม / ปัญหาที่พบ
              </span>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                {job.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>
            </div>

            {/* Cost & Payment Summary if applicable */}
            {(job.cost !== undefined && job.cost > 0) && (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-3.5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">ค่าบริการ / ค่าอะไหล่ซ่อมแซม</span>
                  <span className="text-xs text-emerald-600 font-medium">บันทึกค่าใช้จ่ายงานซ่อม</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    ฿{job.cost.toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            )}

            {/* Embedded Photos Summary if available */}
            {(beforeImgIds.length > 0 || afterImgIds.length > 0) && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  ภาพถ่ายการซ่อมแซม (Inspection Photos)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {beforeImgIds.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block">รูปก่อนซ่อม (Before):</span>
                      <div className="flex gap-1.5 overflow-x-auto">
                        {beforeImgIds.map(id => {
                          const src = imageBlobCache[id];
                          return src && !src.startsWith("data:video/") ? (
                            <img
                              key={id}
                              src={src}
                              alt="Before repair"
                              className="w-24 h-24 object-cover rounded border border-slate-200"
                            />
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {afterImgIds.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 block">รูปหลังซ่อม (After):</span>
                      <div className="flex gap-1.5 overflow-x-auto">
                        {afterImgIds.map(id => {
                          const src = imageBlobCache[id];
                          return src && !src.startsWith("data:video/") ? (
                            <img
                              key={id}
                              src={src}
                              alt="After repair"
                              className="w-24 h-24 object-cover rounded border border-emerald-300"
                            />
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Signatures Footer */}
            <div className="border-t-2 border-slate-200 pt-8 mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="space-y-8">
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1"></div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">ลงชื่อผู้แจ้งซ่อม / ผู้พักอาศัย</p>
                  <p className="text-[9px] text-slate-400">Resident / Reporter Signature</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1">
                  <p className="text-[11px] font-mono text-slate-700">{job.technicianName || ""}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">ลงชื่อช่างผู้ดำเนินการซ่อม</p>
                  <p className="text-[9px] text-slate-400">Technician Signature</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1"></div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">ลงชื่อเจ้าหน้าที่นิติบุคคล</p>
                  <p className="text-[9px] text-slate-400">Authorized Officer</p>
                </div>
              </div>
            </div>

            {/* Document Footer Note */}
            <div className="pt-4 text-center text-[9px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
              <span>B.O.B.A. Maintenance System • Official PDF Document</span>
              <span>รหัสอ้างอิง: {job.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
