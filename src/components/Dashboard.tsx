import React from 'react';
import {
  PlusCircle,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Building,
  User,
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
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  RepairTicket,
  TicketStatus,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  User as UserType,
} from '../types';

interface DashboardProps {
  tickets: RepairTicket[];
  currentUser: UserType;
  onSelectTicket: (ticket: RepairTicket) => void;
  onNewTicketClick: () => void;
  onNavigateTab: (tab: 'tickets' | 'calendar' | 'new_ticket') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  onNewTicketClick,
  onNavigateTab,
}) => {
  // Counts by status
  const statusCounts: Record<TicketStatus, number> = {
    new: 0,
    assigned: 0,
    scheduled: 0,
    in_progress: 0,
    waiting_parts: 0,
    completed: 0,
    cancelled: 0,
  };

  tickets.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status] += 1;
    }
  });

  // Urgent & Emergency jobs
  const urgentJobs = tickets.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'emergency') && t.status !== 'completed' && t.status !== 'cancelled'
  );

  // Upcoming scheduled jobs
  const scheduledJobs = tickets
    .filter((t) => t.appointment?.date && t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => (a.appointment?.date || '').localeCompare(b.appointment?.date || ''))
    .slice(0, 5);

  // Category data for Pie chart
  const categoryCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label || cat,
    value: count,
    color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || '#3b82f6',
  }));

  // Status chart data
  const statusChartData = (Object.keys(STATUS_CONFIG) as TicketStatus[]).map((st) => ({
    name: STATUS_CONFIG[st].label,
    count: statusCounts[st],
    color: STATUS_CONFIG[st].colorHex,
  }));

  // Recent jobs (top 5)
  const recentJobs = [...tickets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>สวัสดี</span>
              <span>•</span>
              <span>{currentUser.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
              ระบบศูนย์ควบคุมงานซ่อมแซม FixFlow
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              ติดตามสถานะงานซ่อม นัดหมายช่าง และบริหารจัดการทรัพย์สินอย่างเป็นระบบในที่เดียว
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onNewTicketClick}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-blue-900 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>แจ้งงานซ่อมใหม่</span>
            </button>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="flex items-center justify-center space-x-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-sm border border-white/20 transition cursor-pointer"
            >
              <span>ดูงานทั้งหมด</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Summary Grid (7 Status Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            สรุปสถานะงานซ่อมทั้งหมด ({tickets.length} รายการ)
          </h2>
          <button
            onClick={() => onNavigateTab('tickets')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
          >
            <span>ดูตารางงาน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const count = statusCounts[status];
            return (
              <div
                key={status}
                onClick={() => onNavigateTab('tickets')}
                className={`p-3.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${config.bg} ${config.border}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {Math.round((count / (tickets.length || 1)) * 100)}%
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-black tracking-tight ${config.text} font-display`}>
                  {count}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">
                  {config.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgent Alert & Upcoming Appointments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgent & Emergency Alert Box */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">งานเร่งด่วนและฉุกเฉิน</h3>
                  <p className="text-[11px] text-slate-500">ต้องดำเนินการตรวจสอบทันที</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {urgentJobs.length} รายการ
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {urgentJobs.length > 0 ? (
                urgentJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onSelectTicket(job)}
                    className="py-3 hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-extrabold text-blue-700">
                          {job.jobNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            PRIORITY_CONFIG[job.priority]?.badgeClass
                          }`}
                        >
                          {PRIORITY_CONFIG[job.priority]?.label}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {job.propertyName} • ห้อง {job.unitNumber}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border shrink-0 ${
                        STATUS_CONFIG[job.status]?.badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[job.status]?.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                  <p>ไม่มีงานเร่งด่วนค้างอยู่ในระบบ</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('tickets')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center space-x-1 w-full cursor-pointer"
          >
            <span>จัดการงานทั้งหมดในรายการ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upcoming Scheduled Tasks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">งานใกล้ถึงวันนัดหมาย</h3>
                  <p className="text-[11px] text-slate-500">ลำดับนัดหมายเข้าซ่อมแซมหน้างาน</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-semibold text-sky-600 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>เปิดปฏิทิน</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {scheduledJobs.length > 0 ? (
                scheduledJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onSelectTicket(job)}
                    className="py-3 hover:bg-slate-50/80 px-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {job.appointment?.date}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {job.appointment?.timeSlot}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {job.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {job.propertyName} • ห้อง {job.unitNumber} • ช่าง:{' '}
                        <strong className="text-slate-700 font-semibold">{job.assignedTechnician || 'ยังไม่ระบุ'}</strong>
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border shrink-0 ${
                        STATUS_CONFIG[job.status]?.badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[job.status]?.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p>ยังไม่มีงานที่ลงเวลานัดหมายไว้</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('calendar')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center justify-center space-x-1 w-full cursor-pointer"
          >
            <span>ดูตารางปฏิทินงานรายสัปดาห์ / รายเดือน</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">สัดส่วนงานตามประเภทปัญหา</h3>
              <p className="text-[11px] text-slate-500">การกระจายตัวของประเภทงานซ่อม</p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {categoryChartData.length} หมวดหมู่
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} รายการ`, 'จำนวนงาน']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {categoryChartData.slice(0, 6).map((c) => (
              <div key={c.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                <span className="text-slate-600 truncate">{c.name}</span>
                <span className="font-bold text-slate-900">({c.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution Bar Chart */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ความคืบหน้าของงานทั้งหมด</h3>
              <p className="text-[11px] text-slate-500">จำนวนงานในแต่ละสถานะ</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              ดูรายงานละเอียด
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} งาน`, 'จำนวน']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">รายการงานซ่อมล่าสุด</h3>
            <p className="text-[11px] text-slate-500">งานที่มีการสร้างหรืออัปเดตล่าสุดในระบบ</p>
          </div>
          <button
            onClick={() => onNavigateTab('tickets')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>ดูทั้งหมด ({tickets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">เลขที่ใบงาน</th>
                <th className="p-3">หัวข้องาน</th>
                <th className="p-3">สถานที่/ห้อง</th>
                <th className="p-3">ความเร่งด่วน</th>
                <th className="p-3">ช่างผู้รับผิดชอบ</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => onSelectTicket(job)}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {job.jobNumber}
                  </td>
                  <td className="p-3 font-semibold text-slate-800 max-w-[220px] truncate">
                    <div className="flex items-center space-x-1.5">
                      {getCategoryIcon(job.category)}
                      <span className="truncate">{job.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {job.propertyName} ({job.unitNumber})
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${PRIORITY_CONFIG[job.priority]?.badgeClass}`}>
                      {PRIORITY_CONFIG[job.priority]?.label}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 whitespace-nowrap">
                    {job.assignedTechnician || <span className="text-slate-400">ยังไม่ระบุ</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${STATUS_CONFIG[job.status]?.badgeClass}`}>
                      {STATUS_CONFIG[job.status]?.label}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(job);
                      }}
                      className="px-2.5 py-1 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
