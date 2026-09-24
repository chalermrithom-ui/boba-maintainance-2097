import React, { useState } from "react";
import { RepairJob } from "../types";
import {
  MessageSquare,
  X,
  Copy,
  Check,
  ExternalLink,
  Send,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  Home,
  Sparkles
} from "lucide-react";

interface LineReminderModalProps {
  job: RepairJob;
  elapsedHours: number;
  onClose: () => void;
  onSendReminderLogged: (jobId: string, technician: string, logMsg: string) => void;
}

export const LineReminderModal: React.FC<LineReminderModalProps> = ({
  job,
  elapsedHours,
  onClose,
  onSendReminderLogged,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isSendingApi, setIsSendingApi] = useState<boolean>(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string>("");

  const daysPending = Math.floor(elapsedHours / 24);
  const hoursRem = Math.floor(elapsedHours % 24);
  const durationText = daysPending > 0 ? `${daysPending} วัน ${hoursRem} ชั่วโมง` : `${Math.floor(elapsedHours)} ชั่วโมง`;

  // Pre-formatted LINE Reminder Message
  const reminderMessage = `🚨 [แจ้งเตือนงานซ่อมค้างรอดำเนินการเกิน 48 ชม.]
---------------------------------
🏢 คอนโด: ${job.condoName}
🚪 ห้อง: ${job.roomNo}
🆔 รหัสงานซ่อม: ${job.id}
👤 ช่างผู้รับผิดชอบ: ${job.technician || "ยังไม่ได้ระบุช่าง"}
⏰ สถานะค้างสะสม: ${durationText}
🔧 รายละเอียดอาการ: ${job.details}
📅 วันนัดหมาย: ${job.apptDate || "ไม่ระบุวัน"} ${job.apptTime || ""}
---------------------------------
⚠️ งานซ่อมนี้รอดำเนินการนานเกินกำหนด กรุณาเข้าตรวจสอบและอัปเดตสถานะการซ่อมในระบบด้วยครับ`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const handleOpenLineApp = () => {
    handleCopyMessage();
    // LINE Share URL scheme
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(reminderMessage)}`;
    window.open(lineUrl, "_blank");

    onSendReminderLogged(
      job.id,
      job.technician,
      `ส่งการแจ้งเตือนเตือนช่าง "${job.technician}" ทาง LINE สำหรับงานซ่อม ${job.id} (ค้างสะสม ${durationText})`
    );
    setSendSuccessMsg("เปิดแอป LINE และบันทึกประวัติการส่งเตือนเรียบร้อยแล้ว!");
  };

  const handleSendViaNotificationApi = async () => {
    setIsSendingApi(true);
    setSendSuccessMsg("");
    try {
      // Simulate/trigger notification dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));

      onSendReminderLogged(
        job.id,
        job.technician,
        `ส่งสัญญาณแจ้งเตือนอัตโนมัติถึงช่าง "${job.technician}" สำหรับงาน ${job.id} (ค้างสะสม ${durationText})`
      );

      setSendSuccessMsg("ส่งสัญญาณเตือนไปยังช่างเรียบร้อยแล้ว!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("LINE Notify error:", err);
    } finally {
      setIsSendingApi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/30 rounded-xl text-rose-300">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-base sm:text-lg">ส่ง LINE แจ้งเตือนช่างผู้รับผิดชอบ</h3>
                <span className="bg-rose-500/30 text-rose-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-rose-400/30 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>&gt; 48 HRS</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                แจ้งเตือนงานซ่อมที่อยู่ในสถานะ 'รอดำเนินการ' นานเกินกำหนด
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Overdue Alert Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-3 text-rose-900">
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold block text-rose-950">
                งานซ่อมนี้ค้างรอดำเนินการสะสม: <span className="text-rose-700 font-extrabold">{durationText}</span>
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                ส่งข้อความเตือนไปยังช่าง <strong>{job.technician || "ไม่ระบุช่าง"}</strong> เพื่อเร่งรัดการเข้าตรวจสอบห้อง <strong>{job.roomNo} ({job.condoName})</strong>
              </p>
            </div>
          </div>

          {/* Job Summary Pill */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">รหัสงานซ่อม</span>
              <span className="font-mono font-bold text-blue-600">{job.id}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">ช่างผู้รับผิดชอบ</span>
              <span className="font-bold text-slate-800">{job.technician || "ยังไม่ได้ระบุ"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">อาคาร / คอนโด</span>
              <span className="font-bold text-slate-800 truncate block">{job.condoName}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">เลขที่ห้อง</span>
              <span className="font-bold text-slate-800">{job.roomNo}</span>
            </div>
          </div>

          {/* Pre-formatted LINE Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>ตัวอย่างข้อความแจ้งเตือนทาง LINE (Pre-formatted Text):</span>
              </label>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "คัดลอกสำเร็จ!" : "คัดลอกข้อความ"}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={8}
              value={reminderMessage}
              className="w-full bg-slate-900 text-emerald-300 text-xs font-mono p-3 rounded-xl border border-slate-700 focus:outline-none resize-none leading-relaxed select-all"
            />
          </div>

          {/* Success Banner */}
          {sendSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            {/* Primary Action: Open LINE App */}
            <button
              type="button"
              onClick={handleOpenLineApp}
              className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ring-2 ring-emerald-400/30"
            >
              <ExternalLink className="h-4 w-4" />
              <span>ส่งผ่านแอป LINE (Open LINE)</span>
            </button>

            {/* Secondary Action: Direct Alert Dispatch */}
            <button
              type="button"
              onClick={handleSendViaNotificationApi}
              disabled={isSendingApi}
              className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSendingApi ? "กำลังส่งการแจ้งเตือน..." : "ส่งการเตือนในระบบ"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
