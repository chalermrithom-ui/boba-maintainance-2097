import React, { useState } from "react";
import { JobStatus, JobPriority, UserRole } from "../types";
import {
  CheckSquare,
  Square,
  X,
  UserCheck,
  AlertCircle,
  Trash2,
  ListFilter,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRightLeft,
  Sparkles,
  HardDrive
} from "lucide-react";

interface BatchActionsToolbarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: JobStatus) => void;
  onBulkAssignTechnician: (technician: string) => void;
  onBulkPriorityChange: (priority: JobPriority) => void;
  onBulkDelete: () => void;
  techniciansList: string[];
  userRole: UserRole;
  onOpenCleanupModal?: () => void;
}

export const BatchActionsToolbar: React.FC<BatchActionsToolbarProps> = ({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  onBulkStatusChange,
  onBulkAssignTechnician,
  onBulkPriorityChange,
  onBulkDelete,
  techniciansList,
  userRole,
  onOpenCleanupModal,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [customTechInput, setCustomTechInput] = useState<string>("");
  const [isCustomTechOpen, setIsCustomTechOpen] = useState<boolean>(false);

  const handleApplyStatus = () => {
    if (!selectedStatus) return;
    onBulkStatusChange(selectedStatus as JobStatus);
    setSelectedStatus("");
  };

  const handleApplyTechnician = () => {
    const techName = isCustomTechOpen ? customTechInput.trim() : selectedTech;
    if (!techName) return;
    onBulkAssignTechnician(techName);
    setSelectedTech("");
    setCustomTechInput("");
    setIsCustomTechOpen(false);
  };

  const handleApplyPriority = () => {
    if (!selectedPriority) return;
    onBulkPriorityChange(selectedPriority as JobPriority);
    setSelectedPriority("");
  };

  return (
    <div className="sticky top-4 z-30 mb-6 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-700 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Section: Selection Count & Select All */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-emerald-300" />
            ) : (
              <Square className="h-4 w-4 text-slate-300" />
            )}
            <span>{isAllSelected ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">
              เลือกแล้ว <span className="font-extrabold text-indigo-300 font-mono text-sm">{selectedCount}</span> / {totalFilteredCount} รายการ
            </span>
          </div>

          <button
            type="button"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="ล้างรายการที่เลือก"
          >
            <X className="h-3.5 w-3.5" />
            <span>ล้างการเลือก</span>
          </button>
        </div>

        {/* Right Section: Batch Operations Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          
          {/* 1. Bulk Status Update */}
          <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border-0 font-medium"
            >
              <option value="">-- เปลี่ยนสถานะกลุ่ม --</option>
              <option value={JobStatus.PENDING}>⏳ {JobStatus.PENDING}</option>
              <option value={JobStatus.IN_PROGRESS}>🔧 {JobStatus.IN_PROGRESS}</option>
              <option value={JobStatus.UNDER_REVIEW}>🔍 {JobStatus.UNDER_REVIEW}</option>
              <option value={JobStatus.COMPLETED}>✅ {JobStatus.COMPLETED}</option>
            </select>
            <button
              type="button"
              onClick={handleApplyStatus}
              disabled={!selectedStatus}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ปรับสถานะ
            </button>
          </div>

          {/* 2. Bulk Technician Assignment */}
          <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            {isCustomTechOpen ? (
              <input
                type="text"
                placeholder="ระบุชื่อช่าง..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none w-28"
              />
            ) : (
              <select
                value={selectedTech}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    setIsCustomTechOpen(true);
                  } else {
                    setSelectedTech(e.target.value);
                  }
                }}
                className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border-0 font-medium max-w-[130px] sm:max-w-none"
              >
                <option value="">-- มอบหมายช่างกลุ่ม --</option>
                {techniciansList.map((tech) => (
                  <option key={tech} value={tech}>
                    👤 {tech}
                  </option>
                ))}
                <option value="CUSTOM">✏️ ระบุชื่อช่างเอง...</option>
              </select>
            )}

            <button
              type="button"
              onClick={handleApplyTechnician}
              disabled={isCustomTechOpen ? !customTechInput.trim() : !selectedTech}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              มอบหมาย
            </button>
            {isCustomTechOpen && (
              <button
                type="button"
                onClick={() => setIsCustomTechOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 3. Bulk Priority Update */}
          <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border-0 font-medium"
            >
              <option value="">-- ระดับความสำคัญ --</option>
              <option value={JobPriority.CRITICAL}>🚨 Critical (วิกฤต)</option>
              <option value={JobPriority.HIGH}>⚡ High (สูง/ด่วน)</option>
              <option value={JobPriority.NORMAL}>Normal (ปกติ)</option>
              <option value={JobPriority.LOW}>Low (ต่ำ)</option>
            </select>
            <button
              type="button"
              onClick={handleApplyPriority}
              disabled={!selectedPriority}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              ตั้ง Priority
            </button>
          </div>

          {/* 4. Bulk Delete & Storage Cleanup (Admin only) */}
          {userRole === UserRole.ADMIN && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={onBulkDelete}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                title="ลบงานซ่อมที่เลือกทั้งหมด"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ลบที่เลือก</span>
              </button>

              {onOpenCleanupModal && (
                <button
                  type="button"
                  onClick={onOpenCleanupModal}
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-700 to-indigo-800 hover:from-rose-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs border border-rose-400/30 cursor-pointer"
                  title="ล้างข้อมูลงานซ่อมขยะ (> 6 เดือน หรือสถานะยกเลิก)"
                >
                  <HardDrive className="h-3.5 w-3.5 text-rose-300" />
                  <span>🧹 ล้างข้อมูลระบบ</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
