import React, { useState, useMemo } from "react";
import { RepairJob, Part, JobStatus, JobPriority, UserRole } from "../types";
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Package,
  Wrench,
  Clock,
  Building2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Bell,
  Smartphone,
  ExternalLink
} from "lucide-react";

interface SmartRecommendationsPanelProps {
  repairs: RepairJob[];
  inventory: Part[];
  userRole: UserRole;
  onNavigateToTab: (tabName: string) => void;
  onFilterStatus?: (status: string) => void;
  onRequestNotificationPermission?: () => void;
  notificationPermission?: string;
}

export interface CustomRecommendation {
  id: string;
  title: string;
  category: "preventive" | "inventory" | "dispatch" | "cost" | "general";
  description: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  createdBy: string;
}

export const SmartRecommendationsPanel: React.FC<SmartRecommendationsPanelProps> = ({
  repairs,
  inventory,
  userRole,
  onNavigateToTab,
  onFilterStatus,
  onRequestNotificationPermission,
  notificationPermission
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [customRecs, setCustomRecs] = useState<CustomRecommendation[]>(() => {
    try {
      const saved = localStorage.getItem("boba_custom_recommendations");
      return saved ? JSON.parse(saved) : [
        {
          id: "rec-init-1",
          title: "ตรวจเช็คระบบวาล์วน้ำหลักประจำไตรมาส",
          category: "preventive",
          description: "สืบเนื่องจากพบปัญหาท่อน้ำซึมบ่อยในอาคาร A แนะนำให้ทีมช่างตรวจเช็คแรงดันน้ำและปะเก็นยางทุก 3 เดือน",
          priority: "high",
          createdAt: new Date().toLocaleDateString("th-TH"),
          createdBy: "แอดมินระบบ"
        }
      ];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCategory, setNewCategory] = useState<"preventive" | "inventory" | "dispatch" | "cost" | "general">("preventive");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("high");

  // Save custom recs
  const handleAddCustomRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const item: CustomRecommendation = {
      id: `rec-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim(),
      priority: newPriority,
      createdAt: new Date().toLocaleDateString("th-TH"),
      createdBy: userRole === UserRole.ADMIN ? "แอดมิน" : "ช่างซ่อม"
    };

    const updated = [item, ...customRecs];
    setCustomRecs(updated);
    try {
      localStorage.setItem("boba_custom_recommendations", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setNewTitle("");
    setNewDesc("");
    setShowAddForm(false);
  };

  const handleDeleteCustomRec = (id: string) => {
    const updated = customRecs.filter((r) => r.id !== id);
    setCustomRecs(updated);
    try {
      localStorage.setItem("boba_custom_recommendations", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Automated System Analysis Insights
  const dynamicRecommendations = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: "preventive" | "inventory" | "dispatch" | "cost" | "general";
      description: string;
      priority: "high" | "medium" | "low";
      actionLabel?: string;
      actionType?: "navigate_inventory" | "filter_pending" | "notif_permission" | "calendar";
      metric?: string;
      icon: React.ReactNode;
      badgeColor: string;
    }> = [];

    // 1. Pending & Overdue Analysis
    const pendingJobs = repairs.filter((r) => r.status === JobStatus.PENDING);
    const criticalJobs = repairs.filter((r) => r.priority === JobPriority.CRITICAL && r.status !== JobStatus.COMPLETED);

    if (criticalJobs.length > 0) {
      list.push({
        id: "sys-critical",
        title: `มีงานระดับวิกฤต (Critical) ${criticalJobs.length} รายการที่ยังไม่เสร็จสิ้น`,
        category: "dispatch",
        description: `พบงานซ่อมด่วนขั้นสูงสุด เช่น ห้อง ${criticalJobs.map((c) => c.roomNo).join(", ")} ควรเร่งจัดส่งทีมช่างแก้ไขทันทีเพื่อป้องกันความเสียหายลุกลาม`,
        priority: "high",
        actionLabel: "ไปที่รายการงานรอดำเนินการ",
        actionType: "filter_pending",
        metric: `${criticalJobs.length} งานด่วน`,
        icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300"
      });
    }

    if (pendingJobs.length >= 3) {
      list.push({
        id: "sys-pending-backlog",
        title: `พบงานซ่อมรอดำเนินการสะสม ${pendingJobs.length} รายการ`,
        category: "dispatch",
        description: "แนะนำให้แอดมินมอบหมายช่างผู้รับผิดชอบหรือจัดลำดับคิวนัดหมายลงในปฏิทิน เพื่อให้ลูกบ้านได้รับการดูแลอย่างรวดเร็ว",
        priority: "medium",
        actionLabel: "ดูงานรอดำเนินการทั้งหมด",
        actionType: "filter_pending",
        metric: `${pendingJobs.length} คิวยังไม่เริ่ม`,
        icon: <Clock className="w-5 h-5 text-amber-600" />,
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300"
      });
    }

    // 2. Inventory Low Stock Analysis
    const lowStockItems = inventory.filter((item) => item.qty <= item.minQty);
    if (lowStockItems.length > 0) {
      list.push({
        id: "sys-low-stock",
        title: `อะไหล่ใกล้หมดคลัง ${lowStockItems.length} รายการ - ควรจัดซื้อเพิ่ม`,
        category: "inventory",
        description: `รายการอะไหล่ตกลงมาต่ำกว่าเกณฑ์ขั้นต่ำ: ${lowStockItems.map((i) => `${i.name} (เหลือ ${i.qty} ${i.unit})`).join(", ")} แนะนำเปิดใบสั่งซื้อล่วงหน้า`,
        priority: "high",
        actionLabel: "จัดการคลังอะไหล่",
        actionType: "navigate_inventory",
        metric: `${lowStockItems.length} ชนิดขาดแคลน`,
        icon: <Package className="w-5 h-5 text-orange-600" />,
        badgeColor: "bg-orange-100 text-orange-800 border-orange-300"
      });
    }

    // 3. High Repair Frequency Location Analysis
    const condoCounts: Record<string, number> = {};
    repairs.forEach((r) => {
      const shortCondo = r.condoName.split(" (")[0];
      condoCounts[shortCondo] = (condoCounts[shortCondo] || 0) + 1;
    });

    const topCondo = Object.entries(condoCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCondo && topCondo[1] >= 2) {
      list.push({
        id: "sys-frequent-condo",
        title: `อาคาร "${topCondo[0]}" มีแจ้งซ่อมบ่อยที่สุด (${topCondo[1]} รายการ)`,
        category: "preventive",
        description: `ข้อแนะนำเชิงป้องกัน: จัดส่งช่างเข้าตรวจสอบระบบสาธารณูปโภคส่วนกลางของอาคาร ${topCondo[0]} เชิงรุก เพื่อลดอัตราการแจ้งซ่อมซ้ำซ้อน`,
        priority: "medium",
        metric: `${topCondo[1]} แจ้งซ่อม`,
        icon: <Building2 className="w-5 h-5 text-blue-600" />,
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300"
      });
    }

    // 4. Notification Permission Recommendation
    if (notificationPermission !== "granted") {
      list.push({
        id: "sys-notif-perm",
        title: "เปิดรับแจ้งเตือนแบบ Push Notification บนโทรศัพท์",
        category: "general",
        description: "เปิดรับแจ้งเตือนผ่านหน้าจอโทรศัพท์และเบราว์เซอร์ เพื่อไม่ให้พลาดเมื่อมีงานซ่อมใหม่หรือมีการอัปเดตสถานะเบิกจ่ายเงินสด",
        priority: "low",
        actionLabel: "กดเปิดอนุญาตการแจ้งเตือน",
        actionType: "notif_permission",
        metric: "แนะนำอย่างยิ่ง",
        icon: <Bell className="w-5 h-5 text-indigo-600" />,
        badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300"
      });
    }

    // 5. Cost Savings Recommendation
    const totalSpent = repairs.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    if (totalSpent > 0) {
      const avgCost = Math.round(totalSpent / (repairs.length || 1));
      list.push({
        id: "sys-cost-efficiency",
        title: `งบประมาณรวมงานซ่อมแซมปัจจุบัน: ฿${totalSpent.toLocaleString()}`,
        category: "cost",
        description: `ค่าใช้จ่ายเฉลี่ยต่อรายการอยู่ที่ ฿${avgCost.toLocaleString()} แนะนำให้เปรียบเทียบราคาอะไหล่ซัพพลายเออร์และบันทึกใบเสร็จหลักฐานทุกครั้ง`,
        priority: "low",
        metric: `เฉลี่ย ฿${avgCost}/งาน`,
        icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
      });
    }

    return list;
  }, [repairs, inventory, notificationPermission]);

  // Combine System + Custom Recs
  const allRecommendations = useMemo(() => {
    const customMapped = customRecs.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      description: c.description,
      priority: c.priority,
      metric: `กำหนดโดย ${c.createdBy}`,
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      isCustom: true,
      createdAt: c.createdAt
    }));

    return [...dynamicRecommendations, ...customMapped];
  }, [dynamicRecommendations, customRecs]);

  // Filtered by category
  const filteredList = useMemo(() => {
    if (activeCategory === "ALL") return allRecommendations;
    return allRecommendations.filter((item) => item.category === activeCategory);
  }, [allRecommendations, activeCategory]);

  const handleAction = (type?: string) => {
    if (type === "navigate_inventory") {
      onNavigateToTab("inventory");
    } else if (type === "filter_pending") {
      onNavigateToTab("dashboard");
      if (onFilterStatus) onFilterStatus(JobStatus.PENDING);
    } else if (type === "notif_permission" && onRequestNotificationPermission) {
      onRequestNotificationPermission();
    }
  };

  const copyRecommendationsSummary = () => {
    const textLines = [
      `📋 รายงานคำแนะนำอัจฉริยะ & ข้อเสนอแนะการทำงาน (B.O.B.A. Maintenance System)`,
      `วันที่ส่งรายงาน: ${new Date().toLocaleDateString("th-TH")} ${new Date().toLocaleTimeString("th-TH")}`,
      `--------------------------------------------------`,
      ...allRecommendations.map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}\n   รายละเอียด: ${r.description}`)
    ].join("\n\n");

    navigator.clipboard.writeText(textLines);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Smart Recommendation Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">
            ระบบคำแนะนำอัจฉริยะ & ข้อแนะนำการซ่อมบำรุงเชิงป้องกัน
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            ระบบวิเคราะห์ข้อมูลงานซ่อมแซม คลังอะไหล่ และสถิติเชิงลึกอัตโนมัติ พร้อมประมวลผลเป็นคำแนะนำสำหรับแอดมินและช่างเพื่อประสิทธิภาพสูงสุด
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copyRecommendationsSummary}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            <span>{copiedReport ? "คัดลอกข้อแนะนำแล้ว!" : "คัดลอกรายงานคำแนะนำ"}</span>
          </button>

          {userRole === UserRole.ADMIN && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-blue-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคำแนะนำแบบกำหนดเอง</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Form for Custom Recommendation */}
      {showAddForm && (
        <form onSubmit={handleAddCustomRec} className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2 font-display">
              <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
              <span>บันทึกข้อแนะนำใหม่สำหรับทีมช่างและแอดมิน</span>
            </h3>
            <span className="text-xxs text-slate-400">บันทึกลงในระบบเพื่อแชร์กับทีมงาน</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อคำแนะนำ</label>
              <input
                type="text"
                required
                placeholder="เช่น ตรวจสอบความตึงสายพานพัดลมระบายอากาศทุกสัปดาห์"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
              <select
                value={newCategory}
                onChange={(e: any) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="preventive">ซ่อมบำรุงเชิงป้องกัน (Preventive)</option>
                <option value="inventory">คลังอะไหล่ (Inventory)</option>
                <option value="dispatch">การจัดสรรงานซ่อม (Dispatch)</option>
                <option value="cost">การบริหารงบประมาณ (Cost)</option>
                <option value="general">ทั่วไป & ระบบ (General)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดคำแนะนำ</label>
              <textarea
                required
                rows={2}
                placeholder="อธิบายรายละเอียดขั้นตอนปฏิบัติ หรือข้อระวังเพิ่มเติม..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ระดับความสำคัญ</label>
              <select
                value={newPriority}
                onChange={(e: any) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-bold"
              >
                <option value="high">🔴 เร่งด่วน (High)</option>
                <option value="medium">🟡 ปานกลาง (Medium)</option>
                <option value="low">🟢 ทั่วไป (Low)</option>
              </select>

              <div className="mt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs"
                >
                  บันทึกคำแนะนำ
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>คำแนะนำทั้งหมด ({allRecommendations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("preventive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeCategory === "preventive"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>เชิงป้องกัน (Preventive)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("inventory")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeCategory === "inventory"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>คลังอะไหล่ (Inventory)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("dispatch")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeCategory === "dispatch"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>จัดสรรงานซ่อม (Dispatch)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("cost")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeCategory === "cost"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>งบประมาณ (Cost)</span>
          </button>
        </div>

        <div className="text-xxs text-slate-400 font-bold px-2">
          พบ {filteredList.length} รายการ
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-800">ไม่มีข้อเสนอแนะด่วนในหมวดหมู่นี้</h3>
            <p className="text-xs text-slate-500">ระบบทำงานราบรื่นและมีประสิทธิภาพเต็ม 100%</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.priority === "high" ? "🚨 ด่วนสูงสุด" : item.priority === "medium" ? "⚡ แนะนำทำเร็วๆ นี้" : "💡 คำแนะนำทั่วไป"}
                      </span>
                      {item.metric && (
                        <span className="text-xxs font-bold text-slate-500 ml-2">
                          • {item.metric}
                        </span>
                      )}
                    </div>
                  </div>

                  {"isCustom" in item && item.isCustom && userRole === UserRole.ADMIN && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomRec(item.id)}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      title="ลบข้อแนะนำนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-snug font-display">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.description}
                </p>
              </div>

              {/* Card Footer & Quick Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-xxs text-slate-400 font-medium">
                  {"createdAt" in item && item.createdAt ? `สร้างเมื่อ ${item.createdAt}` : "ประมวลผลอัตโนมัติ Real-time"}
                </span>

                {"actionLabel" in item && item.actionLabel ? (
                  <button
                    type="button"
                    onClick={() => handleAction(item.actionType)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-xxs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>พร้อมปฏิบัติตาม</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guide Section for Workflow Efficiency */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center space-x-2 font-display">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>เคล็ดลับการใช้ระบบ B.O.B.A. ให้เกิดประโยชน์สูงสุด</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xxs text-slate-600">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">1. ใช้งานกระดาน Kanban Board</span>
            <p>ลากวางย้ายสถานะงานซ่อม Real-time เพื่อให้ทีมช่างเห็นภาพรวมคิวนัดหมายที่ชัดเจน</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">2. พิมพ์ PDF และแนบสลิป</span>
            <p>สร้างความโปร่งใสโดยพิมพ์ใบสั่งซ่อมและแนบสลิปการโอนเงินทุกครั้งที่มีการเบิกจ่าย</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">3. เชื่อมต่อ Google Drive</span>
            <p>ระบบจะซิงค์ข้อมูลลง Google Sheets และไฟล์ JSON อัตโนมัติป้องกันข้อมูลสูญหาย 100%</p>
          </div>
        </div>
      </div>

    </div>
  );
};
