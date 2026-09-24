import React, { useState } from "react";
import { RepairJob, Part, JobStatus } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Award, Sparkles, AlertCircle, FileText, Printer, Loader2 } from "lucide-react";

interface AnalyticsPanelProps {
  repairs: RepairJob[];
  inventory: Part[];
}

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const COLORS = ["#f59e0b", "#3b82f6", "#6366f1", "#10b981"]; // Orange, Blue, Purple, Green

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ repairs, inventory }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  // AI report states
  const [aiReport, setAiReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  // 1. Process Repairs data for Status Pie Chart
  const statusCounts = repairs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    {
      [JobStatus.PENDING]: 0,
      [JobStatus.IN_PROGRESS]: 0,
      [JobStatus.UNDER_REVIEW]: 0,
      [JobStatus.COMPLETED]: 0,
    }
  );

  const pieData = [
    { name: "รอดำเนินการ", value: statusCounts[JobStatus.PENDING] },
    { name: "กำลังดำเนินการ", value: statusCounts[JobStatus.IN_PROGRESS] },
    { name: "รอตรวจสอบ", value: statusCounts[JobStatus.UNDER_REVIEW] },
    { name: "เสร็จสิ้น", value: statusCounts[JobStatus.COMPLETED] },
  ].filter(d => d.value > 0);

  // 2. Process repairs data for Monthly trend (Thai calendar months)
  const monthlyTrendMap = repairs.reduce((acc, job) => {
    if (!job.workDate) return acc;
    const date = new Date(job.workDate);
    const m = date.getMonth(); // 0-11
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  const monthlyTrendData = MONTHS_TH.map((mName, idx) => ({
    name: mName.substring(0, 6),
    "งานซ่อม": monthlyTrendMap[idx] || 0,
  }));

  // 3. Process repairs data by Condo Building
  const condoTrendMap = repairs.reduce((acc, job) => {
    if (!job.condoName) return acc;
    // Extract short name
    const shortName = job.condoName.split(" (")[0];
    acc[shortName] = (acc[shortName] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const condoTrendData = Object.keys(condoTrendMap).map((condo) => ({
    name: condo,
    "จำนวนงาน": condoTrendMap[condo],
  })).sort((a, b) => b["จำนวนงาน"] - a["จำนวนงาน"]);

  // Calculate high-level stats
  const totalRepairsCount = repairs.length;
  const completedCount = statusCounts[JobStatus.COMPLETED];
  const completionRate = totalRepairsCount > 0 ? Math.round((completedCount / totalRepairsCount) * 100) : 0;
  
  const lowStockParts = inventory.filter(p => p.qty <= p.minQty);

  // Trigger Gemini AI Monthly Summary & Preventive Maintenance report
  const handleGenerateAiReport = async () => {
    setIsGenerating(true);
    setAiError("");
    setAiReport("");
    try {
      // Filter repairs for the selected month & year
      const filteredRepairs = repairs.filter(job => {
        if (!job.workDate) return false;
        const d = new Date(job.workDate);
        return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
      });

      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repairs: filteredRepairs,
          inventory: inventory.map(p => ({ name: p.name, qty: p.qty, unit: p.unit, minQty: p.minQty })),
          month: MONTHS_TH[selectedMonth - 1],
          year: selectedYear,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiReport(data.summary);
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "เกิดข้อผิดพลาดในการเรียกใช้บริการ AI สรุปสถิติ");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* High-level counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">อัตราซ่อมสำเร็จรวม</span>
            <p className="font-display font-extrabold text-3xl text-indigo-900">{completionRate}%</p>
            <p className="text-slate-500 text-xxs mt-1">จากทั้งหมด {totalRepairsCount} รายการ</p>
          </div>
          <div className="bg-indigo-600/10 text-indigo-700 p-3 rounded-lg">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-amber-50/40 border border-amber-200/60 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">แจ้งเตือนอะไหล่ใกล้หมด</span>
            <p className="font-display font-extrabold text-3xl text-amber-700">{lowStockParts.length} รายการ</p>
            <p className="text-slate-500 text-xxs mt-1">ต้องรีบดำเนินการจัดซื้อเพิ่ม</p>
          </div>
          <div className="bg-amber-500/10 text-amber-700 p-3 rounded-lg">
            <AlertCircle className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. BarChart: Repairs by Condo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-80 hover:shadow-md transition-all duration-200">
          <h3 className="font-display font-bold text-sm text-slate-950 mb-4 flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>สถิติตามอาคารคอนโดมิเนียม</span>
          </h3>
          <div className="flex-1 min-h-0">
            {condoTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={condoTrendData.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="จำนวนงาน" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 text-center py-20">ไม่มีข้อมูลซ่อมแซมเพื่อแสดงในขณะนี้</p>
            )}
          </div>
        </div>

        {/* 2. BarChart: Annual Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-80 lg:col-span-1 hover:shadow-md transition-all duration-200">
          <h3 className="font-display font-bold text-sm text-slate-950 mb-4 flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>แนวโน้มการแจ้งซ่อมรายเดือน</span>
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" style={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="งานซ่อม" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. PieChart: Job Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-80 hover:shadow-md transition-all duration-200">
          <h3 className="font-display font-bold text-sm text-slate-950 mb-4 flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-amber-500" />
            <span>สัดส่วนสถานะการซ่อมแซม</span>
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {pieData.length > 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="75%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend list */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xxs font-medium text-slate-600 mt-1">
                  {pieData.map((d, index) => (
                    <div key={d.name} className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center">ไม่มีข้อมูลสถานะซ่อมแซมในระบบ</p>
            )}
          </div>
        </div>

      </div>

      {/* AI Monthly Reporter Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 h-64 w-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-lg text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base md:text-lg">รายงานและคำแนะนำบำรุงรักษาเชิงป้องกันโดย AI</h3>
              <p className="text-slate-400 text-xxs font-sans">
                วิเคราะห์สถิติตามจริง เชื่อมคลังอะไหล่ เพื่อบำรุงรักษาเชิงป้องกันอย่างรวดเร็ว
              </p>
            </div>
          </div>

          {/* Month/Year selectors for summary */}
          <div className="flex items-center space-x-2 mt-4 md:mt-0 text-slate-900 text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-slate-700 px-2 py-1.5 rounded-lg text-slate-800"
            >
              {MONTHS_TH.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-700 px-2 py-1.5 rounded-lg text-slate-800"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
            <button
              onClick={handleGenerateAiReport}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg text-xs hover:from-blue-600 hover:to-indigo-600 cursor-pointer transition-all flex items-center space-x-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังคำนวณ...</span>
                </>
              ) : (
                <span>คำนวณสถิติ</span>
              )}
            </button>
          </div>
        </div>

        {/* Display generated AI summary */}
        <div className="relative z-10">
          {aiError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {aiReport ? (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 md:p-6 prose prose-invert prose-xs max-w-none text-slate-300 font-sans leading-relaxed shadow-inner font-normal">
                {/* Visual rendering of Markdown report in Thai */}
                <div className="whitespace-pre-wrap text-sm text-left">
                  {aiReport}
                </div>
              </div>

              {/* PDF Print Export controls */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>ส่งพิมพ์ PDF รายงานประจำเดือน</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl py-12 text-center">
              <FileText className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">
                {isGenerating
                  ? "Gemini AI กำลังศึกษาข้อมูลการแจ้งซ่อมและยอดอะไหล่ใน Google Sheets..."
                  : "กรุณากดปุ่มคำนวณสถิติเพื่อเรียกให้ AI ทำการสังเคราะห์รายงานประเมินรายเดือนฟรี"}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
