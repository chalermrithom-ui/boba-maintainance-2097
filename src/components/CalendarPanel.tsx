import React, { useState, useEffect } from "react";
import { RepairJob, JobStatus, RecurringSchedule } from "../types";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Building2,
  Eye,
  AlertCircle,
  Sparkles,
  CalendarDays,
  ListFilter,
  Repeat,
  RotateCw,
  Play,
  Pause,
  Trash2,
  Edit3,
  Check,
  PlusCircle,
  SlidersHorizontal,
  X,
  Zap,
  ShieldCheck,
  Users,
  ArrowRightLeft,
  BarChart3,
  UserCheck,
  UserX,
  Activity,
  Flame,
  ArrowUpRight
} from "lucide-react";

interface CalendarPanelProps {
  repairs: RepairJob[];
  onSelectJob: (job: RepairJob) => void;
  onNewJobWithDate?: (dateStr: string) => void;
  onCreateJob?: (jobData: Partial<RepairJob>, files: File[]) => Promise<void>;
  onUpdateStatus?: (jobId: string, newStatus: JobStatus) => void;
  onReassignTechnician?: (jobId: string, newTechnician: string, newApptDate?: string) => Promise<void>;
}

type CalendarViewMode = "month" | "list" | "recurring" | "technician";

const DEFAULT_RECURRING_SCHEDULES: RecurringSchedule[] = [
  {
    id: "REC-1001",
    title: "ตรวจเช็คและล้างฟิลเตอร์เครื่องปรับอากาศประจำเดือน",
    condoName: "ลุมพินี วิลล์ (Lumpini Ville)",
    roomNo: "ส่วนกลาง - ล็อบบี้ชั้น 1",
    frequency: "MONTHLY",
    nextDueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    technician: "SKY",
    details: "1. ทำความสะอาดแผ่นกรองอากาศ\n2. เช็คแรงดันน้ำยาแอร์และอุณหภูมิลมเย็น\n3. ตรวจสอบกระแสไฟฟ้าคอมเพรสเซอร์",
    priority: "งานปกติ",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "REC-1002",
    title: "บำรุงรักษาและทดสอบระบบลิฟต์โดยสารประจำไตรมาส",
    condoName: "แอลพีเอ็น คอนโด (LPN Place)",
    roomNo: "ส่วนกลาง - ลิฟต์โดยสาร L1, L2",
    frequency: "EVERY_3_MONTHS",
    nextDueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    technician: "Jay Jay",
    details: "1. เช็คระบบเบรกและความตึงสลิงลิฟต์\n2. ทดสอบระบบไฟสำรองฉุกเฉินในตัวลิฟต์\n3. หยอดน้ำมันรางลิฟต์และเช็คเซ็นเซอร์ประตู",
    priority: "งานเร่งด่วน",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "REC-1003",
    title: "ล้างถังเก็บน้ำประปาส่วนกลางและตรวจค่าน้ำประปา",
    condoName: "แอสปาย สุขุมวิท (Aspire Sukhumvit)",
    roomNo: "ส่วนกลาง - ถังพักน้ำดาดฟ้า",
    frequency: "EVERY_6_MONTHS",
    nextDueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
    technician: "CHAINS",
    details: "1. ดูดตะกอนก้นถังพักน้ำส่วนกลาง\n2. เติมคลอรีนตามมาตรฐานสุขาภิบาล\n3. ตรวจสอบปั๊มน้ำเพิ่มแรงดัน (Booster Pump)",
    priority: "งานปกติ",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  repairs,
  onSelectJob,
  onNewJobWithDate,
  onCreateJob,
  onUpdateStatus,
  onReassignTechnician,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedCondo, setSelectedCondo] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTechnician, setSelectedTechnician] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Recurring schedules state
  const [schedules, setSchedules] = useState<RecurringSchedule[]>(() => {
    try {
      const saved = localStorage.getItem("boba_recurring_schedules");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load recurring schedules from localStorage", e);
    }
    return DEFAULT_RECURRING_SCHEDULES;
  });

  // Modal State for Recurring Schedule Form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<RecurringSchedule | null>(null);
  const [actionStatusMsg, setActionStatusMsg] = useState<string>("");

  // Drag and Drop Job Rescheduling State
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  const [dragRescheduleStatus, setDragRescheduleStatus] = useState<string | null>(null);

  // Quick Reschedule Modal State (for touch / click)
  const [rescheduleModalJob, setRescheduleModalJob] = useState<RepairJob | null>(null);
  const [rescheduleTargetDate, setRescheduleTargetDate] = useState<string>("");

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCondo, setFormCondo] = useState<string>("ลุมพินี วิลล์ (Lumpini Ville)");
  const [formRoom, setFormRoom] = useState<string>("ส่วนกลาง");
  const [formFrequency, setFormFrequency] = useState<RecurringSchedule["frequency"]>("MONTHLY");
  const [formNextDueDate, setFormNextDueDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [formTechnician, setFormTechnician] = useState<string>("SKY");
  const [formPriority, setFormPriority] = useState<string>("งานปกติ");
  const [formDetails, setFormDetails] = useState<string>("");

  // Save schedules to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("boba_recurring_schedules", JSON.stringify(schedules));
    } catch (e) {
      console.warn("Could not save recurring schedules to localStorage", e);
    }
  }, [schedules]);

  // Thai month names
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Unique lists for filters & schedule matrix
  const condos = Array.from(new Set(repairs.map((r) => r.condoName))).filter(Boolean);
  const defaultTechs = [
    "SKY",
    "Jay Jay",
    "CHAINS"
  ];
  const technicians = Array.from(
    new Set([
      ...defaultTechs,
      ...repairs.map((r) => r.technician),
      ...schedules.map((s) => s.technician)
    ])
  ).filter((t) => t && t !== "ยังไม่ได้ระบุช่าง");

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split("T")[0]);
  };

  // Navigate Days for Technician Schedule view
  const handlePrevDay = () => {
    const base = new Date(selectedDateStr || new Date().toISOString().split("T")[0]);
    base.setDate(base.getDate() - 1);
    const newStr = base.toISOString().split("T")[0];
    setSelectedDateStr(newStr);
    setCurrentDate(base);
  };

  const handleNextDay = () => {
    const base = new Date(selectedDateStr || new Date().toISOString().split("T")[0]);
    base.setDate(base.getDate() + 1);
    const newStr = base.toISOString().split("T")[0];
    setSelectedDateStr(newStr);
    setCurrentDate(base);
  };

  // Helper to advance date by frequency
  const getNextDate = (currentDateStr: string, frequency: RecurringSchedule["frequency"]): string => {
    const d = new Date(currentDateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    
    switch (frequency) {
      case "WEEKLY":
        d.setDate(d.getDate() + 7);
        break;
      case "MONTHLY":
        d.setMonth(d.getMonth() + 1);
        break;
      case "EVERY_3_MONTHS":
        d.setMonth(d.getMonth() + 3);
        break;
      case "EVERY_6_MONTHS":
        d.setMonth(d.getMonth() + 6);
        break;
      case "YEARLY":
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    return d.toISOString().split("T")[0];
  };

  const getFrequencyLabel = (freq: RecurringSchedule["frequency"]): string => {
    switch (freq) {
      case "WEEKLY": return "ทุกสัปดาห์";
      case "MONTHLY": return "ทุกเดือน";
      case "EVERY_3_MONTHS": return "ทุก 3 เดือน (ไตรมาส)";
      case "EVERY_6_MONTHS": return "ทุก 6 เดือน (ครึ่งปี)";
      case "YEARLY": return "ทุกปี";
      default: return freq;
    }
  };

  // Open Create/Edit Schedule Modal
  const handleOpenModal = (sched?: RecurringSchedule) => {
    if (sched) {
      setEditingSchedule(sched);
      setFormTitle(sched.title);
      setFormCondo(sched.condoName);
      setFormRoom(sched.roomNo);
      setFormFrequency(sched.frequency);
      setFormNextDueDate(sched.nextDueDate);
      setFormTechnician(sched.technician);
      setFormPriority(sched.priority);
      setFormDetails(sched.details);
    } else {
      setEditingSchedule(null);
      setFormTitle("");
      setFormCondo(condos[0] || "ลุมพินี วิลล์ (Lumpini Ville)");
      setFormRoom("ส่วนกลาง");
      setFormFrequency("MONTHLY");
      setFormNextDueDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
      setFormTechnician(technicians[0] || "ช่างสมชาย (ช่างประจำอาคาร)");
      setFormPriority("งานปกติ");
      setFormDetails("");
    }
    setIsModalOpen(true);
  };

  // Save Schedule From Modal
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingSchedule) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingSchedule.id
            ? {
                ...s,
                title: formTitle.trim(),
                condoName: formCondo,
                roomNo: formRoom,
                frequency: formFrequency,
                nextDueDate: formNextDueDate,
                technician: formTechnician,
                priority: formPriority,
                details: formDetails,
              }
            : s
        )
      );
      setActionStatusMsg("✅ บันทึกการแก้ไขแผนงานบำรุงรักษาสำเร็จ!");
    } else {
      const newSched: RecurringSchedule = {
        id: `REC-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        condoName: formCondo,
        roomNo: formRoom,
        frequency: formFrequency,
        nextDueDate: formNextDueDate,
        technician: formTechnician,
        priority: formPriority,
        details: formDetails,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setSchedules((prev) => [newSched, ...prev]);
      setActionStatusMsg("✅ เพิ่มแผนงานบำรุงรักษาเชิงป้องกันสำเร็จ!");
    }

    setIsModalOpen(false);
    setTimeout(() => setActionStatusMsg(""), 4000);
  };

  // Toggle Active State
  const handleToggleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแผนงานบำรุงรักษานี้?")) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Generate Actual Repair Job From Recurring Schedule
  const handleGenerateJobFromSchedule = async (schedule: RecurringSchedule) => {
    if (!onCreateJob) {
      alert("ไม่พบฟังก์ชันการสร้างงานซ่อมในระบบ");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const jobPayload: Partial<RepairJob> = {
        workDate: today,
        apptDate: schedule.nextDueDate || today,
        apptTime: "09:00",
        condoName: schedule.condoName,
        roomNo: schedule.roomNo,
        details: `[งานบำรุงตามรอบ: ${getFrequencyLabel(schedule.frequency)}] ${schedule.title}\n\nรายการตรวจเช็ค:\n${schedule.details}`,
        technician: schedule.technician,
        priority: schedule.priority || "งานปกติ",
        status: JobStatus.PENDING,
      };

      await onCreateJob(jobPayload, []);

      // Calculate next due date and update schedule
      const nextDate = getNextDate(schedule.nextDueDate, schedule.frequency);
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id
            ? { ...s, lastGeneratedDate: today, nextDueDate: nextDate }
            : s
        )
      );

      setActionStatusMsg(`🎉 สร้างใบแจ้งซ่อมจริงสำหรับ "${schedule.title}" เรียบร้อยแล้ว! (กำหนดรอบถัดไป: ${nextDate})`);
      setTimeout(() => setActionStatusMsg(""), 5000);
    } catch (err: any) {
      console.error("Failed to generate recurring job:", err);
      alert("เกิดข้อผิดพลาดในการสร้างงานซ่อม: " + err.message);
    }
  };

  // Auto Generate All Due Schedules
  const handleAutoGenerateDueJobs = async () => {
    const today = new Date().toISOString().split("T")[0];
    const dueSchedules = schedules.filter(
      (s) => s.isActive && s.nextDueDate <= today
    );

    if (dueSchedules.length === 0) {
      setActionStatusMsg("ℹ️ ไม่พบแผนงานที่ถึงกำหนด ณ วันนี้");
      setTimeout(() => setActionStatusMsg(""), 3000);
      return;
    }

    let count = 0;
    for (const sched of dueSchedules) {
      await handleGenerateJobFromSchedule(sched);
      count++;
    }

    setActionStatusMsg(`⚡ สร้างใบแจ้งซ่อมสำเร็จรวม ${count} รายการ!`);
    setTimeout(() => setActionStatusMsg(""), 5000);
  };

  // Filter repairs
  const filteredRepairs = repairs.filter((r) => {
    if (selectedCondo !== "ALL" && r.condoName !== selectedCondo) return false;
    if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
    if (selectedTechnician !== "ALL" && r.technician !== selectedTechnician) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = r.id.toLowerCase().includes(term);
      const matchRoom = r.roomNo.toLowerCase().includes(term);
      const matchDetails = (r.details || "").toLowerCase().includes(term);
      const matchTech = (r.technician || "").toLowerCase().includes(term);
      if (!matchId && !matchRoom && !matchDetails && !matchTech) return false;
    }
    return true;
  });

  // Days calculations for Month View
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Prev month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const pDay = prevMonthLastDay - i;
    const pDate = new Date(year, month - 1, pDay);
    const dateStr = pDate.toISOString().split("T")[0];
    calendarCells.push({
      dateStr,
      dayNum: pDay,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  const todayStr = new Date().toISOString().split("T")[0];
  for (let day = 1; day <= daysInMonth; day++) {
    const monthFormatted = String(month + 1).padStart(2, "0");
    const dayFormatted = String(day).padStart(2, "0");
    const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
    calendarCells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nDate = new Date(year, month + 1, day);
    const dateStr = nDate.toISOString().split("T")[0];
    calendarCells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Map repairs by date
  const repairsByDate: { [dateStr: string]: RepairJob[] } = {};
  filteredRepairs.forEach((r) => {
    const targetDate = r.apptDate || r.workDate;
    if (targetDate) {
      if (!repairsByDate[targetDate]) {
        repairsByDate[targetDate] = [];
      }
      repairsByDate[targetDate].push(r);
    }
  });

  // Map active recurring schedules by date
  const recurringByDate: { [dateStr: string]: RecurringSchedule[] } = {};
  schedules
    .filter((s) => s.isActive)
    .forEach((s) => {
      if (!recurringByDate[s.nextDueDate]) {
        recurringByDate[s.nextDueDate] = [];
      }
      recurringByDate[s.nextDueDate].push(s);
    });

  // Selected date jobs & recurring list
  const selectedDateJobs = selectedDateStr ? repairsByDate[selectedDateStr] || [] : [];
  const selectedDateRecurring = selectedDateStr ? recurringByDate[selectedDateStr] || [] : [];

  // Summary Metrics
  const todayJobsCount = (repairsByDate[todayStr] || []).length;
  const pendingJobsCount = filteredRepairs.filter((r) => r.status === JobStatus.PENDING).length;
  const inProgressJobsCount = filteredRepairs.filter((r) => r.status === JobStatus.IN_PROGRESS).length;
  const completedJobsCount = filteredRepairs.filter((r) => r.status === JobStatus.COMPLETED).length;
  const activeSchedulesCount = schedules.filter((s) => s.isActive).length;

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return "bg-amber-100 text-amber-800 border-amber-300";
      case JobStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case JobStatus.UNDER_REVIEW:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case JobStatus.COMPLETED:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return "รอดำเนินการ";
      case JobStatus.IN_PROGRESS:
        return "กำลังซ่อม";
      case JobStatus.UNDER_REVIEW:
        return "รอตรวจงาน";
      case JobStatus.COMPLETED:
        return "เสร็จสิ้น";
      default:
        return status;
    }
  };

  // Drag and Drop Event Handlers for Rescheduling
  const handleJobDragStart = (e: React.DragEvent, job: RepairJob) => {
    e.stopPropagation();
    setDraggedJobId(job.id);
    e.dataTransfer.setData("text/plain", job.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ jobId: job.id, date: job.apptDate || job.workDate })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDateCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDateCellDragEnter = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDateStr(dateStr);
  };

  const handleDateCellDragLeave = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dragOverDateStr === dateStr) {
      setDragOverDateStr(null);
    }
  };

  const handleDateCellDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDateStr(null);

    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    setDraggedJobId(null);

    if (!jobId) return;

    const targetJob = repairs.find((r) => r.id === jobId);
    if (!targetJob) return;

    const currentApptDate = targetJob.apptDate || targetJob.workDate;
    if (currentApptDate === targetDateStr) {
      return; // Already on this date
    }

    try {
      if (onReassignTechnician) {
        await onReassignTechnician(
          targetJob.id,
          targetJob.technician || "ยังไม่ได้ระบุ",
          targetDateStr
        );
      }
      setSelectedDateStr(targetDateStr);
      setDragRescheduleStatus(
        `⚡ เลื่อนวันนัดหมายงานซ่อม [${targetJob.id}] (ห้อง ${targetJob.roomNo}) มายังวันที่ ${targetDateStr} สำเร็จแล้วและอัปเดตบันทึกอัตโนมัติ!`
      );
      setTimeout(() => setDragRescheduleStatus(null), 6000);
    } catch (err: any) {
      console.error("Drop reschedule error:", err);
      alert(`เกิดข้อผิดพลาดในการเลื่อนวันนัดหมาย: ${err.message || err}`);
    }
  };

  const handleOpenQuickReschedule = (job: RepairJob) => {
    setRescheduleModalJob(job);
    setRescheduleTargetDate(job.apptDate || job.workDate || new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Message Banner */}
      {actionStatusMsg && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <span>{actionStatusMsg}</span>
          <button onClick={() => setActionStatusMsg("")} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">นัดหมายวันนี้</p>
            <h3 className="text-2xl font-black text-slate-900 font-display mt-0.5">{todayJobsCount}</h3>
            <span className="text-[10px] text-slate-500 font-medium">รายการในปฏิทิน</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <p className="text-xxs font-extrabold text-purple-600 uppercase tracking-wider">งานบำรุงตามรอบ</p>
            <h3 className="text-2xl font-black text-slate-900 font-display mt-0.5">{activeSchedulesCount}</h3>
            <span className="text-[10px] text-purple-700 font-medium">แผนงานเชิงป้องกัน</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Repeat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xxs font-extrabold text-amber-600 uppercase tracking-wider">รอดำเนินการ</p>
            <h3 className="text-2xl font-black text-slate-900 font-display mt-0.5">{pendingJobsCount}</h3>
            <span className="text-[10px] text-amber-700 font-medium">รอจัดคิวช่าง</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-xxs font-extrabold text-blue-600 uppercase tracking-wider">กำลังซ่อม</p>
            <h3 className="text-2xl font-black text-slate-900 font-display mt-0.5">{inProgressJobsCount}</h3>
            <span className="text-[10px] text-blue-700 font-medium">ช่างกำลังปฏิบัติงาน</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between border-l-4 border-l-emerald-500 col-span-2 lg:col-span-1">
          <div>
            <p className="text-xxs font-extrabold text-emerald-600 uppercase tracking-wider">เสร็จสิ้นแล้ว</p>
            <h3 className="text-2xl font-black text-slate-900 font-display mt-0.5">{completedJobsCount}</h3>
            <span className="text-[10px] text-emerald-700 font-medium">ปิดงานซ่อมบำรุงแล้ว</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Header Controls Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 text-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Month Navigation */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight font-display text-white flex items-center space-x-2">
                  <span>{thaiMonths[month]}</span>
                  <span className="text-blue-400 font-mono">พ.ศ. {year + 543}</span>
                </h2>
                <p className="text-xxs text-slate-400">
                  ปฏิทินนัดหมายและตารางงานบำรุงรักษาเชิงป้องกันตามรอบ (Preventative Maintenance)
                </p>
              </div>

              {/* Prev / Next Month Buttons */}
              <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-extrabold bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 self-start md:self-auto">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "month"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                มุมมองเดือน
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                มุมมองรายการ
              </button>
              <button
                onClick={() => setViewMode("recurring")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === "recurring"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-purple-300 hover:text-white hover:bg-purple-900/40"
                }`}
              >
                <Repeat className="w-3.5 h-3.5 text-purple-200" />
                <span>งานบำรุงตามรอบ ({schedules.length})</span>
              </button>
              <button
                onClick={() => setViewMode("technician")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  viewMode === "technician"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-300 hover:text-white hover:bg-emerald-900/40"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-200" />
                <span>ตารางงานช่าง (Technician Schedule)</span>
              </button>
            </div>
          </div>

          {/* Search & Filtering Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาตามห้อง, รหัส, รายละเอียด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Condo Filter */}
            <select
              value={selectedCondo}
              onChange={(e) => setSelectedCondo(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">🏢 ทุกอาคาร / คอนโด</option>
              {condos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">📌 ทุกสถานะงานซ่อม</option>
              <option value={JobStatus.PENDING}>⏳ รอดำเนินการ</option>
              <option value={JobStatus.IN_PROGRESS}>🛠️ กำลังดำเนินการซ่อม</option>
              <option value={JobStatus.UNDER_REVIEW}>🔍 รอตรวจสอบงาน</option>
              <option value={JobStatus.COMPLETED}>✅ เสร็จสิ้นเรียบร้อย</option>
            </select>

            {/* Technician Filter */}
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">👨‍🔧 ช่างทุกคน</option>
              {technicians.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode 1: MONTH GRID */}
        {viewMode === "month" && (
          <div className="p-3 sm:p-5 space-y-3">
            {/* Drag & Drop Reschedule Help Tip Banner */}
            <div className="bg-indigo-50/90 border border-indigo-200 text-indigo-900 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                  Drag & Drop
                </span>
                <span>💡 คุณสามารถลากการ์ดงานซ่อม (Drag) ไปวางบนวันที่ที่ต้องการในปฏิทินเพื่อเลื่อนวันนัดหมายและบันทึกข้อมูลอัตโนมัติ</span>
              </div>
            </div>

            {/* Reschedule Toast Notification */}
            {dragRescheduleStatus && (
              <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-200 flex-shrink-0" />
                  <span>{dragRescheduleStatus}</span>
                </div>
                <button
                  onClick={() => setDragRescheduleStatus(null)}
                  className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Weekday Labels Header */}
            <div className="grid grid-cols-7 text-center font-extrabold text-xs text-slate-500 border-b border-slate-200 pb-2 mb-2 font-display">
              <span className="text-rose-500">อาทิตย์</span>
              <span>จันทร์</span>
              <span>อังคาร</span>
              <span>พุธ</span>
              <span>พฤหัสบดี</span>
              <span>ศุกร์</span>
              <span className="text-blue-500">เสาร์</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const dayJobs = repairsByDate[cell.dateStr] || [];
                const dayRecurring = recurringByDate[cell.dateStr] || [];
                const isSelected = selectedDateStr === cell.dateStr;
                const isDragOver = dragOverDateStr === cell.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onDragOver={handleDateCellDragOver}
                    onDragEnter={(e) => handleDateCellDragEnter(e, cell.dateStr)}
                    onDragLeave={(e) => handleDateCellDragLeave(e, cell.dateStr)}
                    onDrop={(e) => handleDateCellDrop(e, cell.dateStr)}
                    className={`relative min-h-[95px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isDragOver
                        ? "bg-indigo-100/90 border-indigo-500 ring-2 ring-indigo-500/60 shadow-md scale-[1.02] z-10"
                        : !cell.isCurrentMonth
                        ? "bg-slate-50/50 border-slate-100 text-slate-300"
                        : cell.isToday
                        ? "bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                        : isSelected
                        ? "bg-slate-100/80 border-slate-400 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Visual Cue Overlay when Dragging over Cell */}
                    {isDragOver && (
                      <div className="absolute inset-0 bg-indigo-600/15 backdrop-blur-[1px] rounded-xl flex items-center justify-center p-1 pointer-events-none border-2 border-indigo-600 border-dashed z-20">
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg shadow-sm">
                          📍 วางตรงนี้เพื่อเลื่อนนัด
                        </span>
                      </div>
                    )}

                    {/* Top Row: Day Number & Add Job Button */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black font-mono w-6 h-6 flex items-center justify-center rounded-full ${
                          cell.isToday
                            ? "bg-blue-600 text-white shadow-xs"
                            : isSelected
                            ? "bg-slate-800 text-white"
                            : cell.isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-300"
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {onNewJobWithDate && cell.isCurrentMonth && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNewJobWithDate(cell.dateStr);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title={`เพิ่มงานซ่อมใหม่สำหรับวันที่ ${cell.dateStr}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Middle: Badges List (Both Repair Jobs & Recurring Schedules) */}
                    <div className="mt-1 space-y-1 overflow-hidden flex-1">
                      {/* Recurring Schedules Badges (Purple) */}
                      {dayRecurring.map((sched) => (
                        <div
                          key={sched.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                          }}
                          className="p-1 rounded-md text-[9px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 truncate transition-transform hover:scale-[1.02] cursor-pointer flex items-center space-x-1"
                          title={`[งานบำรุงตามรอบ] ${sched.title}`}
                        >
                          <Repeat className="w-2.5 h-2.5 text-purple-600 flex-shrink-0" />
                          <span className="truncate">{sched.title}</span>
                        </div>
                      ))}

                      {/* Actual Repair Jobs Badges (Draggable) */}
                      {dayJobs.slice(0, 2 - dayRecurring.length).map((job) => (
                        <div
                          key={job.id}
                          draggable={true}
                          onDragStart={(e) => handleJobDragStart(e, job)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJob(job);
                          }}
                          className={`p-1 rounded-md text-[10px] font-bold border truncate transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing flex items-center justify-between ${
                            draggedJobId === job.id ? "opacity-40 ring-2 ring-indigo-500" : ""
                          } ${getStatusBadge(job.status)}`}
                          title={`[ลากเพื่อเลื่อนวันนัด] ${job.id} - ห้อง ${job.roomNo} - ${job.details}`}
                        >
                          <span className="truncate">
                            ห้อง {job.roomNo} ({job.apptTime || "ไม่ระบุเวลา"})
                          </span>
                          {job.priority === "งานเร่งด่วน" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0 ml-1"></span>
                          )}
                        </div>
                      ))}

                      {dayJobs.length + dayRecurring.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded px-1 text-center py-0.5">
                          +{dayJobs.length + dayRecurring.length - 2} รายการเพิ่มเติม
                        </div>
                      )}
                    </div>

                    {/* Bottom Indicator Dot */}
                    {(dayJobs.length > 0 || dayRecurring.length > 0) && (
                      <div className="flex items-center justify-center space-x-1 pt-1">
                        {dayJobs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        {dayRecurring.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                        <span className="text-[9px] font-extrabold text-slate-600 font-mono">
                          {dayJobs.length + dayRecurring.length} งาน
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Date Detail Drawer */}
        {selectedDateStr && viewMode !== "recurring" && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-display">
                    รายการประจำวันที่ {selectedDateStr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    งานซ่อม {selectedDateJobs.length} รายการ | งานบำรุงตามรอบ {selectedDateRecurring.length} รายการ
                  </p>
                </div>
              </div>

              {onNewJobWithDate && (
                <button
                  onClick={() => onNewJobWithDate(selectedDateStr)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างใบแจ้งซ่อมใหม่สำหรับวันนี้นัดหมาย</span>
                </button>
              )}
            </div>

            {/* Recurring Preventative Maintenance Due on This Date */}
            {selectedDateRecurring.length > 0 && (
              <div className="space-y-2 bg-purple-50/70 p-4 rounded-xl border border-purple-200">
                <h4 className="font-extrabold text-xs text-purple-900 flex items-center space-x-1.5">
                  <Repeat className="w-4 h-4 text-purple-600" />
                  <span>แผนงานบำรุงรักษาเชิงป้องกันประจำวันนี้นัดหมาย ({selectedDateRecurring.length} รายการ)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDateRecurring.map((sched) => (
                    <div
                      key={sched.id}
                      className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {sched.id}
                        </span>
                        <span className="text-xxs font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          รอบ: {getFrequencyLabel(sched.frequency)}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{sched.title}</h5>
                        <p className="text-xxs text-slate-500 mt-0.5">
                          🏢 {sched.condoName} ({sched.roomNo}) • 👨‍🔧 ช่าง: {sched.technician}
                        </p>
                      </div>

                      <button
                        onClick={() => handleGenerateJobFromSchedule(sched)}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>สร้างใบแจ้งซ่อมจริงเข้าสู่ระบบทันที</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Repair Jobs for Selected Date */}
            {selectedDateJobs.length === 0 && selectedDateRecurring.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">ไม่มีรายการแจ้งซ่อมหรือแผนงานบำรุงในวันนี้</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {selectedDateJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable={true}
                    onDragStart={(e) => handleJobDragStart(e, job)}
                    className={`bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 cursor-grab active:cursor-grabbing ${
                      draggedJobId === job.id ? "opacity-50 border-indigo-400 ring-2 ring-indigo-400/50" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {job.id}
                        </span>
                        <span
                          className={`text-xxs font-extrabold px-2.5 py-1 rounded-full border ${getStatusBadge(
                            job.status
                          )}`}
                        >
                          {getStatusText(job.status)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>
                            ห้อง {job.roomNo} ({job.condoName.split(" (")[0]})
                          </span>
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {job.details || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between text-xxs">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>นัดหมายเวลา: {job.apptTime || "ไม่ระบุ"}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.technician || "ยังไม่ได้ระบุช่าง"}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรายละเอียด</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickReschedule(job)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                          title="เลื่อนวันนัดหมายสำหรับงานนี้"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>เลื่อนนัด</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: LIST VIEW */}
        {viewMode === "list" && (
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 font-display flex items-center space-x-2">
              <ListFilter className="w-4 h-4 text-blue-600" />
              <span>รายการนัดหมายเรียงตามวันที่ ({filteredRepairs.length} รายการ)</span>
            </h3>

            <div className="space-y-2.5">
              {filteredRepairs.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
                  ไม่พบรายการแจ้งซ่อมตามเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredRepairs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="bg-white hover:bg-slate-50/80 p-4 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-mono text-xs font-bold flex-shrink-0">
                        {job.roomNo}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-blue-600 font-mono">{job.id}</span>
                          <span className="text-xs font-bold text-slate-900">{job.condoName}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{job.details}</p>
                        <div className="flex items-center space-x-3 text-xxs text-slate-400 mt-1">
                          <span>📅 นัดหมาย: {job.apptDate || job.workDate || "ไม่ระบุ"} ({job.apptTime || "ไม่ระบุเวลา"})</span>
                          <span>👨‍🔧 ช่าง: {job.technician || "ยังไม่ได้ระบุ"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <span className={`text-xxs font-extrabold px-3 py-1 rounded-full border ${getStatusBadge(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View Mode 3: RECURRING PREVENTATIVE MAINTENANCE MANAGEMENT */}
        {viewMode === "recurring" && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50/80 p-5 rounded-2xl border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0 mt-0.5">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-purple-950 font-display">
                    ศูนย์ตั้งค่าและติดตามงานบำรุงรักษาเชิงป้องกันตามรอบ (Preventative Maintenance)
                  </h3>
                  <p className="text-xs text-purple-700 mt-0.5">
                    กำหนดรอบเวลาตรวจเช็คอุปกรณ์ส่วนกลาง เช่น แอร์ ลิฟต์ ปั๊มน้ำ ระบบไฟ เพื่อให้อุปกรณ์ใช้งานได้อย่างมืออาชีพโดยไม่สะดุด
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoGenerateDueJobs}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>สร้างงานซ่อมอัตโนมัติสำหรับรายการที่ถึงกำหนด</span>
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ เพิ่มแผนงานบำรุงรักษาใหม่</span>
                </button>
              </div>
            </div>

            {/* List of Recurring Schedules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.length === 0 ? (
                <div className="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                  <Repeat className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">ยังไม่มีแผนงานบำรุงรักษาเชิงป้องกันในระบบ</p>
                </div>
              ) : (
                schedules.map((sched) => (
                  <div
                    key={sched.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                      sched.isActive ? "border-purple-200" : "border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black font-mono text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                          {sched.id}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xxs font-extrabold px-2.5 py-0.5 rounded-full border ${
                              sched.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {sched.isActive ? "เปิดใช้งานอัตโนมัติ" : "ปิดการใช้งาน"}
                          </span>
                        </div>
                      </div>

                      {/* Title & Location */}
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2">{sched.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{sched.condoName} ({sched.roomNo})</span>
                      </p>

                      {/* Cycle & Next Due Date */}
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>ความถี่รอบเวลา:</span>
                          <span className="font-bold text-purple-700">{getFrequencyLabel(sched.frequency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>กำหนดรอบถัดไป:</span>
                          <span className="font-black text-slate-900 font-mono">{sched.nextDueDate}</span>
                        </div>
                        {sched.lastGeneratedDate && (
                          <div className="flex justify-between text-xxs text-slate-400 pt-0.5">
                            <span>ออกใบล่าสุด:</span>
                            <span>{sched.lastGeneratedDate}</span>
                          </div>
                        )}
                      </div>

                      {/* Details / Checklist */}
                      {sched.details && (
                        <p className="text-xxs text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-lg line-clamp-3 whitespace-pre-line border border-slate-100">
                          {sched.details}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <button
                        onClick={() => handleGenerateJobFromSchedule(sched)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>สร้างใบแจ้งซ่อมจริงทันที (Generate Now)</span>
                      </button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => handleToggleActive(sched.id)}
                          className="text-slate-600 hover:text-purple-600 font-medium cursor-pointer flex items-center space-x-1"
                        >
                          {sched.isActive ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>{sched.isActive ? "พักแผนงาน" : "เริ่มทำงาน"}</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(sched)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(sched.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View Mode 4: TECHNICIAN SCHEDULE & WORKLOAD OPTIMIZATION VIEW */}
        {viewMode === "technician" && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Header Controls & Date Navigation Bar */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold font-display text-white flex items-center space-x-2">
                    <span>ตารางงานช่าง & กระจายภาระงาน (Technician Schedule)</span>
                    <span className="text-xxs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      Overbooking Control
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    บริหารจัดการตารางงานช่างแต่ละคนรายวัน ป้องกันงานคั่งค้าง และสับเปลี่ยนช่างได้อย่างรวดเร็ว
                  </p>
                </div>
              </div>

              {/* Day Selector Navigation */}
              <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 self-start md:self-auto">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="วันก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />

                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  วันนี้
                </button>

                <button
                  onClick={handleNextDay}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="วันถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Daily Overbooking & Capacity Summary Metrics Bar */}
            {(() => {
              const targetDateStr = selectedDateStr || new Date().toISOString().split("T")[0];
              const dayJobsAll = repairs.filter(
                (r) =>
                  (r.apptDate === targetDateStr || (!r.apptDate && r.workDate === targetDateStr)) &&
                  r.status !== ("CANCELLED" as any)
              );
              const daySchedulesAll = schedules.filter(
                (s) => s.isActive && s.nextDueDate === targetDateStr
              );

              // Unassigned jobs on this date
              const unassignedJobs = dayJobsAll.filter(
                (r) => !r.technician || r.technician === "ยังไม่ได้ระบุช่าง"
              );

              // Tech workload breakdown
              const techStats = technicians.map((tech) => {
                const jCount = dayJobsAll.filter((r) => r.technician === tech).length;
                const sCount = daySchedulesAll.filter((s) => s.technician === tech).length;
                const total = jCount + sCount;
                return { tech, total, isOverbooked: total >= 4 };
              });

              const activeTechs = techStats.filter((t) => t.total > 0).length;
              const overbookedCount = techStats.filter((t) => t.isOverbooked).length;
              const totalAssignedJobs = dayJobsAll.length + daySchedulesAll.length;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Metric 1: Active Techs */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                          ช่างที่มีงานวันนี้
                        </div>
                        <div className="text-lg font-black text-slate-900 font-mono">
                          {activeTechs} <span className="text-xs text-slate-500 font-normal">/ {technicians.length} ท่าน</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric 2: Total Jobs Scheduled */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                          รวมงานจัดสรรวันนี้
                        </div>
                        <div className="text-lg font-black text-slate-900 font-mono">
                          {totalAssignedJobs} <span className="text-xs text-slate-500 font-normal">รายการ</span>
                        </div>
                      </div>
                    </div>

                    {/* Metric 3: Overbooked Alert */}
                    <div
                      className={`p-4 rounded-2xl border shadow-2xs flex items-center space-x-3 transition-all ${
                        overbookedCount > 0
                          ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 animate-pulse"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                          overbookedCount > 0 ? "bg-rose-600 text-white" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                          ช่างภาระงานเกิน (&ge;4 งาน)
                        </div>
                        <div
                          className={`text-lg font-black font-mono ${
                            overbookedCount > 0 ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {overbookedCount > 0 ? `${overbookedCount} ท่าน ⚠️` : "0 ท่าน (ปกติ)"}
                        </div>
                      </div>
                    </div>

                    {/* Metric 4: Unassigned Jobs */}
                    <div
                      className={`p-4 rounded-2xl border shadow-2xs flex items-center space-x-3 ${
                        unassignedJobs.length > 0
                          ? "bg-amber-50/90 border-amber-300"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                          unassignedJobs.length > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <UserX className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                          งานยังไม่ระบุช่าง
                        </div>
                        <div
                          className={`text-lg font-black font-mono ${
                            unassignedJobs.length > 0 ? "text-amber-800" : "text-slate-700"
                          }`}
                        >
                          {unassignedJobs.length} <span className="text-xs font-normal">รายการ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning Panel for Unassigned Jobs on Selected Date */}
                  {unassignedJobs.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-xs sm:text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>พบงานซ่อมในวันที่ {targetDateStr} ที่ยังไม่ได้ระบุช่างผู้ดูแล ({unassignedJobs.length} รายการ)</span>
                        </div>
                        <span className="text-xxs bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-extrabold">
                          ต้องการการมอบหมาย
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unassignedJobs.map((job) => (
                          <div
                            key={job.id}
                            className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {job.id}
                              </span>
                              <span className="text-xxs font-bold text-slate-500">
                                🏢 {job.condoName} - ห้อง {job.roomNo}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 line-clamp-1 font-medium">{job.details}</p>

                            <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                              <span className="text-xxs text-slate-500 font-bold flex-shrink-0">มอบหมายช่าง:</span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value && onReassignTechnician) {
                                    onReassignTechnician(job.id, e.target.value);
                                  }
                                }}
                                className="w-full text-xs bg-slate-50 border border-amber-300 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="" disabled>-- เลือกช่างผู้รับผิดชอบ --</option>
                                {technicians.map((t) => {
                                  const { total } = techStats.find((s) => s.tech === t) || { total: 0 };
                                  const badgeText = total >= 4 ? "⚠️ งานแน่น (4+ งาน)" : total === 3 ? "🟡 3 งาน" : `🟢 ${total}/3 งาน`;
                                  return (
                                    <option key={t} value={t}>
                                      {t} ({badgeText})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Technicians Swimlane Workload Grid */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 font-display flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>ตารางภาระงานรายช่าง ประจำวันที่ {selectedDateStr}</span>
                </h4>
                <div className="text-xxs text-slate-500 font-medium">
                  💡 เกณฑ์ภาระงานต่อวัน: <span className="font-bold text-emerald-700">1-2 งาน (ปกติ)</span> • <span className="font-bold text-amber-700">3 งาน (เต็มพิกัด)</span> • <span className="font-bold text-rose-700">&ge;4 งาน (Overbooked! ⚠️)</span>
                </div>
              </div>

              {/* Individual Technician Swimlane Cards */}
              <div className="space-y-4">
                {technicians.map((tech, techIdx) => {
                  const targetDateStr = selectedDateStr || new Date().toISOString().split("T")[0];

                  // Jobs assigned to this technician today
                  const techRepairs = repairs.filter(
                    (r) =>
                      (r.apptDate === targetDateStr || (!r.apptDate && r.workDate === targetDateStr)) &&
                      r.technician === tech &&
                      r.status !== ("CANCELLED" as any)
                  );

                  // Recurring maintenance schedules for this tech today
                  const techSchedules = schedules.filter(
                    (s) => s.isActive && s.nextDueDate === targetDateStr && s.technician === tech
                  );

                  const totalCount = techRepairs.length + techSchedules.length;
                  const isOverbooked = totalCount >= 4;
                  const isFull = totalCount === 3;
                  const isOptimal = totalCount >= 1 && totalCount <= 2;

                  // Capacity percent based on max recommended 3 jobs
                  const capacityPercent = Math.min(100, Math.round((totalCount / 3) * 100));

                  // Avatar background colors
                  const avatarColors = [
                    "bg-blue-600 text-white",
                    "bg-emerald-600 text-white",
                    "bg-purple-600 text-white",
                    "bg-indigo-600 text-white",
                    "bg-amber-600 text-white"
                  ];
                  const avatarColor = avatarColors[techIdx % avatarColors.length];

                  return (
                    <div
                      key={tech}
                      className={`bg-white rounded-2xl border shadow-2xs transition-all overflow-hidden ${
                        isOverbooked
                          ? "border-rose-300 ring-2 ring-rose-500/15"
                          : isFull
                          ? "border-amber-300"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Technician Card Header */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl font-extrabold flex items-center justify-center font-display text-sm shadow-xs ${avatarColor}`}>
                            {tech.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-extrabold text-sm text-slate-900">{tech}</h5>
                              {isOverbooked && (
                                <span className="text-xxs font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                  OVERBOOKED! ⚠️
                                </span>
                              )}
                            </div>
                            <p className="text-xxs text-slate-500 mt-0.5">
                              มอบหมายรวมวันนี้: <span className="font-bold text-slate-800">{totalCount} รายการ</span> (ซ่อมด่วน {techRepairs.length} | บำรุงตามรอบ {techSchedules.length})
                            </p>
                          </div>
                        </div>

                        {/* Capacity Meter Indicator */}
                        <div className="w-full sm:w-48 space-y-1 self-end sm:self-auto">
                          <div className="flex items-center justify-between text-xxs font-bold">
                            <span className="text-slate-500">ความหนาแน่นงาน:</span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-extrabold ${
                                isOverbooked
                                  ? "bg-rose-100 text-rose-800"
                                  : isFull
                                  ? "bg-amber-100 text-amber-800"
                                  : isOptimal
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isOverbooked
                                ? `เกินภาระ (${totalCount}/3)`
                                : isFull
                                ? `เต็มพิกัด (3/3)`
                                : isOptimal
                                ? `กำลังดี (${totalCount}/3)`
                                : "ว่างพร้อมรับงาน"}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isOverbooked
                                  ? "bg-rose-600 animate-pulse"
                                  : isFull
                                  ? "bg-amber-500"
                                  : isOptimal
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Overbooking Alert Sub-bar */}
                      {isOverbooked && (
                        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xxs font-bold text-rose-800">
                          <span className="flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>ช่างสมควรได้รับการกระจายงานออกเนื่องจากมีงานสะสมมากกว่า 3 รายการต่อวัน</span>
                          </span>
                          <span className="hidden md:inline text-rose-600 font-mono">
                            แนะนำ: สับเปลี่ยนช่างผ่านเมนูด้านล่าง
                          </span>
                        </div>
                      )}

                      {/* Jobs Grid for this Technician */}
                      <div className="p-4">
                        {totalCount === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 text-xs font-medium space-y-1">
                            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500/70" />
                            <p className="text-emerald-800 font-bold">ช่างว่างตลอดวัน ยินดีรับมอบหมายงานเพิ่ม</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Recurring Schedules */}
                            {techSchedules.map((sched) => (
                              <div
                                key={sched.id}
                                className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 shadow-2xs space-y-2 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xxs font-black font-mono text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                      {sched.id}
                                    </span>
                                    <span className="text-xxs font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                      งานบำรุงตามรอบ
                                    </span>
                                  </div>

                                  <h6 className="font-bold text-xs text-slate-900">{sched.title}</h6>
                                  <p className="text-xxs text-slate-500 mt-1">
                                    🏢 {sched.condoName} ({sched.roomNo})
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleGenerateJobFromSchedule(sched)}
                                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xxs font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-1"
                                >
                                  <Zap className="w-3 h-3 text-amber-300" />
                                  <span>ออกใบงานซ่อมจริง</span>
                                </button>
                              </div>
                            ))}

                            {/* Actual Repair Jobs */}
                            {techRepairs.map((job) => (
                              <div
                                key={job.id}
                                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        {job.id}
                                      </span>
                                      <span className="text-xxs font-extrabold text-slate-500 flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>{job.apptTime || "ไม่ระบุเวลา"}</span>
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xxs font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(
                                        job.status
                                      )}`}
                                    >
                                      {getStatusText(job.status)}
                                    </span>
                                  </div>

                                  <h6 className="font-extrabold text-xs text-slate-900 flex items-center space-x-1 mt-1">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span>ห้อง {job.roomNo} ({job.condoName.split(" (")[0]})</span>
                                  </h6>

                                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium">
                                    {job.details || "ไม่มีรายละเอียดเพิ่มเติม"}
                                  </p>

                                  {job.priority === "งานเร่งด่วน" && (
                                    <span className="inline-flex items-center space-x-1 mt-2 text-xxs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                      <Flame className="w-3 h-3 text-rose-600" />
                                      <span>งานซ่อมเร่งด่วน</span>
                                    </span>
                                  )}
                                </div>

                                {/* Interactive Action Bar: Reassign or Reschedule */}
                                <div className="pt-2 border-t border-slate-100 space-y-2 text-xxs">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-slate-500 flex-shrink-0">สลับช่าง:</span>
                                    <select
                                      value={job.technician}
                                      onChange={(e) => {
                                        if (e.target.value !== job.technician && onReassignTechnician) {
                                          onReassignTechnician(job.id, e.target.value);
                                        }
                                      }}
                                      className="w-full text-xxs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                      {technicians.map((t) => {
                                        const tJobs = repairs.filter(
                                          (r) =>
                                            (r.apptDate === targetDateStr || (!r.apptDate && r.workDate === targetDateStr)) &&
                                            r.technician === t &&
                                            r.status !== ("CANCELLED" as any)
                                        ).length;
                                        const tScheds = schedules.filter(
                                          (s) => s.isActive && s.nextDueDate === targetDateStr && s.technician === t
                                        ).length;
                                        const total = tJobs + tScheds;
                                        const badgeText = total >= 4 ? "⚠️ 4+ งาน" : `${total}/3 งาน`;
                                        return (
                                          <option key={t} value={t}>
                                            {t} ({badgeText})
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <button
                                      onClick={() => onSelectJob(job)}
                                      className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1"
                                    >
                                      <Eye className="w-3 h-3 text-slate-500" />
                                      <span>รายละเอียด</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Technician Workload Forecast Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-extrabold text-sm text-slate-900 font-display">
                    ตารางคาดการณ์ภาระงานช่าง 7 วันข้างหน้า (7-Day Workload Forecast)
                  </h4>
                </div>
                <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                  วางแผนล่วงหน้าเพื่อป้องกันคอขวด
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold">
                      <th className="p-3">ช่างผู้ดูแล</th>
                      {(() => {
                        const base = new Date(selectedDateStr || new Date().toISOString().split("T")[0]);
                        return Array.from({ length: 7 }).map((_, i) => {
                          const d = new Date(base);
                          d.setDate(d.getDate() + i);
                          const dateStr = d.toISOString().split("T")[0];
                          const dayNum = d.getDate();
                          const monthNum = d.getMonth() + 1;
                          const isSelected = dateStr === selectedDateStr;
                          return (
                            <th
                              key={dateStr}
                              onClick={() => setSelectedDateStr(dateStr)}
                              className={`p-3 text-center cursor-pointer transition-colors ${
                                isSelected ? "bg-emerald-100 text-emerald-900 font-black" : "hover:bg-slate-100"
                              }`}
                            >
                              <div>{dayNum}/{monthNum}</div>
                              <div className="text-[9px] font-normal text-slate-400">
                                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][d.getDay()]}
                              </div>
                            </th>
                          );
                        });
                      })()}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {technicians.map((tech) => (
                      <tr key={tech} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-800">{tech}</td>
                        {(() => {
                          const base = new Date(selectedDateStr || new Date().toISOString().split("T")[0]);
                          return Array.from({ length: 7 }).map((_, i) => {
                            const d = new Date(base);
                            d.setDate(d.getDate() + i);
                            const dateStr = d.toISOString().split("T")[0];

                            const count =
                              repairs.filter(
                                (r) =>
                                  (r.apptDate === dateStr || (!r.apptDate && r.workDate === dateStr)) &&
                                  r.technician === tech &&
                                  r.status !== ("CANCELLED" as any)
                              ).length +
                              schedules.filter(
                                (s) => s.isActive && s.nextDueDate === dateStr && s.technician === tech
                              ).length;

                            return (
                              <td
                                key={dateStr}
                                onClick={() => setSelectedDateStr(dateStr)}
                                className="p-3 text-center cursor-pointer"
                              >
                                {count === 0 ? (
                                  <span className="text-slate-300 font-mono text-xs">-</span>
                                ) : count >= 4 ? (
                                  <span className="inline-block bg-rose-600 text-white font-mono font-black text-xxs px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                                    {count} งาน ⚠️
                                  </span>
                                ) : count === 3 ? (
                                  <span className="inline-block bg-amber-500 text-white font-mono font-bold text-xxs px-2 py-0.5 rounded-full shadow-2xs">
                                    {count} งาน
                                  </span>
                                ) : (
                                  <span className="inline-block bg-emerald-100 text-emerald-800 font-mono font-bold text-xxs px-2 py-0.5 rounded-full">
                                    {count} งาน
                                  </span>
                                )}
                              </td>
                            );
                          });
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Recurring Maintenance Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Repeat className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base font-display">
                  {editingSchedule ? "แก้ไขแผนงานบำรุงรักษา" : "เพิ่มแผนงานบำรุงรักษาเชิงป้องกันตามรอบ"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">หัวข้องานบำรุงรักษา *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ตรวจเช็คระบบแอร์ส่วนกลางประจำเดือน"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อาคาร / คอนโด *</label>
                  <select
                    value={formCondo}
                    onChange={(e) => setFormCondo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    {condos.length > 0 ? (
                      condos.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    ) : (
                      <option value="ลุมพินี วิลล์ (Lumpini Ville)">ลุมพินี วิลล์ (Lumpini Ville)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ห้อง / พื้นที่ส่วนกลาง *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ส่วนกลาง - ล็อบบี้, ห้อง 808"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รอบเวลา (Frequency) *</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="WEEKLY">ทุกสัปดาห์ (Weekly)</option>
                    <option value="MONTHLY">ทุกเดือน (Monthly)</option>
                    <option value="EVERY_3_MONTHS">ทุก 3 เดือน (ไตรมาส)</option>
                    <option value="EVERY_6_MONTHS">ทุก 6 เดือน (ครึ่งปี)</option>
                    <option value="YEARLY">ทุกปี (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">กำหนดรอบทำถัดไป *</label>
                  <input
                    type="date"
                    required
                    value={formNextDueDate}
                    onChange={(e) => setFormNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ช่างผู้รับผิดชอบ *</label>
                  <select
                    value={formTechnician}
                    onChange={(e) => setFormTechnician(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    {technicians.length > 0 ? (
                      technicians.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))
                    ) : (
                      <option value="ช่างสมชาย (ช่างประจำอาคาร)">ช่างสมชาย (ช่างประจำอาคาร)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ระดับความสำคัญ</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="งานปกติ">งานปกติ</option>
                    <option value="งานเร่งด่วน">งานเร่งด่วน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียด / Checklist การตรวจเช็ค</label>
                <textarea
                  rows={3}
                  placeholder="เช่น 1. ตรวจสอบกระแสไฟฟ้า&#10;2. หยอดน้ำมัน&#10;3. ทดสอบระบบความปลอดภัย"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกแผนงานบำรุงรักษา</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Quick Reschedule Appointment Date (Touch / Click support) */}
      {rescheduleModalJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 font-display">
                  เลื่อนวันนัดหมายงานซ่อม
                </h3>
              </div>
              <button
                onClick={() => setRescheduleModalJob(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
              <div className="flex justify-between font-mono font-bold text-indigo-600">
                <span>{rescheduleModalJob.id}</span>
                <span>ห้อง {rescheduleModalJob.roomNo}</span>
              </div>
              <p className="line-clamp-2 text-slate-700 font-semibold">{rescheduleModalJob.details}</p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 mt-1 flex justify-between">
                <span>📅 นัดหมายเดิม:</span>
                <span className="font-bold text-slate-800">{rescheduleModalJob.apptDate || rescheduleModalJob.workDate || "ไม่ระบุ"}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">เลือกวันนัดหมายใหม่ *</label>
              <input
                type="date"
                required
                value={rescheduleTargetDate}
                onChange={(e) => setRescheduleTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModalJob(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!rescheduleTargetDate) return;
                  try {
                    if (onReassignTechnician) {
                      await onReassignTechnician(
                        rescheduleModalJob.id,
                        rescheduleModalJob.technician || "ยังไม่ได้ระบุ",
                        rescheduleTargetDate
                      );
                    }
                    setSelectedDateStr(rescheduleTargetDate);
                    setDragRescheduleStatus(
                      `⚡ เลื่อนวันนัดหมายงานซ่อม [${rescheduleModalJob.id}] (ห้อง ${rescheduleModalJob.roomNo}) เป็นวันที่ ${rescheduleTargetDate} สำเร็จแล้ว!`
                    );
                    setTimeout(() => setDragRescheduleStatus(null), 6000);
                    setRescheduleModalJob(null);
                  } catch (err: any) {
                    alert(`เกิดข้อผิดพลาด: ${err.message || err}`);
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันย้ายวัน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

