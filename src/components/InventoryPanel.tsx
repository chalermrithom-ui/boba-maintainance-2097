import React, { useState } from "react";
import { Part, UserRole } from "../types";
import {
  Package,
  AlertTriangle,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  QrCode,
  Search,
  Printer
} from "lucide-react";
import { PartQrScannerModal } from "./PartQrScannerModal";
import { PartQrLabelModal } from "./PartQrLabelModal";

interface InventoryPanelProps {
  inventory: Part[];
  userRole: UserRole;
  onAddPart: (partData: Omit<Part, "id">) => Promise<void>;
  onUpdateQty: (partId: string, additionalQty: number) => Promise<void>;
  onDeletePart?: (partId: string) => Promise<void>;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  userRole,
  onAddPart,
  onUpdateQty,
  onDeletePart,
}) => {
  const [name, setName] = useState<string>("");
  const [qty, setQty] = useState<number>(10);
  const [unit, setUnit] = useState<string>("ชิ้น");
  const [price, setPrice] = useState<number>(100);
  const [minQty, setMinQty] = useState<number>(3);

  // Stock update adjustment state
  const [adjustPartId, setAdjustPartId] = useState<string>("");
  const [adjustQty, setAdjustQty] = useState<number>(1);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedPartForQrLabel, setSelectedPartForQrLabel] = useState<Part | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleAddNewPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่ออะไหล่");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPart({
        name,
        qty,
        unit,
        price,
        minQty,
      });
      setName("");
      setSuccess("เพิ่มอะไหล่ใหม่เข้าระบบคลังเรียบร้อย!");
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเพิ่มอะไหล่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustQtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!adjustPartId) return;

    setIsSubmitting(true);
    try {
      await onUpdateQty(adjustPartId, adjustQty);
      setSuccess("ปรับปรุงจำนวนสินค้าในสต็อกเรียบร้อย!");
      setAdjustQty(1);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการปรับยอดอะไหล่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = userRole === UserRole.ADMIN;

  const filteredInventory = inventory.filter((part) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      part.id.toLowerCase().includes(q) ||
      part.name.toLowerCase().includes(q) ||
      part.unit.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* 1. Left Section: Spare Parts List & Auditing */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header & Quick QR Scanner Trigger */}
          <div className="bg-[#0F172A] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-display font-semibold text-base">รายการคลังอะไหล่และอุปกรณ์</h3>
                <p className="text-[11px] text-slate-400">
                  จัดการ ปรับยอด และสแกน QR Code ตรวจเช็คสต็อก
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Prominent QR Code Scanner Button */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer ring-2 ring-indigo-400/30 hover:scale-105 active:scale-95"
                title="เปิดกล้องส่องสแกน QR Code บนป้ายลาเบลของอะไหล่เพื่อปรับยอดหรือดูรายละเอียดด่วน"
              >
                <QrCode className="h-4 w-4 text-indigo-200 animate-pulse" />
                <span>สแกน QR Code อะไหล่</span>
              </button>

              <span className="text-xxs font-semibold bg-slate-800 text-slate-300 px-2.5 py-2 rounded-xl flex-shrink-0">
                ทั้งหมด {inventory.length} รายการ
              </span>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหารหัสอะไหล่ หรือชื่อชิ้นส่วน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                ล้างคำค้น
              </button>
            )}
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">รหัส / QR</th>
                  <th className="px-4 py-3">ชื่ออะไหล่และอุปกรณ์</th>
                  <th className="px-4 py-3 text-center">คงเหลือ</th>
                  <th className="px-4 py-3 text-right">ราคา/หน่วย</th>
                  <th className="px-4 py-3 text-center">สถานะสต็อก</th>
                  <th className="px-4 py-3 text-center">ป้าย QR</th>
                  {isAdmin && <th className="px-4 py-3 text-center">จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((part) => {
                    const isLow = part.qty <= part.minQty;
                    return (
                      <tr
                        key={part.id}
                        className={`border-b border-slate-50 hover:bg-slate-50/50 text-slate-700 ${
                          isLow ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {part.id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{part.name}</td>
                        <td className="px-4 py-3 text-center font-bold">
                          {part.qty} <span className="text-xs font-normal text-slate-500">{part.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 font-medium">
                          ฿{part.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xxs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-3 w-3 animate-bounce" />
                              <span>ต่ำกว่าเกณฑ์ ({part.minQty})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xxs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ปกติ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPartForQrLabel(part)}
                            className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xxs font-bold cursor-pointer transition-colors border border-slate-200 inline-flex items-center space-x-1"
                            title="แสดง/พิมพ์ป้าย QR Code สำหรับติดอะไหล่ชิ้นนี้"
                          >
                            <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                            <span>ดู QR</span>
                          </button>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onDeletePart && onDeletePart(part.id)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xxs font-bold cursor-pointer transition-colors border border-rose-200"
                              title="ลบอะไหล่ชิ้นนี้"
                            >
                              ลบ
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-400 text-xs">
                      ไม่พบข้อมูลอะไหล่ที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Right Section: Add or Adjust stock (Admin panel) */}
      <div className="space-y-6">
        {isAdmin ? (
          <>
            {/* New Part Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-1.5 mb-4 border-b border-slate-200 pb-2">
                <Plus className="h-4 w-4 text-blue-500" />
                <span>ลงทะเบียนอะไหล่ใหม่เข้าระบบ</span>
              </h3>

              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-lg text-xs flex items-center space-x-1 mb-4">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-lg text-xs flex items-center space-x-1 mb-4">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddNewPart} className="space-y-4">
                <div>
                  <label className="block text-xxs font-medium text-slate-500 mb-1">ชื่อรายการอะไหล่ *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ข้อต่อท่อตรง PVC 1 นิ้ว"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-medium text-slate-500 mb-1">จำนวนเริ่มต้น *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-medium text-slate-500 mb-1">หน่วยเรียก *</label>
                    <input
                      type="text"
                      required
                      placeholder="ชิ้น, ตัว, เมตร, ม้วน"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-medium text-slate-500 mb-1">ราคาต่อหน่วย (บาท) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-medium text-slate-500 mb-1">จุดเตือนสต็อกต่ำกว่า *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={minQty}
                      onChange={(e) => setMinQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>ยืนยันบันทึกอะไหล่</span>
                  )}
                </button>
              </form>
            </div>

            {/* Adjust Stock Qty Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-display font-semibold text-sm text-slate-900 flex items-center space-x-1.5 mb-4 border-b border-slate-200 pb-2">
                <Package className="h-4 w-4 text-emerald-500" />
                <span>เติมยอดอะไหล่เข้าคลังสินค้า</span>
              </h3>

              <form onSubmit={handleAdjustQtySubmit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-medium text-slate-500 mb-1">เลือกอะไหล่ที่ต้องการปรับยอด</label>
                  <select
                    value={adjustPartId}
                    onChange={(e) => setAdjustPartId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- กรุณาเลือกชิ้นส่วนอะไหล่ --</option>
                    {inventory.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ในคลังปัจจุบัน: {p.qty} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-medium text-slate-500 mb-1">จำนวนที่เติมเพิ่มยอด (+)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="ใส่จำนวน เช่น 5, 10"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !adjustPartId}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>บันทึกการปรับยอดสินค้า</span>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center space-y-3">
            <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto" />
            <div>
              <span className="block font-semibold text-sm text-slate-700">สิทธิ์พนักงานจำกัด</span>
              <p className="text-xxs text-slate-500 mt-1 leading-relaxed">
                สำหรับบทบาท "ช่างซ่อม" สิทธิ์การเพิ่มประเภทอะไหล่ใหม่จะถูกจำกัดเฉพาะ "แอดมิน" แต่ช่างสามารถใช้ปุ่ม <strong>"สแกน QR Code อะไหล่"</strong> เพื่อเบิกอะไหล่ใช้ในงานซ่อมแซมได้ทันที
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all"
            >
              <QrCode className="h-4 w-4" />
              <span>สแกน QR เบิกใช้งานสต็อก</span>
            </button>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <PartQrScannerModal
          inventory={inventory}
          onClose={() => setIsScannerOpen(false)}
          onUpdateQty={onUpdateQty}
        />
      )}

      {/* Printable QR Label Modal */}
      {selectedPartForQrLabel && (
        <PartQrLabelModal
          part={selectedPartForQrLabel}
          onClose={() => setSelectedPartForQrLabel(null)}
        />
      )}

    </div>
  );
};
