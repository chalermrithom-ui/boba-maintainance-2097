import React, { useState } from "react";
import { RepairJob, JobStatus } from "../types";
import { X, Save, Building2, Home, UserCheck, Calendar, Clock, AlertTriangle, DollarSign, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface AdminEditJobModalProps {
  job: RepairJob;
  onClose: () => void;
  onSave: (updatedJob: RepairJob) => Promise<void>;
  technicians: string[];
}

export const AdminEditJobModal: React.FC<AdminEditJobModalProps> = ({
  job,
  onClose,
  onSave,
  technicians,
}) => {
  const [condoName, setCondoName] = useState<string>(job.condoName || "");
  const [roomNo, setRoomNo] = useState<string>(job.roomNo || "");
  const [details, setDetails] = useState<string>(job.details || "");
  // Parse initial technicians string
  const initialTechs = job.technician ? job.technician.split(",").map(s => s.trim()) : [];
  const presetTechsList = ["SKY", "Jay Jay", "CHAINS"];
  const initialSelected = presetTechsList.filter(t => initialTechs.some(it => it.includes(t)));
  const customParts = initialTechs.filter(it => !presetTechsList.some(pt => it.includes(pt)));
  
  const [selectedTechs, setSelectedTechs] = useState<string[]>(initialSelected.length > 0 ? initialSelected : ["SKY"]);
  const [hasCustomTech, setHasCustomTech] = useState<boolean>(customParts.length > 0);
  const [customTech, setCustomTech] = useState<string>(customParts.join(", ").replace(/^อื่นๆ:\s*/, ""));

  const [apptDate, setApptDate] = useState<string>(job.apptDate || "");
  const [apptTime, setApptTime] = useState<string>(job.apptTime || "");
  const [workDate, setWorkDate] = useState<string>(job.workDate || new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<JobStatus>(job.status || JobStatus.PENDING);
  const [priority, setPriority] = useState<string>(job.priority || "งานปกติ");
  const [estimatedCost, setEstimatedCost] = useState<string>(job.estimatedCost ? String(job.estimatedCost) : "");
  const [paymentAmount, setPaymentAmount] = useState<string>(job.paymentAmount ? String(job.paymentAmount) : "");
  const [paymentMethod, setPaymentMethod] = useState<string>(job.paymentMethod || "ยังไม่ได้ชำระ");
  const [notes, setNotes] = useState<string>(job.notes || "");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!condoName.trim()) {
      setError("กรุณาระบุชื่อคอนโด/อาคาร");
      return;
    }
    if (!roomNo.trim()) {
      setError("กรุณาระบุเลขที่ห้อง");
      return;
    }
    if (!details.trim()) {
      setError("กรุณาระบุอาการเสีย/รายละเอียดงาน");
      return;
    }

    const finalTechList = [...selectedTechs];
    if (hasCustomTech && customTech.trim()) {
      finalTechList.push(`อื่นๆ: ${customTech.trim()}`);
    }
    const finalTechnicianStr = finalTechList.join(", ");

    setIsSubmitting(true);
    try {
      const updatedJob: RepairJob = {
        ...job,
        condoName: condoName.trim(),
        roomNo: roomNo.trim(),
        details: details.trim(),
        technician: finalTechnicianStr,
        apptDate,
        apptTime,
        workDate,
        status,
        priority,
        urgency: priority === "ด่วนมาก" ? "HIGH" : priority === "ด่วน" ? "MEDIUM" : "LOW",
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        paymentAmount: paymentAmount ? Number(paymentAmount) : undefined,
        paymentMethod,
        notes: notes.trim(),
        updatedAt: new Date().toLocaleString("th-TH"),
      };

      await onSave(updatedJob);
      setSuccessMsg("บันทึกการแก้ไขข้อมูลงานเรียบร้อยแล้ว!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลงานซ่อม");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>✏️ แก้ไขข้อมูลงานซ่อม (แอดมิน)</span>
                <span className="text-xs bg-amber-500/30 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                  {job.id}
                </span>
              </h3>
              <p className="text-xxs text-slate-400 mt-0.5">
                ปรับเปลี่ยนข้อมูลงานซ่อม, ช่างผู้ดูแล, วันเวลานัดหมาย และยอดเงิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Condo Name */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>ชื่ออาคาร / คอนโด <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={condoName}
                onChange={(e) => setCondoName(e.target.value)}
                placeholder="เช่น Boba Condominium Tower A"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Home className="w-3.5 h-3.5 text-amber-600" />
                <span>เลขที่ห้อง <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="เช่น 808/12"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xxs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>รายละเอียดอาการชำรุด <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุรายละเอียดอาการเสีย หรืองานที่ต้องซ่อม..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technician */}
            <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xxs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ช่างผู้รับผิดชอบ (เลือกได้หลายคน)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">เลือก SKY, Jay Jay, CHAINS หรืออื่นๆ</span>
              </label>
              
              <div className="flex flex-wrap gap-2">
                {["SKY", "Jay Jay", "CHAINS"].map((tech) => {
                  const isSelected = selectedTechs.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTechs(selectedTechs.filter((t) => t !== tech));
                        } else {
                          setSelectedTechs([...selectedTechs, tech]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{isSelected ? "✓" : "+"}</span>
                      <span>{tech}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setHasCustomTech(!hasCustomTech)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    hasCustomTech
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{hasCustomTech ? "✓" : "+"}</span>
                  <span>อื่นๆ...</span>
                </button>
              </div>

              {hasCustomTech && (
                <div className="mt-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    placeholder="พิมพ์ระบุชื่อช่างเพิ่มเติม เช่น ช่างภายนอก / ช่างเอก"
                    value={customTech}
                    onChange={(e) => setCustomTech(e.target.value)}
                    className="w-full px-3 py-1.5 border border-purple-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1">
                สถานะงานซ่อม
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={JobStatus.PENDING}>รอเริ่มงาน (PENDING)</option>
                <option value={JobStatus.IN_PROGRESS}>กำลังซ่อมแซม (IN_PROGRESS)</option>
                <option value={JobStatus.UNDER_REVIEW}>รอตรวจสอบ (UNDER_REVIEW)</option>
                <option value={JobStatus.COMPLETED}>เสร็จสิ้นเรียบร้อย (COMPLETED)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Appointment Date */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>วันที่นัดเข้าซ่อม</span>
              </label>
              <input
                type="date"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              />
            </div>

            {/* Appointment Time */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>เวลาเข้าทำงาน</span>
              </label>
              <input
                type="time"
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1">
                ระดับความสำคัญ (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white cursor-pointer"
              >
                <option value="Low">Low (ปกติ / ต่ำ)</option>
                <option value="Normal">Normal (ปกติ)</option>
                <option value="High">High (สูง / ด่วน)</option>
                <option value="Critical">Critical (วิกฤต / ด่วนที่สุด 🚨)</option>
                {/* Legacy fallbacks */}
                {!["Low", "Normal", "High", "Critical"].includes(priority) && (
                  <option value={priority}>{priority}</option>
                )}
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3">
            <span className="text-xs font-bold text-emerald-900 block flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>ประมาณการค่าบริการ & ยอดจ่ายเงินช่าง</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  ค่าบริการประมาณการ (บาท)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  ยอดจ่ายช่างจริง (บาท)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  วิธีชำระเงินให้ช่าง
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="ยังไม่ได้ชำระ">ยังไม่ได้ชำระ</option>
                  <option value="เงินสด">💵 เงินสด</option>
                  <option value="โอนเงิน">🏦 โอนเงิน</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xxs font-bold text-slate-700 mb-1">
              บันทึกเพิ่มเติม / หมายเหตุของแอดมิน
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุภายใน..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
