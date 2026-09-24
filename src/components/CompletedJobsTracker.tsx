import React, { useState, useMemo, useEffect } from "react";
import { RepairJob, JobStatus, UserRole } from "../types";
import {
  CheckCircle2,
  Search,
  Building2,
  Home,
  User,
  Calendar,
  Clock,
  QrCode,
  FileText,
  Printer,
  CreditCard,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  AlertCircle,
  Download,
  Filter,
  Wrench,
  DollarSign,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  History,
  Tag,
  X,
  Trash2
} from "lucide-react";

interface CompletedJobsTrackerProps {
  repairs: RepairJob[];
  onOpenUpdateModal: (job: RepairJob) => void;
  onOpenQrModal: (job: RepairJob) => void;
  onOpenEditModal: (job: RepairJob) => void;
  onOpenPaymentModal?: (job: RepairJob) => void;
  onOpenExportPdfModal?: (job: RepairJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  userRole: UserRole;
  isSyncing?: boolean;
}

export const CompletedJobsTracker: React.FC<CompletedJobsTrackerProps> = ({
  repairs,
  onOpenUpdateModal,
  onOpenQrModal,
  onOpenEditModal,
  onOpenPaymentModal,
  onOpenExportPdfModal,
  onStatusChange,
  userRole,
  isSyncing = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [condoFilter, setCondoFilter] = useState<string>("ALL");
  const [techFilter, setTechFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [reopeningJobId, setReopeningJobId] = useState<string | null>(null);

  // Search History state
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("boba_completed_search_history");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ["ห้อง 405", "หลอดไฟ", "SKY", "Grande Tower"];
  });
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);

  // Save Search History to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("boba_completed_search_history", JSON.stringify(searchHistory));
    } catch (e) {
      console.warn("Could not save search history:", e);
    }
  }, [searchHistory]);

  const addSearchHistory = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== cleanTerm.toLowerCase());
      return [cleanTerm, ...filtered].slice(0, 10); // Keep top 10
    });
  };

  const removeSearchHistoryItem = (termToRemove: string) => {
    setSearchHistory(prev => prev.filter(item => item !== termToRemove));
  };

  const clearAllSearchHistory = () => {
    if (confirm("คุณต้องการล้างประวัติการค้นหาทั้งหมดใช่หรือไม่?")) {
      setSearchHistory([]);
    }
  };

  const applySearchTerm = (term: string) => {
    setSearchTerm(term);
    addSearchHistory(term);
    setShowHistoryPanel(false);
  };

  // Filter only COMPLETED jobs
  const completedJobs = useMemo(() => {
    return repairs.filter((r) => r.status === JobStatus.COMPLETED);
  }, [repairs]);

  // Extract unique condos and technicians for filters
  const condosList = useMemo(() => {
    const set = new Set<string>();
    completedJobs.forEach((j) => {
      if (j.condoName) set.add(j.condoName.split(" (")[0]);
    });
    return Array.from(set);
  }, [completedJobs]);

  const techniciansList = useMemo(() => {
    const set = new Set<string>();
    completedJobs.forEach((j) => {
      if (j.technician) set.add(j.technician);
    });
    return Array.from(set);
  }, [completedJobs]);

  // Filtered completed jobs
  const filteredCompletedJobs = useMemo(() => {
    return completedJobs.filter((job) => {
      // Search keyword matching
      const query = searchTerm.toLowerCase().trim();
      const matchQuery =
        !query ||
        job.id.toLowerCase().includes(query) ||
        job.roomNo.toLowerCase().includes(query) ||
        job.condoName.toLowerCase().includes(query) ||
        (job.details && job.details.toLowerCase().includes(query)) ||
        (job.technician && job.technician.toLowerCase().includes(query)) ||
        (job.notes && job.notes.toLowerCase().includes(query));

      // Condo filter
      const matchCondo =
        condoFilter === "ALL" || job.condoName.split(" (")[0] === condoFilter;

      // Tech filter
      const matchTech = techFilter === "ALL" || job.technician === techFilter;

      // Payment filter
      let matchPayment = true;
      if (paymentFilter === "PAID") {
        matchPayment =
          job.paymentMethod === "โอนเงิน" || job.paymentMethod === "เงินสด";
      } else if (paymentFilter === "UNPAID") {
        matchPayment = !job.paymentMethod || job.paymentMethod === "ยังไม่ได้ชำระ";
      }

      return matchQuery && matchCondo && matchTech && matchPayment;
    });
  }, [completedJobs, searchTerm, condoFilter, techFilter, paymentFilter]);

  // Statistics calculation
  const totalCostHandled = useMemo(() => {
    return filteredCompletedJobs.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  }, [filteredCompletedJobs]);

  const totalPaymentPaid = useMemo(() => {
    return filteredCompletedJobs.reduce(
      (acc, curr) => acc + (curr.paymentAmount || 0),
      0
    );
  }, [filteredCompletedJobs]);

  const paidJobsCount = useMemo(() => {
    return filteredCompletedJobs.filter(
      (j) => j.paymentMethod === "โอนเงิน" || j.paymentMethod === "เงินสด"
    ).length;
  }, [filteredCompletedJobs]);

  // Helper: Warranty calculation (30 days from updatedAt or workDate)
  const getWarrantyInfo = (job: RepairJob) => {
    const rawDate = job.updatedAt || job.workDate;
    if (!rawDate) return { isWarrantyActive: false, daysRemaining: 0 };

    try {
      // parse date string (supports DD/MM/YYYY or YYYY-MM-DD)
      let parsedDate: Date | null = null;
      if (rawDate.includes("/")) {
        const parts = rawDate.split(" ")[0].split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year > 2500) year -= 543; // BE to AD
          parsedDate = new Date(year, month, day);
        }
      } else if (rawDate.includes("-")) {
        parsedDate = new Date(rawDate);
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return { isWarrantyActive: true, daysRemaining: 30 };
      }

      const now = new Date();
      const diffTime = now.getTime() - parsedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysRemaining = 30 - diffDays;

      return {
        isWarrantyActive: daysRemaining > 0,
        daysRemaining: Math.max(0, daysRemaining)
      };
    } catch {
      return { isWarrantyActive: false, daysRemaining: 0 };
    }
  };

  const handleReopenJob = async (job: RepairJob) => {
    if (
      !confirm(
        `ยืนยันการเปิดงานซ่อมรหัส ${job.id} (ห้อง ${job.roomNo}) อีกครั้งเพื่อเข้าแก้ไขงานรับประกันหรือไม่?`
      )
    ) {
      return;
    }

    setReopeningJobId(job.id);
    try {
      await onStatusChange(job.id, JobStatus.IN_PROGRESS);
    } finally {
      setReopeningJobId(null);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Completed Jobs Archive & Historical Tracking</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
            คลังประวัติงานซ่อมเสร็จสิ้น & ระบบติดตามย้อนหลัง
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            แยกหมวดหมู่งานซ่อมที่ดำเนินการเสร็จเรียบร้อยแล้วออกจากหน้างานปัจจุบัน เพื่อให้สามารถตรวจสอบประวัติการซ่อม ตรวจสอบหลักฐานการโอนเงิน ตรวจสอบระยะเวลารับประกัน และพิมพ์ใบสั่งซ่อมย้อนหลังได้อย่างสะดวกและรวดเร็ว
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-emerald-900/60 border border-emerald-700/80 px-4 py-3 rounded-2xl text-right">
            <span className="text-xxs text-emerald-200 block font-bold">งานซ่อมเสร็จสมบูรณ์แล้ว</span>
            <span className="text-2xl font-black text-emerald-300 font-display">
              {completedJobs.length} <span className="text-xs font-normal text-slate-300">รายการ</span>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>งานซ่อมเสร็จสิ้น (คัดกรอง)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 font-display">
            {filteredCompletedJobs.length} <span className="text-xs text-slate-400">งาน</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>รวมมูลค่าอะไหล่/งานซ่อม</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 font-display">
            ฿{totalCostHandled.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>ค่าแรงช่างชำระแล้ว</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900 font-display">
            ฿{totalPaymentPaid.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>ชำระเงินเรียบร้อยแล้ว</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 font-display">
            {paidJobsCount} / {filteredCompletedJobs.length} <span className="text-xs text-slate-400">รายการ</span>
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box with Search History Toggle */}
          <div className="md:col-span-2 relative">
            <div className="flex items-center space-x-1.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหาตามรหัสงาน, เลขห้อง, ชื่อคอนโด, ชื่อช่าง หรืออาการซ่อม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchTerm.trim()) {
                      addSearchHistory(searchTerm);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    title="ล้างข้อความค้นหา"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search History Toggle Button */}
              <button
                type="button"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer flex-shrink-0 ${
                  showHistoryPanel || searchHistory.length > 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                title="ดูประวัติคำค้นหาล่าสุด (Search History)"
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">ประวัติการค้นหา</span>
                {searchHistory.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {searchHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Floating Search History Panel */}
            {showHistoryPanel && (
              <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-800">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>ประวัติคำค้นหาล่าสุด (Search History)</span>
                  </div>
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllSearchHistory}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ล้างประวัติ</span>
                    </button>
                  )}
                </div>

                {searchHistory.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {searchHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold px-2.5 py-1 transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => applySearchTerm(item)}
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                          <Tag className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                          <span>{item}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearchHistoryItem(item);
                          }}
                          className="ml-1.5 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          title="ลบคำค้นหานี้"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">ยังไม่มีประวัติการค้นหา</p>
                )}

                {/* Popular Suggested Search Tags */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                    แนะนำคำค้นหายอดนิยม:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["ห้อง 405", "เปลี่ยนหลอดไฟ", "ก๊อกน้ำรั่ว", "SKY", "Grande Tower", "Ocean View"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => applySearchTerm(tag)}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Condo Filter */}
          <div>
            <select
              value={condoFilter}
              onChange={(e) => setCondoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">🏢 อาคาร/คอนโดทั้งหมด ({condosList.length})</option>
              {condosList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tech Filter */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">👨‍🔧 ช่างผู้รับผิดชอบทั้งหมด ({techniciansList.length})</option>
              {techniciansList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Payment Filter & View Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>สถานะชำระเงิน:</span>
            </span>

            <button
              type="button"
              onClick={() => setPaymentFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter("PAID")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === "PAID"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              ชำระเงินแล้ว
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter("UNPAID")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === "UNPAID"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              ยังไม่ชำระเงิน
            </button>
          </div>

          {/* Grid vs Table View switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>มุมมองการ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>ตารางเปรียบเทียบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completed Jobs Cards Display */}
      {filteredCompletedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-sm text-slate-700">ไม่พบประวัติงานซ่อมเสร็จสิ้นตามเงื่อนไขที่ค้นหา</h3>
          <p className="text-xs text-slate-400">ลองปรับเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompletedJobs.map((job) => {
            const warranty = getWarrantyInfo(job);
            const isPaid = job.paymentMethod === "โอนเงิน" || job.paymentMethod === "เงินสด";

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Badge Ribbon */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-extrabold text-xs text-slate-900 truncate font-display">
                        {job.condoName.split(" (")[0]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="bg-emerald-100 text-emerald-950 text-xs font-black px-2 py-0.5 rounded border border-emerald-300">
                        ห้อง {job.roomNo}
                      </span>
                      <span className="font-mono text-xxs text-slate-400 font-bold">
                        {job.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>เสร็จเรียบร้อย</span>
                    </span>

                    {warranty.isWarrantyActive ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full block text-right">
                        🛡️ ประกันอีก {warranty.daysRemaining} วัน
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full block text-right">
                        หมดระยะประกัน
                      </span>
                    )}
                  </div>
                </div>

                {/* Details & Notes */}
                <div className="space-y-1.5 text-xs">
                  <p className="text-slate-800 font-medium line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block text-xxs font-bold text-slate-500 mb-0.5">อาการเสีย/งานซ่อม:</strong>
                    {job.details || job.problem || "ไม่มีระบุ"}
                  </p>

                  {job.notes && (
                    <p className="text-slate-600 text-xxs bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60 italic">
                      <strong className="not-italic text-emerald-800 font-bold">บันทึกช่าง: </strong>
                      {job.notes}
                    </p>
                  )}
                </div>

                {/* Metadata: Technician & Completed Date */}
                <div className="grid grid-cols-2 gap-2 text-xxs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-bold">ช่างผู้ซ่อม</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {job.technician || "ไม่ระบุ"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">วันที่เสร็จสิ้น</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {job.updatedAt || job.workDate || "-"}
                    </span>
                  </div>
                </div>

                {/* Parts & Cost Summary */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="text-xxs">
                    <span className="text-slate-400 font-bold">รวมค่าอะไหล่:</span>
                    <span className="font-black text-slate-900 ml-1 font-display">
                      ฿{(job.totalCost || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xxs">
                    <span className="text-slate-400 font-bold">ค่าแรงช่าง:</span>
                    <span className={`font-black ml-1 font-display ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                      ฿{(job.paymentAmount || 0).toLocaleString()}
                      <span className="font-normal text-[10px] ml-1">
                        ({isPaid ? "จ่ายแล้ว" : "ค้างจ่าย"})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onOpenQrModal(job)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                      title="ดู QR Code ติดตามงานซ่อม"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {onOpenExportPdfModal && (
                      <button
                        type="button"
                        onClick={() => onOpenExportPdfModal(job)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                        title="พิมพ์ใบสั่งซ่อม / บันทึก PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onOpenPaymentModal && (
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal(job)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer border flex items-center space-x-1 ${
                          isPaid
                            ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                        title="ดู/แก้ไขหลักฐานสลิปชำระเงิน"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-xxs font-bold">{isPaid ? "จ่ายแล้ว" : "บันทึกจ่าย"}</span>
                      </button>
                    )}
                  </div>

                  {userRole === UserRole.ADMIN && (
                    <button
                      type="button"
                      disabled={reopeningJobId === job.id || isSyncing}
                      onClick={() => handleReopenJob(job)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xxs font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
                      title="เปิดงานอีกครั้งกรณีแจ้งปัญหารับประกัน"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-300" />
                      <span>เปิดงานซ่อมซ้ำ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="p-3">รหัส / คอนโด / ห้อง</th>
                  <th className="p-3">อาการเสีย & บันทึกการซ่อม</th>
                  <th className="p-3">ช่างผู้รับผิดชอบ</th>
                  <th className="p-3">วันที่เสร็จสิ้น</th>
                  <th className="p-3">ค่าอะไหล่</th>
                  <th className="p-3">ค่าแรงช่าง</th>
                  <th className="p-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCompletedJobs.map((job) => {
                  const isPaid = job.paymentMethod === "โอนเงิน" || job.paymentMethod === "เงินสด";

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-mono text-xxs font-bold text-slate-500">{job.id}</div>
                        <div className="font-black text-slate-900 text-xs">{job.condoName.split(" (")[0]}</div>
                        <div className="text-xxs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-0.5">
                          ห้อง {job.roomNo}
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="line-clamp-2 font-medium text-slate-800">{job.details || job.problem}</p>
                        {job.notes && (
                          <p className="text-xxs text-emerald-700 italic truncate mt-0.5">
                            บันทึก: {job.notes}
                          </p>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {job.technician || "ยังไม่ระบุ"}
                      </td>
                      <td className="p-3 text-xxs text-slate-600 font-medium whitespace-nowrap">
                        {job.updatedAt || job.workDate || "-"}
                      </td>
                      <td className="p-3 font-black text-slate-900 font-display">
                        ฿{(job.totalCost || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-black font-display whitespace-nowrap">
                        <span className={isPaid ? "text-emerald-700" : "text-amber-700"}>
                          ฿{(job.paymentAmount || 0).toLocaleString()}
                        </span>
                        <div className="text-xxs font-bold text-slate-400">
                          {isPaid ? "✓ ชำระแล้ว" : "⏳ ค้างชำระ"}
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onOpenQrModal(job)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                            title="ดู QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          {onOpenExportPdfModal && (
                            <button
                              type="button"
                              onClick={() => onOpenExportPdfModal(job)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                              title="พิมพ์ PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onOpenPaymentModal && (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(job)}
                              className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-all"
                              title="สลิปเงิน"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
