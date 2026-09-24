import React, { useState } from "react";
import { RepairJob, JobStatus, JobPriority, UserRole } from "../types";
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Home,
  User as UserIcon,
  Calendar,
  QrCode,
  Pencil,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  CheckSquare,
  Square,
  Flame,
  FileSearch,
  ArrowRight,
  Loader2,
  CreditCard,
  Printer
} from "lucide-react";

interface KanbanBoardProps {
  repairs: RepairJob[];
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onOpenUpdateModal: (job: RepairJob) => void;
  onOpenQrModal: (job: RepairJob) => void;
  onOpenEditModal: (job: RepairJob) => void;
  onOpenPaymentModal?: (job: RepairJob) => void;
  onOpenExportPdfModal?: (job: RepairJob) => void;
  userRole: UserRole;
  selectedJobIds: string[];
  onToggleSelectJob: (jobId: string) => void;
  isSyncing?: boolean;
}

interface ColumnConfig {
  id: JobStatus;
  title: string;
  icon: React.ReactNode;
  headerBg: string;
  headerText: string;
  badgeBg: string;
  borderCol: string;
  hoverBg: string;
  accentCol: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: JobStatus.PENDING,
    title: "รอดำเนินการ",
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    headerBg: "bg-amber-500/10",
    headerText: "text-amber-800",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
    borderCol: "border-amber-200",
    hoverBg: "bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/40",
    accentCol: "bg-amber-500"
  },
  {
    id: JobStatus.IN_PROGRESS,
    title: "กำลังดำเนินการ",
    icon: <Wrench className="w-4 h-4 text-blue-600" />,
    headerBg: "bg-blue-500/10",
    headerText: "text-blue-800",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
    borderCol: "border-blue-200",
    hoverBg: "bg-blue-50/80 border-blue-400 ring-2 ring-blue-300/40",
    accentCol: "bg-blue-500"
  },
  {
    id: JobStatus.UNDER_REVIEW,
    title: "รอตรวจสอบงาน",
    icon: <FileSearch className="w-4 h-4 text-purple-600" />,
    headerBg: "bg-purple-500/10",
    headerText: "text-purple-800",
    badgeBg: "bg-purple-100 text-purple-900 border-purple-300",
    borderCol: "border-purple-200",
    hoverBg: "bg-purple-50/80 border-purple-400 ring-2 ring-purple-300/40",
    accentCol: "bg-purple-500"
  },
  {
    id: JobStatus.COMPLETED,
    title: "เสร็จสิ้นเรียบร้อย",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    headerBg: "bg-emerald-500/10",
    headerText: "text-emerald-800",
    badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-300",
    borderCol: "border-emerald-200",
    hoverBg: "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300/40",
    accentCol: "bg-emerald-500"
  }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  repairs,
  onStatusChange,
  onOpenUpdateModal,
  onOpenQrModal,
  onOpenEditModal,
  onOpenPaymentModal,
  onOpenExportPdfModal,
  userRole,
  selectedJobIds,
  onToggleSelectJob,
  isSyncing = false
}) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<JobStatus | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Helper for priority ranking
  const getPriorityBadge = (priority: JobPriority) => {
    switch (priority) {
      case JobPriority.CRITICAL:
        return (
          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Critical</span>
          </span>
        );
      case JobPriority.HIGH:
        return (
          <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
            High
          </span>
        );
      case JobPriority.NORMAL:
        return (
          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Normal
          </span>
        );
      case JobPriority.LOW:
        return (
          <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggedJobId(jobId);
    e.dataTransfer.setData("text/plain", jobId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colStatus: JobStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    setDraggedJobId(null);

    if (!jobId) return;

    const targetJob = repairs.find((r) => r.id === jobId);
    if (!targetJob || targetJob.status === targetStatus) return;

    setUpdatingJobId(jobId);
    try {
      await onStatusChange(jobId, targetStatus);
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Manual Status Shift Handlers for Mobile / Click
  const handleShiftStatus = async (job: RepairJob, direction: "prev" | "next") => {
    const statusOrder: JobStatus[] = [
      JobStatus.PENDING,
      JobStatus.IN_PROGRESS,
      JobStatus.UNDER_REVIEW,
      JobStatus.COMPLETED
    ];

    const currentIndex = statusOrder.indexOf(job.status);
    if (currentIndex === -1) return;

    let targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= statusOrder.length) return;

    const targetStatus = statusOrder[targetIndex];
    setUpdatingJobId(job.id);
    try {
      await onStatusChange(job.id, targetStatus);
    } finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Help Instructions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <GripVertical className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="font-bold text-slate-100 block">
              กระดาน Kanban แบบ Drag and Drop สลับสถานะงานซ่อม
            </span>
            <span className="text-slate-400 text-xxs block">
              กดค้างที่การ์ดแล้ว <strong className="text-amber-300 font-semibold">"ลากไปวาง"</strong> ในคอลัมน์เป้าหมาย หรือใช้ปุ่มลูกศรเพื่อสลับสถานะทันที
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xxs font-semibold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">ซิงค์การลากวางลงฐานข้อมูลเซิร์ฟเวอร์แบบ Real-time</span>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colJobs = repairs.filter((r) => r.status === col.id);
          const isTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-slate-50/80 rounded-2xl border-2 transition-all duration-200 flex flex-col min-h-[580px] overflow-hidden ${
                isTarget
                  ? col.hoverBg
                  : `${col.borderCol} shadow-2xs hover:border-slate-300`
              }`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-b border-slate-200/80 flex items-center justify-between ${col.headerBg}`}>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200">
                    {col.icon}
                  </div>
                  <h3 className={`font-display font-extrabold text-sm ${col.headerText}`}>
                    {col.title}
                  </h3>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${col.badgeBg}`}>
                  {colJobs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {colJobs.length === 0 ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center text-xs text-slate-400 my-4 transition-all ${
                      isTarget ? "border-blue-500 bg-blue-50/50 text-blue-600 font-bold" : "border-slate-200"
                    }`}
                  >
                    {isTarget ? "ปล่อยการ์ดเพื่อย้ายมาคอลัมน์นี้ ✨" : "ไม่มีงานซ่อมในสถานะนี้"}
                  </div>
                ) : (
                  colJobs.map((job) => {
                    const isSelected = selectedJobIds.includes(job.id);
                    const isCurrentlyDragged = draggedJobId === job.id;
                    const isJobUpdating = updatingJobId === job.id;

                    const colIndex = COLUMNS.findIndex((c) => c.id === col.id);
                    const canMovePrev = colIndex > 0;
                    const canMoveNext = colIndex < COLUMNS.length - 1;

                    return (
                      <div
                        key={job.id}
                        draggable={!isSyncing}
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onDragEnd={() => {
                          setDraggedJobId(null);
                          setDragOverColumn(null);
                        }}
                        className={`bg-white rounded-xl border p-3.5 shadow-2xs space-y-2.5 transition-all duration-200 cursor-grab active:cursor-grabbing relative hover:shadow-md hover:-translate-y-0.5 group ${
                          isCurrentlyDragged ? "opacity-40 scale-95 border-blue-500 shadow-lg" : ""
                        } ${
                          isSelected
                            ? "border-2 border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-400/30"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Loading Spinner overlay when updating status */}
                        {isJobUpdating && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-xl flex items-center justify-center z-10 space-x-2 text-blue-600 font-bold text-xs">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>กำลังบันทึก...</span>
                          </div>
                        )}

                        {/* Top Header: Condo Name & Checkbox */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelectJob(job.id);
                              }}
                              className={`p-1 rounded transition-all cursor-pointer flex-shrink-0 ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-300 hover:text-slate-600"
                              }`}
                              title={isSelected ? "ยกเลิกเลือกงานนี้" : "เลือกงานนี้"}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="font-extrabold text-xs text-slate-900 truncate block font-display" title={job.condoName}>
                              {job.condoName.split(" (")[0]}
                            </span>
                          </div>

                          {getPriorityBadge(job.priority)}
                        </div>

                        {/* Room Number & Job ID */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-black border border-amber-200">
                            <Home className="w-3 h-3 text-amber-700" />
                            <span>ห้อง {job.roomNo}</span>
                          </div>

                          <span className="font-mono text-xxs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {job.id}
                          </span>
                        </div>

                        {/* Problem description */}
                        <p className="text-xs text-slate-700 line-clamp-2 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {job.problem}
                        </p>

                        {/* Appointment & Technician */}
                        <div className="space-y-1 text-xxs text-slate-500">
                          <div className="flex items-center space-x-1.5">
                            <UserIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              ช่าง: <strong className="text-slate-700">{job.technician || "ยังไม่ระบุ"}</strong>
                            </span>
                          </div>
                          {(job.apptDate || job.workDate) && (
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>
                                นัด: <strong className="text-slate-700">{job.apptDate || job.workDate}</strong> {job.apptTime ? `(${job.apptTime} น.)` : ""}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Buttons & Status Shifts */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          {/* Left Arrow - Move Prev */}
                          <button
                            type="button"
                            disabled={!canMovePrev || isJobUpdating || isSyncing}
                            onClick={() => handleShiftStatus(job, "prev")}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all flex items-center justify-center border border-slate-200"
                            title={canMovePrev ? `สลับย้อนกลับไป: ${COLUMNS[colIndex - 1]?.title}` : "ไม่สามารถถอยกลับได้"}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Middle Buttons: Modal Triggers */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onOpenUpdateModal(job)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xxs font-bold rounded-md transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
                              title="อัปเดตสถานะ/บันทึกการซ่อม"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>อัปเดต</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenQrModal(job)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer border border-slate-200"
                              title="ดู QR Code ติดตามงาน"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            {userRole === UserRole.ADMIN && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(job)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer border border-slate-200"
                                title="แก้ไขรายละเอียดงาน (แอดมิน)"
                              >
                                <Pencil className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                            )}

                            {onOpenPaymentModal && (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentModal(job)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-all cursor-pointer border border-emerald-200"
                                title="บันทึกการจ่ายเงินช่าง"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}
                          </div>

                          {/* Right Arrow - Move Next */}
                          <button
                            type="button"
                            disabled={!canMoveNext || isJobUpdating || isSyncing}
                            onClick={() => handleShiftStatus(job, "next")}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all flex items-center justify-center border border-slate-200"
                            title={canMoveNext ? `สลับถัดไป: ${COLUMNS[colIndex + 1]?.title}` : "ถึงสถานะสุดท้ายแล้ว"}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
