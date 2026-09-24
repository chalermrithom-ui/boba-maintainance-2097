import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  PlusCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Zap,
  Droplets,
  Wind,
  Tv,
  DoorOpen,
  Paintbrush,
  Armchair,
  Wifi,
  HelpCircle,
} from 'lucide-react';
import {
  RepairTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  User,
} from '../types';
import { TicketService, TECHNICIANS_LIST } from '../services/ticketService';

interface TicketListProps {
  tickets: RepairTicket[];
  currentUser?: User;
  onSelectTicket: (ticket: RepairTicket) => void;
  onNewTicketClick: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onNewTicketClick,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'priority' | 'unit'>('createdAt_desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Filter logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Role-based visibility: Technicians see only their assigned jobs
      if (currentUser?.role === 'technician') {
        const myName = currentUser.name;
        const myFirstName = myName.split(' ')[0];
        const isAssignedToMe =
          t.assignedTechnician === myName ||
          (t.assignedTechnician && t.assignedTechnician.includes(myFirstName));
        if (!isAssignedToMe) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchJobNumber = t.jobNumber.toLowerCase().includes(query);
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDescription = t.description.toLowerCase().includes(query);
        const matchUnit = t.unitNumber.toLowerCase().includes(query);
        const matchProperty = t.propertyName.toLowerCase().includes(query);
        const matchRequester = t.requesterName.toLowerCase().includes(query);
        const matchTech = (t.assignedTechnician || '').toLowerCase().includes(query);

        if (
          !matchJobNumber &&
          !matchTitle &&
          !matchDescription &&
          !matchUnit &&
          !matchProperty &&
          !matchRequester &&
          !matchTech
        ) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && t.status !== selectedStatus) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Technician filter
      if (selectedTechnician !== 'all') {
        if (selectedTechnician === 'unassigned') {
          if (t.assignedTechnician) return false;
        } else if (t.assignedTechnician !== selectedTechnician) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, currentUser, searchTerm, selectedStatus, selectedCategory, selectedPriority, selectedTechnician]);

  // Sorting
  const sortedTickets = useMemo(() => {
    const list = [...filteredTickets];
    if (sortBy === 'createdAt_desc') {
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    if (sortBy === 'createdAt_asc') {
      return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    if (sortBy === 'priority') {
      const pWeights: Record<string, number> = { emergency: 3, urgent: 2, normal: 1 };
      return list.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    }
    if (sortBy === 'unit') {
      return list.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
    }
    return list;
  }, [filteredTickets, sortBy]);

  // Pagination slicing
  const totalPages = Math.ceil(sortedTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTickets.slice(start, start + pageSize);
  }, [sortedTickets, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSelectedTechnician('all');
    setCurrentPage(1);
  };

  const isFilterActive =
    searchTerm !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPriority !== 'all' ||
    selectedTechnician !== 'all';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'plumbing':
        return <Droplets className="w-3.5 h-3.5 text-cyan-500" />;
      case 'air_conditioner':
        return <Wind className="w-3.5 h-3.5 text-blue-500" />;
      case 'appliances':
        return <Tv className="w-3.5 h-3.5 text-purple-500" />;
      case 'doors_windows':
        return <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />;
      case 'walls_ceiling':
        return <Paintbrush className="w-3.5 h-3.5 text-pink-500" />;
      case 'furniture':
        return <Armchair className="w-3.5 h-3.5 text-lime-500" />;
      case 'internet':
        return <Wifi className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
            รายการงานซ่อมแซมทั้งหมด
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            พบทั้งหมด <strong className="text-blue-700 font-bold">{sortedTickets.length}</strong> รายการ จากระบบ
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => TicketService.exportToCsv(sortedTickets)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="ดาวน์โหลดรายการเป็นไฟล์ CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={onNewTicketClick}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>แจ้งงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาด้วยเลขใบงาน, ชื่อผู้แจ้ง, เลขห้อง, โครงการ หรือรายละเอียดปัญหา..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              สถานะงาน
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทุกสถานะ ({tickets.length})</option>
              {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              หมวดหมู่ปัญหา
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {(Object.keys(CATEGORY_CONFIG) as TicketCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ความเร่งด่วน
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทุกระดับ</option>
              {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map((pr) => (
                <option key={pr} value={pr}>
                  {PRIORITY_CONFIG[pr].label}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ช่างผู้รับผิดชอบ
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => {
                setSelectedTechnician(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ช่างทั้งหมด</option>
              <option value="unassigned">ยังไม่ได้มอบหมาย</option>
              {TECHNICIANS_LIST.map((tech) => (
                <option key={tech.name} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              เรียงลำดับตาม
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="createdAt_desc">วันที่สร้าง (ใหม่สุดก่อน)</option>
              <option value="createdAt_asc">วันที่สร้าง (เก่าสุดก่อน)</option>
              <option value="priority">ความเร่งด่วน (ฉุกเฉินก่อน)</option>
              <option value="unit">เลขห้อง/บ้าน</option>
            </select>
          </div>
        </div>

        {/* Clear filter indicator */}
        {isFilterActive && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              กำลังแสดงผลลัพธ์การกรอง: <strong className="text-slate-800">{sortedTickets.length}</strong> รายการ
            </span>
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          </div>
        )}
      </div>

      {/* Tickets List View */}
      {sortedTickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">ไม่พบรายการงานซ่อมตามเงื่อนไข</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูรายการทั้งหมด
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">เลขใบงาน</th>
                  <th className="p-3.5">หัวข้องาน / หมวดหมู่</th>
                  <th className="p-3.5">สถานที่ & ห้อง</th>
                  <th className="p-3.5">ผู้แจ้ง / เบอร์โทร</th>
                  <th className="p-3.5">ความเร่งด่วน</th>
                  <th className="p-3.5">ช่างผู้รับผิดชอบ</th>
                  <th className="p-3.5">วันนัดหมาย</th>
                  <th className="p-3.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {ticket.jobNumber}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 rounded bg-slate-100 shrink-0">
                          {getCategoryIcon(ticket.category)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-[200px] group-hover:text-blue-600 transition">
                            {ticket.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {CATEGORY_CONFIG[ticket.category]?.label || ticket.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{ticket.propertyName}</div>
                      <span className="text-[11px] text-slate-500">
                        {ticket.building ? `${ticket.building} ` : ''}ห้อง {ticket.unitNumber}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{ticket.requesterName}</div>
                      <span className="text-[11px] text-slate-400">{ticket.requesterPhone}</span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] ${
                          PRIORITY_CONFIG[ticket.priority]?.badgeClass
                        }`}
                      >
                        {PRIORITY_CONFIG[ticket.priority]?.label}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      {ticket.assignedTechnician ? (
                        <span className="font-semibold text-slate-800">{ticket.assignedTechnician}</span>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่มอบหมาย</span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-600">
                      {ticket.appointment?.date ? (
                        <div>
                          <div className="font-bold text-slate-800">{ticket.appointment.date}</div>
                          <span className="text-[10px] text-slate-400">{ticket.appointment.timeSlot}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                          STATUS_CONFIG[ticket.status]?.badgeClass
                        }`}
                      >
                        {STATUS_CONFIG[ticket.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {paginatedTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 active:bg-blue-50/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-blue-700">
                    {ticket.jobNumber}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] ${
                        PRIORITY_CONFIG[ticket.priority]?.badgeClass
                      }`}
                    >
                      {PRIORITY_CONFIG[ticket.priority]?.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg border font-semibold text-[10px] ${
                        STATUS_CONFIG[ticket.status]?.badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[ticket.status]?.label}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {ticket.title}
                </h4>

                <div className="text-xs text-slate-600 space-y-1 mb-2.5">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">
                      {ticket.propertyName} ({ticket.unitNumber})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>ผู้แจ้ง: {ticket.requesterName}</span>
                    <span>ช่าง: {ticket.assignedTechnician || 'ยังไม่ระบุ'}</span>
                  </div>
                </div>

                {ticket.appointment?.date && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-sky-700">
                    <span className="flex items-center space-x-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      นัดหมาย: {ticket.appointment.date}
                    </span>
                    <span className="text-slate-500">{ticket.appointment.timeSlot}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span>แสดงแถวละ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value={5}>5 รายการ</option>
                <option value={8}>8 รายการ</option>
                <option value={15}>15 รายการ</option>
                <option value={30}>30 รายการ</option>
              </select>
              <span>
                หน้า {currentPage} จาก {totalPages} (ทั้งหมด {sortedTickets.length} งาน)
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), currentPage + 2)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg font-semibold transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="หน้าถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
