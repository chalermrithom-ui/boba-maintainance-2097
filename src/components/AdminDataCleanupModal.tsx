import React, { useState, useMemo } from "react";
import { RepairJob, JobStatus, UserRole, MaintenanceLog } from "../types";
import {
  X,
  Trash2,
  AlertTriangle,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  Filter,
  Check,
  RotateCcw,
  Layers,
  ShieldAlert,
  Archive
} from "lucide-react";

export interface AdminDataCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairs: RepairJob[];
  imageBlobCache?: Record<string, string>;
  onExecuteCleanup: (
    cleanedJobIds: string[],
    logSummary: string,
    reclaimedBytes: number
  ) => Promise<void>;
  userRole: UserRole;
}

export type CleanupFilterMode = "both" | "cancelled_only" | "older_6m_only";

export const AdminDataCleanupModal: React.FC<AdminDataCleanupModalProps> = ({
  isOpen,
  onClose,
  repairs,
  imageBlobCache,
  onExecuteCleanup,
  userRole,
}) => {
  const [filterMode, setFilterMode] = useState<CleanupFilterMode>("both");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<{
    count: number;
    spaceStr: string;
    logMessage: string;
  } | null>(null);

  // Calculate 6 months ago cut-off date
  const sixMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date;
  }, []);

  // Classify candidate jobs
  const analysis = useMemo(() => {
    let cancelledJobs: RepairJob[] = [];
    let olderJobs: RepairJob[] = [];

    repairs.forEach((job) => {
      const isCancelled =
        job.status === JobStatus.CANCELLED ||
        job.status === ("ยกเลิก" as JobStatus);

      // Determine job reference date
      const dateStr = job.apptDate || job.workDate || job.createdAt || job.updatedAt;
      let isOlderThan6Months = false;
      if (dateStr) {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime()) && parsedDate < sixMonthsAgo) {
          isOlderThan6Months = true;
        }
      }

      if (isCancelled) {
        cancelledJobs.push(job);
      }
      if (isOlderThan6Months) {
        olderJobs.push(job);
      }
    });

    // Candidates based on filter mode
    let targetJobs: RepairJob[] = [];
    if (filterMode === "both") {
      const targetMap = new Map<string, RepairJob>();
      cancelledJobs.forEach((j) => targetMap.set(j.id, j));
      olderJobs.forEach((j) => targetMap.set(j.id, j));
      targetJobs = Array.from(targetMap.values());
    } else if (filterMode === "cancelled_only") {
      targetJobs = cancelledJobs;
    } else if (filterMode === "older_6m_only") {
      targetJobs = olderJobs;
    }

    // Calculate estimated storage size (bytes)
    let totalBytes = 0;
    targetJobs.forEach((job) => {
      // Base JSON structure size
      const jsonStr = JSON.stringify(job);
      totalBytes += new Blob([jsonStr]).size;

      // Image assets size estimation
      const imgFields = [
        job.beforeImg,
        job.afterImg,
        job.paymentProofImg,
        job.customerSignature,
        job.techSignature,
      ];

      imgFields.forEach((field) => {
        if (field) {
          field.split(",").forEach((id) => {
            const trimmed = id.trim();
            if (trimmed) {
              if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
                totalBytes += trimmed.length * 0.75;
              } else if (imageBlobCache && imageBlobCache[trimmed]) {
                totalBytes += imageBlobCache[trimmed].length * 0.75;
              } else {
                totalBytes += 250 * 1024; // ~250KB average asset size per image
              }
            }
          });
        }
      });
    });

    // Format human-readable storage string
    let storageStr = "0 KB";
    if (totalBytes >= 1048576) {
      storageStr = `${(totalBytes / 1048576).toFixed(2)} MB`;
    } else if (totalBytes > 0) {
      storageStr = `${(totalBytes / 1024).toFixed(1)} KB`;
    }

    return {
      cancelledCount: cancelledJobs.length,
      olderCount: olderJobs.length,
      targetJobs,
      targetIds: targetJobs.map((j) => j.id),
      totalBytes,
      storageStr,
      sixMonthsAgoStr: sixMonthsAgo.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
  }, [repairs, filterMode, sixMonthsAgo, imageBlobCache]);

  if (!isOpen) return null;

  const handleRunCleanup = async () => {
    if (analysis.targetIds.length === 0) return;

    setIsProcessing(true);
    try {
      const modeLabel =
        filterMode === "both"
          ? "งานยกเลิกและงานเก่า (>6 เดือน)"
          : filterMode === "cancelled_only"
          ? "งานยกเลิก (Cancelled Jobs)"
          : "งานเก่ากว่า 6 เดือน (>6 Months Jobs)";

      const logMsg = `🧹 ล้างข้อมูลขยะระบบ (Bulk System Storage Cleanup): ลบ ${modeLabel} จำนวน ${analysis.targetIds.length} รายการสำเร็จ | คืนพื้นที่จัดเก็บข้อมูล (Reclaimed Storage): ${analysis.storageStr}`;

      await onExecuteCleanup(analysis.targetIds, logMsg, analysis.totalBytes);

      setSuccessResult({
        count: analysis.targetIds.length,
        spaceStr: analysis.storageStr,
        logMessage: logMsg,
      });
      setIsConfirming(false);
    } catch (err: any) {
      console.error("Cleanup error:", err);
      alert(`เกิดข้อผิดพลาดในการล้างข้อมูล: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto text-left">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-6 py-4 text-white flex justify-between items-center border-b border-rose-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/30 rounded-2xl text-rose-400 shadow-inner">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center space-x-2 font-display">
                <span>เครื่องมือล้างข้อมูลขยะ & เพิ่มพื้นที่จัดเก็บ</span>
                <span className="bg-rose-500/30 text-rose-300 border border-rose-400/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-black uppercase">
                  Admin Only
                </span>
              </h3>
              <p className="text-slate-300 text-xs mt-0.5">
                Bulk System Storage Cleanup Tool & Log Reclaim Summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5">

          {/* SUCCESS RESULT BANNER */}
          {successResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 animate-fadeIn">
              <div className="flex items-center space-x-3 text-emerald-900">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base">
                    ล้างข้อมูลและคืนพื้นที่จัดเก็บสำเร็จแล้ว!
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    บันทึกสรุปการคืนพื้นที่ใน Audit Logs เรียบร้อยแล้ว
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="bg-white p-3 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    รายการที่ถูกลบออก (Cleared Jobs)
                  </span>
                  <span className="text-lg font-black text-emerald-900">
                    {successResult.count} รายการ
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    พื้นที่จัดเก็บที่คืนได้ (Reclaimed Space)
                  </span>
                  <span className="text-lg font-black text-emerald-900">
                    ~{successResult.spaceStr}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-100/60 rounded-xl text-xs font-semibold text-emerald-900 leading-relaxed border border-emerald-200">
                📌 <strong>รายละเอียดใน Log:</strong> {successResult.logMessage}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessResult(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STATUS SUMMARY STATS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-rose-600 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      งานยกเลิก
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {analysis.cancelledCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    รายการ (Status: Cancelled)
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-amber-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      เก่ากว่า 6 เดือน
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {analysis.olderCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">
                    รายการ (&lt; {analysis.sixMonthsAgoStr})
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl">
                  <div className="flex items-center space-x-1.5 text-indigo-700 mb-1">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      พื้นที่ที่คืนได้
                    </span>
                  </div>
                  <span className="text-xl font-black text-indigo-950 font-mono">
                    ~{analysis.storageStr}
                  </span>
                  <span className="text-[10px] text-indigo-600 block font-medium">
                    (Est. Reclaimed Storage)
                  </span>
                </div>
              </div>

              {/* FILTER SELECTION */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เลือกเงื่อนไขการล้างข้อมูล (Cleanup Filter Mode):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterMode("both")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      filterMode === "both"
                        ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/30 text-rose-950 font-bold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">⚡ 1-Click ล้างทั้งหมด</span>
                      {filterMode === "both" && (
                        <Check className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ลบทั้งงานยกเลิก และงานเก่า &gt; 6 เดือน
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode("cancelled_only")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      filterMode === "cancelled_only"
                        ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/30 text-rose-950 font-bold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">🚫 เฉพาะงานยกเลิก</span>
                      {filterMode === "cancelled_only" && (
                        <Check className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ลบเฉพาะงานสถานะ 'Cancelled'
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode("older_6m_only")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      filterMode === "older_6m_only"
                        ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/30 text-rose-950 font-bold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">⏳ เฉพาะงาน &gt; 6 เดือน</span>
                      {filterMode === "older_6m_only" && (
                        <Check className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ลบงานที่เก่ากว่า 6 เดือน
                    </span>
                  </button>
                </div>
              </div>

              {/* TARGET CANDIDATES PREVIEW LIST */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <Archive className="w-4 h-4 text-slate-600" />
                    <span>ตัวอย่างรายการงานซ่อมที่จะถูกลบออก ({analysis.targetJobs.length} รายการ)</span>
                  </span>
                  <span className="font-mono font-extrabold text-rose-600 text-xs">
                    ~{analysis.storageStr}
                  </span>
                </div>

                {analysis.targetJobs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    ✨ ไม่พบรายการงานซ่อมที่ตรงตามเงื่อนไขนี้ (ระบบสะอาดเรียบร้อยแล้ว)
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                    {analysis.targetJobs.slice(0, 15).map((job) => (
                      <div
                        key={job.id}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold text-slate-900">{job.id}</span>
                          <span className="text-slate-500">| ห้อง {job.roomNo}</span>
                          <span className="text-slate-400 truncate max-w-[140px]">
                            ({job.details})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                              job.status === JobStatus.CANCELLED || job.status === ("ยกเลิก" as JobStatus)
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {job.apptDate || job.workDate || "ไม่ระบุวัน"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {analysis.targetJobs.length > 15 && (
                      <div className="text-center text-[11px] text-slate-400 font-sans italic py-1">
                        ...และอีก {analysis.targetJobs.length - 15} รายการ
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CONFIRMATION STEP */}
              {isConfirming ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-2 text-rose-900 text-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black">⚠️ ยืนยันการลบข้อมูลถาวร (Permanent Deletion)</p>
                      <p className="mt-0.5 text-slate-700 font-medium">
                        คุณกำลังจะลบงานซ่อมจำนวน <strong>{analysis.targetIds.length} รายการ</strong> ออกจากฐานข้อมูล ซึ่งการลบนี้จะมีผลทันทีและไม่สามารถกู้คืนได้ และจะบันทึกสรุปพื้นที่จัดเก็บที่คืนได้ลงในระบบ Log อัตโนมัติ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirming(false)}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleRunCleanup}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>กำลังล้างข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>ยืนยันลบ {analysis.targetIds.length} รายการ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                    💡 ระบบจะบันทึก Log การล้างข้อมูลและสรุปพื้นที่ความจุให้สืบค้นย้อนหลังได้
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirming(true)}
                      disabled={analysis.targetIds.length === 0}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ล้างข้อมูลและคืนพื้นที่ (~{analysis.storageStr})</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
