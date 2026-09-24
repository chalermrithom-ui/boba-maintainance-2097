import React from 'react';
import {
  X,
  Wrench,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { User, RepairTicket, STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../types';

interface TechnicianJobsModalProps {
  technician: User;
  tickets: RepairTicket[];
  onClose: () => void;
  onSelectTicket?: (ticket: RepairTicket) => void;
}

export const TechnicianJobsModal: React.FC<TechnicianJobsModalProps> = ({
  technician,
  tickets,
  onClose,
  onSelectTicket,
}) => {
  // Find all tickets assigned to this technician by name or loginId
  const assignedTickets = tickets.filter(
    (t) =>
      t.assignedTechnician === technician.name ||
      t.assignedTechnician?.includes(technician.name.split(' ')[0]) ||
      t.assignedTechnician?.includes(technician.loginId)
  );

  const activeCount = assignedTickets.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  const completedCount = assignedTickets.filter((t) => t.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-6 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src={technician.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80'}
              alt={technician.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  {technician.name}
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  @{technician.loginId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {technician.phone || technician.email} • งานที่รับผิดชอบทั้งหมด ({assignedTickets.length} งาน)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2.5 my-4 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="text-[11px] text-slate-500 font-medium">งานทั้งหมด</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">{assignedTickets.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-center">
            <div className="text-[11px] text-amber-700 font-medium">กำลังดำเนินการ/ค้างอยู่</div>
            <div className="text-lg font-extrabold text-amber-900 mt-0.5">{activeCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center">
            <div className="text-[11px] text-emerald-700 font-medium">เสร็จสิ้นแล้ว</div>
            <div className="text-lg font-extrabold text-emerald-900 mt-0.5">{completedCount}</div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {assignedTickets.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-700">ยังไม่มีงานที่มอบหมายให้ช่างคนนี้</div>
              <p className="text-xs text-slate-400 mt-1">
                คุณสามารถมอบหมายงานให้ {technician.name} ได้จากหน้ารายการแจ้งซ่อม
              </p>
            </div>
          ) : (
            assignedTickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new;
              const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
              const categoryCfg = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;

              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {ticket.jobNumber}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${priorityCfg.badgeClass}`}>
                        {priorityCfg.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {ticket.title}
                    </h4>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 flex-wrap gap-y-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {ticket.propertyName} ห้อง {ticket.unitNumber}
                        </span>
                      </span>

                      {ticket.appointment ? (
                        <span className="flex items-center space-x-1 text-sky-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          <span>
                            นัด {ticket.appointment.date} ({ticket.appointment.timeSlot})
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>แจ้ง {ticket.createdAt}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {onSelectTicket && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectTicket(ticket);
                      }}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
                    >
                      <span>ดูรายละเอียดงาน</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
