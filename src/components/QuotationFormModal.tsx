import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Percent,
  FileText,
  AlertCircle,
  Wrench,
  Package,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  Quotation,
  QuotationItem,
  RepairTicket,
  User as UserType,
} from '../types';
import { QuotationService } from '../services/quotationService';
import { TicketService } from '../services/ticketService';

interface QuotationFormModalProps {
  ticket?: RepairTicket;
  quotationToEdit?: Quotation | null;
  currentUser: UserType;
  onClose: () => void;
  onSave: (saved: Quotation) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const COMMON_UNITS = ['งาน', 'จุด', 'เครื่อง', 'ชิ้น', 'ชุด', 'เมตร', 'ชั่วโมง', 'วัน'];

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  ticket,
  quotationToEdit,
  currentUser,
  onClose,
  onSave,
  showToast,
}) => {
  // Dates
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Tickets list for selection
  const allTickets = TicketService.getTickets();
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    ticket?.id || quotationToEdit?.ticketId || (allTickets.length > 0 ? allTickets[0].id : '')
  );
  const activeTicket = ticket || allTickets.find((t) => t.id === selectedTicketId);

  // Form states
  const [issueDate, setIssueDate] = useState(quotationToEdit?.issueDate || todayStr);
  const [validUntil, setValidUntil] = useState(quotationToEdit?.validUntil || nextWeekStr);

  // Customer & Location (from ticket or edit quote)
  const [customerName, setCustomerName] = useState(
    quotationToEdit?.customerName || ticket?.requesterName || activeTicket?.requesterName || currentUser.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    quotationToEdit?.customerPhone || ticket?.requesterPhone || activeTicket?.requesterPhone || currentUser.phone || ''
  );
  const [propertyName, setPropertyName] = useState(
    quotationToEdit?.propertyName || ticket?.propertyName || activeTicket?.propertyName || 'คอนโด เดอะ ริเวอร์ไซด์ สวีทส์'
  );
  const [building, setBuilding] = useState(quotationToEdit?.building || ticket?.building || activeTicket?.building || '');
  const [floor, setFloor] = useState(quotationToEdit?.floor || ticket?.floor || activeTicket?.floor || '');
  const [unitNumber, setUnitNumber] = useState(quotationToEdit?.unitNumber || ticket?.unitNumber || activeTicket?.unitNumber || '');

  // Handle ticket selection change
  const handleTicketChange = (tId: string) => {
    setSelectedTicketId(tId);
    const chosen = allTickets.find((t) => t.id === tId);
    if (chosen) {
      setCustomerName(chosen.requesterName);
      setCustomerPhone(chosen.requesterPhone);
      setPropertyName(chosen.propertyName);
      setBuilding(chosen.building || '');
      setFloor(chosen.floor || '');
      setUnitNumber(chosen.unitNumber || '');
      // If items have default title, update it
      if (items.length === 1 && items[0].damageDescription === 'งานบริการตรวจเช็กและซ่อมแซม') {
        setItems([
          {
            ...items[0],
            damageDescription: chosen.title,
            repairMethod: 'ตรวจเช็ก วิเคราะห์ปัญหา และดำเนินงานซ่อมตามมาตรฐาน',
          },
        ]);
      }
    }
  };

  // Service Provider
  const [serviceProvider, setServiceProvider] = useState(
    quotationToEdit?.serviceProvider ||
      (currentUser.role === 'technician'
        ? `ช่าง${currentUser.name} (ฟิกซ์โฟลว์ เซอร์วิส)`
        : 'บริษัท ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส จำกัด')
  );
  const [serviceProviderPhone, setServiceProviderPhone] = useState(
    quotationToEdit?.serviceProviderPhone || '089-111-2222'
  );

  // Items list
  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (quotationToEdit && quotationToEdit.items.length > 0) {
      return quotationToEdit.items;
    }
    // Default initial row based on ticket description if available
    return [
      {
        id: `item-${Date.now()}-1`,
        itemNo: 1,
        damageDescription: ticket ? ticket.title : 'งานบริการตรวจเช็กและซ่อมแซม',
        repairMethod: ticket ? 'ตรวจเช็ก วิเคราะห์ปัญหา และดำเนินงานซ่อมตามมาตรฐาน' : 'ดำเนินการซ่อมบำรุง',
        quantity: 1,
        unit: 'งาน',
        unitPrice: 500,
        discountType: 'amount',
        discountValue: 0,
        total: 500,
      },
    ];
  });

  // VAT & Deposit
  const [vatEnabled, setVatEnabled] = useState<boolean>(quotationToEdit?.vatEnabled ?? true);
  const [vatRate, setVatRate] = useState<number>(quotationToEdit?.vatRate || 7);
  const [depositAmount, setDepositAmount] = useState<number>(quotationToEdit?.depositAmount || 0);

  // Terms
  const [notes, setNotes] = useState(
    quotationToEdit?.notes ||
      'ราคานี้รวมค่าอุปกรณ์พื้นฐานและการทดสอบการทำงานแล้ว หากพบจุดเสียหายเพิ่มเติมจะแจ้งก่อนเริ่มงาน'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    quotationToEdit?.paymentTerms || 'ชำระเมื่อตรวจรับและส่งมอบงานซ่อมเรียบร้อย'
  );
  const [warrantyTerms, setWarrantyTerms] = useState(
    quotationToEdit?.warrantyTerms || 'รับประกันงานซ่อมและชิ้นส่วนอะไหล่ 90 วัน'
  );

  // Validation errors
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time calculated totals
  const totals = QuotationService.calculateTotals(items, vatEnabled, vatRate, depositAmount);

  // Item change handler
  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Recalculate item total
      const { total } = QuotationService.calculateItemTotal(
        target.quantity,
        target.unitPrice,
        target.discountType,
        target.discountValue
      );
      target.total = total;

      updated[index] = target;
      return updated;
    });
  };

  // Add generic row
  const handleAddBlankItem = () => {
    const nextNo = items.length + 1;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${nextNo}`,
      itemNo: nextNo,
      damageDescription: '',
      repairMethod: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      discountType: 'amount',
      discountValue: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Quick preset: Labor (ค่าแรง)
  const handleAddLaborItem = () => {
    const nextNo = items.length + 1;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${nextNo}`,
      itemNo: nextNo,
      damageDescription: 'ค่าแรงช่างเทคนิคผู้เชี่ยวชาญ',
      repairMethod: 'ดำเนินการซ่อมแซม ปรับแต่ง และทดสอบระบบการทำงาน',
      quantity: 1,
      unit: 'งาน',
      unitPrice: 500,
      discountType: 'amount',
      discountValue: 0,
      total: 500,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Quick preset: Part (ค่าอะไหล่)
  const handleAddPartItem = () => {
    const nextNo = items.length + 1;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${nextNo}`,
      itemNo: nextNo,
      damageDescription: 'อะไหล่และอุปกรณ์เปลี่ยนใหม่ (มาตรฐาน มอก.)',
      repairMethod: 'เปลี่ยนแทนอุปกรณ์เดิมที่ชำรุดเสียหาย',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 450,
      discountType: 'amount',
      discountValue: 0,
      total: 450,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Quick preset: Other
  const handleAddOtherItem = () => {
    const nextNo = items.length + 1;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${nextNo}`,
      itemNo: nextNo,
      damageDescription: 'ค่าบริการตรวจเช็กและวิเคราะห์ปัญหานอกสถานที่',
      repairMethod: 'ตรวจเช็กระบบละเอียดด้วยเครื่องมือเฉพาะทาง',
      quantity: 1,
      unit: 'งาน',
      unitPrice: 300,
      discountType: 'amount',
      discountValue: 0,
      total: 300,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Delete row
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 รายการ', undefined, 'error');
      return;
    }
    setItems((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      // Re-number itemNo
      return updated.map((it, idx) => ({ ...it, itemNo: idx + 1 }));
    });
  };

  // Save form
  const handleSave = (targetStatus: 'draft' | 'pending_approval') => {
    setErrorMsg('');

    // Validation
    if (!customerName.trim()) {
      setErrorMsg('กรุณาระบุชื่อลูกค้า / ผู้แจ้งงาน');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('กรุณาเพิ่มรายการเสนอราคาอย่างน้อย 1 รายการ');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.damageDescription.trim()) {
        setErrorMsg(`รายการที่ ${i + 1}: กรุณากรอกรายการเสียหาย / รายการงาน`);
        return;
      }
      if (it.quantity <= 0) {
        setErrorMsg(`รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`);
        return;
      }
      if (it.unitPrice < 0) {
        setErrorMsg(`รายการที่ ${i + 1}: ราคาต่อหน่วยต้องไม่ติดลบ`);
        return;
      }
    }

    try {
      if (quotationToEdit) {
        // Edit existing
        const updated = QuotationService.updateQuotation(
          quotationToEdit.id,
          {
            issueDate,
            validUntil,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            propertyName: propertyName.trim(),
            building: building.trim() || undefined,
            floor: floor.trim() || undefined,
            unitNumber: unitNumber.trim() || undefined,
            serviceProvider: serviceProvider.trim(),
            serviceProviderPhone: serviceProviderPhone.trim(),
            status: targetStatus,
            items,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            vatEnabled,
            vatRate,
            vatAmount: totals.vatAmount,
            grandTotal: totals.grandTotal,
            depositAmount: totals.depositAmount,
            remainingAmount: totals.remainingAmount,
            notes: notes.trim() || undefined,
            paymentTerms: paymentTerms.trim() || undefined,
            warrantyTerms: warrantyTerms.trim() || undefined,
          },
          currentUser.name,
          `ปรับปรุงข้อมูลใบเสนอราคา (สถานะ: ${targetStatus === 'draft' ? 'ร่าง' : 'รออนุมัติ'})`
        );
        onSave(updated);
        showToast('บันทึกใบเสนอราคาสำเร็จ', undefined, 'success');
      } else {
        // Create new
        const created = QuotationService.createQuotation(
          {
            ticketId: activeTicket?.id || ticket?.id || 'manual',
            ticketJobNumber: activeTicket?.jobNumber || ticket?.jobNumber,
            ticketTitle: activeTicket?.title || ticket?.title,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            propertyName: propertyName.trim(),
            building: building.trim() || undefined,
            floor: floor.trim() || undefined,
            unitNumber: unitNumber.trim() || undefined,
            serviceProvider: serviceProvider.trim(),
            serviceProviderPhone: serviceProviderPhone.trim(),
            issueDate,
            validUntil,
            status: targetStatus,
            items,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            vatEnabled,
            vatRate,
            vatAmount: totals.vatAmount,
            grandTotal: totals.grandTotal,
            depositAmount: totals.depositAmount,
            remainingAmount: totals.remainingAmount,
            notes: notes.trim() || undefined,
            paymentTerms: paymentTerms.trim() || undefined,
            warrantyTerms: warrantyTerms.trim() || undefined,
          },
          currentUser.name
        );
        onSave(created);
        showToast(
          'สร้างใบเสนอราคาสำเร็จ',
          `เลขที่ ${created.quotationNumber} (${targetStatus === 'draft' ? 'ร่างใบเสนอราคา' : 'รออนุมัติ'})`,
          'success'
        );
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-display">
                {quotationToEdit
                  ? `แก้ไขใบเสนอราคา (${quotationToEdit.quotationNumber})`
                  : 'สร้างใบเสนอราคา / ประมาณการซ่อมใหม่'}
              </h2>
              <p className="text-xs text-slate-500">
                {ticket
                  ? `อ้างอิงใบแจ้งซ่อม: ${ticket.jobNumber} - ${ticket.title}`
                  : 'ระบุรายการเสียหาย วิธีแก้ไข และคำนวณราคารวมอัตโนมัติ'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Header Meta Info */}
          <div className="bg-slate-50/70 p-4 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <span>ข้อมูลทั่วไปของใบเสนอราคา</span>
              </h3>

              {/* Linked Ticket Selector */}
              <div className="w-full sm:w-auto flex items-center space-x-2 text-xs">
                <span className="font-bold text-slate-600 shrink-0">ผูกกับงานซ่อม:</span>
                {ticket ? (
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {ticket.jobNumber} - {ticket.title}
                  </span>
                ) : (
                  <select
                    value={selectedTicketId}
                    onChange={(e) => handleTicketChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 font-medium rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">-- ไม่ผูกกับงานซ่อม (ออกใบเสนอราคาทั่วไป) --</option>
                    {allTickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.jobNumber}] {t.title} ({t.requesterName})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">วันที่ออกใบเสนอราคา *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เสนอราคามีผลถึงวันที่ *</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อลูกค้า / ผู้แจ้งงาน *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น นายกิตติศักดิ์ พัฒนกิจ"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เบอร์ติดต่อลูกค้า *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081-234-5678"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Location & Provider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-200/60">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อโครงการ / สถานที่</label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">อาคาร / ชั้น / เลขห้อง</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="อาคาร"
                    className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center"
                  />
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="ชั้น"
                    className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-center"
                  />
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="ห้อง"
                    className="px-2 py-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ผู้ให้บริการ / ช่างผู้เสนอราคา</label>
                <input
                  type="text"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เบอร์ติดต่อช่าง / บริษัท</label>
                <input
                  type="text"
                  value={serviceProviderPhone}
                  onChange={(e) => setServiceProviderPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ตารางรายการเสนอราคาซ่อม ({items.length} รายการ)
                </h3>
                <p className="text-xs text-slate-500">
                  ระบุรายละเอียดความเสียหาย วิธีแก้ไข จำนวน และราคาต่อหน่วย
                </p>
              </div>

              {/* Quick Action Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddBlankItem}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการ</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddLaborItem}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>+ ค่าแรง</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddPartItem}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>+ ค่าอะไหล่</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddOtherItem}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>+ ค่าใช้จ่ายอื่น</span>
                </button>
              </div>
            </div>

            {/* Desktop / Tablet Table View */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5 text-center w-12">ลำดับ</th>
                    <th className="p-2.5 min-w-[200px]">รายการเสียหาย / งานที่ทำ</th>
                    <th className="p-2.5 min-w-[180px]">วิธีแก้ไข</th>
                    <th className="p-2.5 w-20 text-center">จำนวน</th>
                    <th className="p-2.5 w-24 text-center">หน่วย</th>
                    <th className="p-2.5 w-28 text-right">ราคาต่อหน่วย</th>
                    <th className="p-2.5 w-28 text-center">ส่วนลด</th>
                    <th className="p-2.5 w-32 text-right">ราคารวม (บาท)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-2 text-center font-bold text-slate-400">
                        {item.itemNo}
                      </td>

                      {/* Damage Description */}
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={item.damageDescription}
                          onChange={(e) =>
                            handleItemChange(index, 'damageDescription', e.target.value)
                          }
                          placeholder="เช่น แอร์ไม่เย็นและมีน้ำหยด..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs resize-none"
                        />
                      </td>

                      {/* Repair Method */}
                      <td className="p-2">
                        <textarea
                          rows={2}
                          value={item.repairMethod}
                          onChange={(e) =>
                            handleItemChange(index, 'repairMethod', e.target.value)
                          }
                          placeholder="เช่น ล้างทำความสะอาด ตรวจเช็กน้ำยา..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs resize-none"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold"
                        />
                      </td>

                      {/* Unit */}
                      <td className="p-2">
                        <input
                          type="text"
                          list="units-list"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-medium"
                        />
                        <datalist id="units-list">
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </td>

                      {/* Unit Price */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-800"
                        />
                      </td>

                      {/* Discount */}
                      <td className="p-2">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.discountValue}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'discountValue',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-right text-xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleItemChange(
                                index,
                                'discountType',
                                item.discountType === 'amount' ? 'percent' : 'amount'
                              )
                            }
                            className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-700 transition"
                            title="สลับเป็น % หรือ ฿"
                          >
                            {item.discountType === 'percent' ? '%' : '฿'}
                          </button>
                        </div>
                      </td>

                      {/* Item Total */}
                      <td className="p-2 text-right font-black text-slate-900">
                        {QuotationService.formatCurrency(item.total)}
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Summary Box & Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="bg-slate-50/70 p-4 rounded-3xl border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">
                เงื่อนไขและการรับประกัน
              </h3>

              <div>
                <label className="font-bold text-slate-700 block mb-1">หมายเหตุสำหรับลูกค้า</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เงื่อนไขการชำระเงิน</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ระยะเวลารับประกันงานซ่อม</label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-emerald-800 font-bold"
                />
              </div>
            </div>

            {/* Price Summary Calculation Card */}
            <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 p-5 rounded-3xl border border-blue-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>สรุปยอดเงินและภาษี (Real-time)</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">คำนวณอัตโนมัติ</span>
              </h3>

              <div className="space-y-2 text-xs border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between text-slate-600">
                  <span>รวมค่าสินค้า/ค่าแรงก่อนส่วนลด:</span>
                  <span className="font-bold text-slate-900">
                    {QuotationService.formatCurrency(totals.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>ส่วนลดรวม:</span>
                  <span className="font-bold text-rose-600">
                    - {QuotationService.formatCurrency(totals.totalDiscount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                  <span>ยอดหลังหักส่วนลด:</span>
                  <span className="font-bold text-slate-900">
                    {QuotationService.formatCurrency(totals.netAfterDiscount)}
                  </span>
                </div>

                {/* VAT Toggle Switch */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => setVatEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium">
                      คิดภาษีมูลค่าเพิ่ม VAT 7%
                    </span>
                  </label>
                  <span className="font-bold text-slate-900">
                    {vatEnabled ? QuotationService.formatCurrency(totals.vatAmount) : '฿0.00'}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-1 text-slate-900">
                <div>
                  <span className="text-sm font-black text-slate-900 font-display">
                    ยอดสุทธิ (Grand Total)
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {vatEnabled ? 'รวมภาษีมูลค่าเพิ่มแล้ว' : 'ไม่รวมภาษีมูลค่าเพิ่ม'}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-blue-700 font-display">
                  {QuotationService.formatCurrency(totals.grandTotal)}
                </span>
              </div>

              {/* Deposit and Remaining */}
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    เงินมัดจำ (ถ้ามี):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totals.grandTotal}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-right font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ยอดคงเหลือที่ต้องชำระ:
                  </label>
                  <div className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-right font-black text-emerald-700">
                    {QuotationService.formatCurrency(totals.remainingAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer shadow-xs"
            >
              บันทึกฉบับร่าง (Save Draft)
            </button>
            <button
              type="button"
              onClick={() => handleSave('pending_approval')}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              ส่งใบเสนอราคา (รออนุมัติ)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
