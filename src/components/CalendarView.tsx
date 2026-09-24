import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Eye,
  Plus,
} from 'lucide-react';
import {
  RepairTicket,
  TicketStatus,
  TicketPriority,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
} from '../types';
import { TECHNICIANS_LIST } from '../services/ticketService';

interface CalendarViewProps {
  tickets: RepairTicket[];
  onSelectTicket: (ticket: RepairTicket) => void;
  onNewTicketClick: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tickets,
  onSelectTicket,
  onNewTicketClick,
}) => {
  // Calendar mode: month, week, day
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Currently viewed date (defaults to current date e.g. 2026-09-21)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    // Default to Sept 2026 if current year is 2026
    return new Date(2026, 8, 21); // Month is 0-indexed (8 = September)
  });

  // Filters
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected date for day view or popover
  const [selectedDayDate, setSelectedDayDate] = useState<string>('2026-09-21');
  const [activePreviewTicket, setActivePreviewTicket] = useState<RepairTicket | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDayDate(d.toISOString().slice(0, 10));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDayDate(d.toISOString().slice(0, 10));
    }
  };

  const handleToday = () => {
    const today = new Date(2026, 8, 21);
    setCurrentDate(today);
    setSelectedDayDate('2026-09-21');
  };

  // Thai month names
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const monthLabel = `${thaiMonths[month]} ${year + 543}`;

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (!t.appointment?.date) return false;
      if (selectedTech !== 'all' && t.assignedTechnician !== selectedTech) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      return true;
    });
  }, [tickets, selectedTech, selectedStatus]);

  // Group tickets by YYYY-MM-DD
  const ticketsByDate = useMemo(() => {
    const map: Record<string, RepairTicket[]> = {};
    filteredTickets.forEach((t) => {
      const d = t.appointment?.date;
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [filteredTickets]);

  // Generate Month Grid (42 cells: 6 weeks)
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to reach 35 or 42
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span>ปฏิทินงานนัดหมายเข้าซ่อม</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ตารางการนัดหมายช่างเทคนิคเข้าตรวจสอบและซ่อมบำรุงในโครงการ
          </p>
        </div>

        {/* View Mode Switcher (Month / Day) */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              รายวัน
            </button>
          </div>

          <button
            onClick={onNewTicketClick}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>นัดงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Calendar Navigation & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Month Picker / Navigator */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            วันนี้
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="ถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-base sm:text-lg font-black text-slate-800 ml-2 font-display">
            {monthLabel}
          </span>
        </div>

        {/* Filters (Tech, Status) */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">ช่างทุกคน</option>
            {TECHNICIANS_LIST.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">ทุกสถานะงาน</option>
            {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600">
            <span className="text-rose-600">อา.</span>
            <span>จ.</span>
            <span>อ.</span>
            <span>พ.</span>
            <span>พฤ.</span>
            <span>ศ.</span>
            <span className="text-blue-600">ส.</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {monthDays.map((day, idx) => {
              const dayTickets = ticketsByDate[day.dateStr] || [];
              const isToday = day.dateStr === '2026-09-21';

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => {
                    setSelectedDayDate(day.dateStr);
                    if (dayTickets.length > 0) {
                      setActivePreviewTicket(dayTickets[0]);
                    }
                  }}
                  className={`p-1.5 sm:p-2.5 min-h-[95px] flex flex-col transition cursor-pointer hover:bg-blue-50/30 ${
                    !day.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'text-slate-800'
                  } ${isToday ? 'bg-blue-50/50' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {dayTickets.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                        {dayTickets.length} งาน
                      </span>
                    )}
                  </div>

                  {/* Day Tickets Stack */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayTickets.slice(0, 3).map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className={`p-1 rounded-lg text-[10px] font-medium truncate border shadow-xs transition hover:scale-[1.02] cursor-pointer ${
                          ticket.priority === 'emergency'
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                            : ticket.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                        }`}
                        title={`${ticket.jobNumber}: ${ticket.title} (${ticket.unitNumber})`}
                      >
                        <span className="font-bold mr-1">
                          {ticket.appointment?.timeSlot ? ticket.appointment.timeSlot.split(' ')[0] : ''}
                        </span>
                        <span>{ticket.title}</span>
                      </div>
                    ))}

                    {dayTickets.length > 3 && (
                      <span className="text-[10px] font-bold text-slate-500 pl-1">
                        + อีก {dayTickets.length - 3} รายการ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Day View */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ตารางงานประจำวันที่ {selectedDayDate}
              </h3>
              <p className="text-xs text-slate-500">
                มีทั้งหมด {(ticketsByDate[selectedDayDate] || []).length} งานนัดหมาย
              </p>
            </div>
            <input
              type="date"
              value={selectedDayDate}
              onChange={(e) => setSelectedDayDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {(ticketsByDate[selectedDayDate] || []).length > 0 ? (
              ticketsByDate[selectedDayDate].map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="py-4 hover:bg-slate-50 px-3 rounded-2xl transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {ticket.jobNumber}
                      </span>
                      <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                        {ticket.appointment?.timeSlot}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          PRIORITY_CONFIG[ticket.priority]?.badgeClass
                        }`}
                      >
                        {PRIORITY_CONFIG[ticket.priority]?.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>

                    <p className="text-xs text-slate-500">
                      {ticket.propertyName} • ห้อง {ticket.unitNumber} • ผู้แจ้ง: {ticket.requesterName} ({ticket.requesterPhone})
                    </p>

                    <div className="flex items-center space-x-1 text-xs text-slate-700 font-semibold pt-1">
                      <HardHat className="w-3.5 h-3.5 text-orange-600 inline mr-1" />
                      <span>ช่างผู้รับผิดชอบ: {ticket.assignedTechnician || 'ยังไม่ระบุ'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                        STATUS_CONFIG[ticket.status]?.badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[ticket.status]?.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>ไม่มีงานนัดหมายในวันที่เลือก</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
