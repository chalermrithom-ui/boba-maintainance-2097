import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  RotateCcw,
  Building,
  Calendar,
  Wrench,
  Download,
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
  Legend,
} from 'recharts';
import {
  RepairTicket,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
} from '../types';
import { TicketService } from '../services/ticketService';

interface HistoryReportViewProps {
  tickets: RepairTicket[];
  onSelectTicket: (ticket: RepairTicket) => void;
  onResetData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const HistoryReportView: React.FC<HistoryReportViewProps> = ({
  tickets,
  onSelectTicket,
  onResetData,
  showToast,
}) => {
  const [unitSearch, setUnitSearch] = useState('');

  // Total metrics
  const completedTickets = tickets.filter((t) => t.status === 'completed');
  const totalCost = tickets.reduce((acc, t) => {
    const ticketTotal = (t.expenses || []).reduce((subAcc, exp) => subAcc + (exp.amount || 0), 0);
    return acc + ticketTotal;
  }, 0);

  const completionRate = Math.round((completedTickets.length / (tickets.length || 1)) * 100);

  // Category expense analysis
  const categoryExpenseMap: Record<string, number> = {};
  tickets.forEach((t) => {
    const tSum = (t.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const catLabel = CATEGORY_CONFIG[t.category]?.label || t.category;
    categoryExpenseMap[catLabel] = (categoryExpenseMap[catLabel] || 0) + tSum;
  });

  const categoryExpenseData = Object.entries(categoryExpenseMap)
    .filter(([_, amount]) => amount > 0)
    .map(([cat, amount], index) => {
      const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
      return {
        name: cat,
        amount,
        color: colors[index % colors.length],
      };
    });

  // Monthly volume data
  const monthlyData = [
    { month: 'พ.ค.', count: 4, cost: 2400 },
    { month: 'มิ.ย.', count: 7, cost: 4200 },
    { month: 'ก.ค.', count: 12, cost: 6800 },
    { month: 'ส.ค.', count: 15, cost: 8900 },
    { month: 'ก.ย.', count: tickets.length, cost: totalCost },
  ];

  // Unit History Search filter
  const unitHistory = useMemo(() => {
    if (!unitSearch.trim()) return tickets;
    const query = unitSearch.toLowerCase().trim();
    return tickets.filter(
      (t) =>
        t.unitNumber.toLowerCase().includes(query) ||
        t.propertyName.toLowerCase().includes(query) ||
        t.requesterName.toLowerCase().includes(query)
    );
  }, [tickets, unitSearch]);

  const handleExportCsv = () => {
    TicketService.exportToCsv(unitHistory);
    showToast('ดาวน์โหลดรายงานแล้ว', 'ส่งออกข้อมูลเป็นไฟล์ Excel / CSV สำเร็จ', 'success');
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      onResetData();
      showToast('รีเซ็ตข้อมูลสำเร็จ', 'คืนค่าข้อมูลตัวอย่างงานซ่อมแซมทั้งหมดแล้ว', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>ประวัติงานซ่อมและรายงานสถิติ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            วิเคราะห์ต้นทุนค่าใช้จ่าย สถิติการปิดงาน และประวัติการแจ้งซ่อมย้อนหลังรายห้อง
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกรายงาน CSV</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition cursor-pointer"
            title="รีเซ็ตข้อมูลทดสอบ"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">รีเซ็ตข้อมูล</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">งานซ่อมทั้งหมด</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            {tickets.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ใบงานในระบบ</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ปิดงานเสร็จสิ้น</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-display">
            {completedTickets.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            อัตราปิดงาน {completionRate}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ค่าใช้จ่ายรวม</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            {totalCost.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">บาท (ค่าแรง + ค่าอะไหล่)</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">เวลาเฉลี่ยปิดงาน</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            1.5
          </div>
          <p className="text-[11px] text-slate-500 mt-1">วันทำการ</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Category Pie */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-sm font-bold text-slate-900">สัดส่วนค่าใช้จ่ายตามหมวดหมู่งาน</h3>
            <p className="text-[11px] text-slate-500">มูลค่าอะไหล่และค่าแรงที่เกิดขึ้นจริง</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {categoryExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} บาท`, 'ค่าใช้จ่าย']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {categoryExpenseData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900">({item.amount.toLocaleString()} ฿)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume & Cost Trend Bar Chart */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-sm font-bold text-slate-900">แนวโน้มจำนวนงานซ่อมรายเดือน</h3>
            <p className="text-[11px] text-slate-500">ปริมาณงานที่แจ้งเข้าระบบในแต่ละเดือน</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'cost' ? `${Number(val).toLocaleString()} บาท` : `${val} งาน`,
                    name === 'cost' ? 'ค่าใช้จ่าย' : 'จำนวนงาน',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" name="จำนวนงาน" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Unit History Search Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">ประวัติการซ่อมแซมรายห้อง / รายโครงการ</h3>
            <p className="text-xs text-slate-500">ค้นหาเพื่อดูประวัติการซ่อมแซมทั้งหมดของห้องนั้น ๆ</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="พิมพ์เลขห้อง เช่น 812, 1405 หรือชื่อโครงการ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">เลขใบงาน</th>
                <th className="p-3">สถานที่ & ห้อง</th>
                <th className="p-3">หัวข้องาน</th>
                <th className="p-3">ผู้แจ้งงาน</th>
                <th className="p-3">ช่างผู้ซ่อม</th>
                <th className="p-3">ค่าใช้จ่าย</th>
                <th className="p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitHistory.map((t) => {
                const cost = (t.expenses || []).reduce((acc, c) => acc + (c.amount || 0), 0);
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {t.jobNumber}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                      {t.propertyName} <span className="text-blue-600 font-bold">({t.unitNumber})</span>
                    </td>
                    <td className="p-3 max-w-[220px] truncate text-slate-700">
                      {t.title}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {t.requesterName}
                    </td>
                    <td className="p-3 text-slate-700 whitespace-nowrap">
                      {t.assignedTechnician || '-'}
                    </td>
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      {cost > 0 ? `${cost.toLocaleString()} ฿` : '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg border font-semibold text-[10px] ${STATUS_CONFIG[t.status]?.badgeClass}`}>
                        {STATUS_CONFIG[t.status]?.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
