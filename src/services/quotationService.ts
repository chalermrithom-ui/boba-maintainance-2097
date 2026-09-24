import {
  Quotation,
  QuotationItem,
  QuotationStatus,
  QuotationVersionLog,
} from '../types';

const STORAGE_KEY = 'fixflow_quotations_data';

export const DEFAULT_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1',
    quotationNumber: 'QT-2026-0001',
    ticketId: 'ticket-1',
    ticketJobNumber: 'JOB-2026-0001',
    ticketTitle: 'แอร์ห้องนั่งเล่นไม่เย็น มีแต่ลม และมีเสียงดังผิดปกติ',
    customerName: 'นายกิตติศักดิ์ พัฒนกิจ',
    customerPhone: '081-987-6543',
    propertyName: 'คอนโด เดอะ ริเวอร์ไซด์ สวีทส์',
    building: 'อาคาร A',
    floor: 'ชั้น 8',
    unitNumber: '812',
    serviceProvider: 'บริษัท ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส จำกัด (ช่างธนา เก่งงานช่าง)',
    serviceProviderPhone: '089-111-2222',
    issueDate: '2026-09-20',
    validUntil: '2026-09-27',
    status: 'pending_approval',
    items: [
      {
        id: 'item-1',
        itemNo: 1,
        damageDescription: 'เครื่องปรับอากาศไม่เย็นและมีน้ำหยด',
        repairMethod: 'ล้างทำความสะอาด ตรวจเช็กน้ำยา และแก้ไขท่อน้ำทิ้ง',
        quantity: 1,
        unit: 'เครื่อง',
        unitPrice: 1500,
        discountType: 'amount',
        discountValue: 0,
        total: 1500,
      },
      {
        id: 'item-2',
        itemNo: 2,
        damageDescription: 'เติมน้ำยาแอร์ R32',
        repairMethod: 'เติมน้ำยาแอร์ตามปริมาณที่ตรวจวัด',
        quantity: 1,
        unit: 'งาน',
        unitPrice: 800,
        discountType: 'amount',
        discountValue: 0,
        total: 800,
      },
    ],
    subtotal: 2300,
    totalDiscount: 0,
    vatEnabled: true,
    vatRate: 7,
    vatAmount: 161,
    grandTotal: 2461,
    depositAmount: 0,
    remainingAmount: 2461,
    notes: 'ราคารวมอุปกรณ์ทำความสะอาดและน้ำยาแอร์แล้ว หากพบปัญหาอุปกรณ์มอเตอร์พัดลมเสียหายจะแจ้งให้ทราบก่อนดำเนินการ',
    paymentTerms: 'ชำระเมื่อส่งมอบงานซ่อมและทดสอบระบบความเย็นเรียบร้อย',
    warrantyTerms: 'รับประกันงานล้างและการทำงานของระบบแอร์ 90 วัน',
    revisionVersion: 1,
    versionHistory: [
      {
        id: 'ver-1',
        timestamp: '2026-09-20 14:00',
        actor: 'ช่างธนา (Technician)',
        action: 'สร้างใบเสนอราคา',
        details: 'ออกใบเสนอราคาประมาณการซ่อมแอร์ QT-2026-0001 (Rev 1)',
      },
      {
        id: 'ver-2',
        timestamp: '2026-09-20 14:05',
        actor: 'ผู้จัดการนิติบุคคล (Admin)',
        action: 'ส่งขออนุมัติจากลูกค้า',
        details: 'เปลี่ยนสถานะเป็น รออนุมัติ',
      },
    ],
    createdAt: '2026-09-20 14:00',
    updatedAt: '2026-09-20 14:05',
  },
  {
    id: 'quote-2',
    quotationNumber: 'QT-2026-0002',
    ticketId: 'ticket-2',
    ticketJobNumber: 'JOB-2026-0002',
    ticketTitle: 'ท่อน้ำใต้อ่างล้างจานรั่วซึม น้ำเจิ่งนองตู้ครัว',
    customerName: 'คุณศิริพร วงศ์สว่าง',
    customerPhone: '089-765-4321',
    propertyName: 'คอนโด เดอะ ริเวอร์ไซด์ สวีทส์',
    building: 'อาคาร B',
    floor: 'ชั้น 14',
    unitNumber: '1405',
    serviceProvider: 'บริษัท ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส จำกัด (ช่างสมศักดิ์ วงศ์ดี)',
    serviceProviderPhone: '089-333-4444',
    issueDate: '2026-09-20',
    validUntil: '2026-09-25',
    status: 'approved',
    items: [
      {
        id: 'item-201',
        itemNo: 1,
        damageDescription: 'ท่อน้ำทิ้งใต้อ่างล้างจานผุกร่อนและข้อต่อหลุด',
        repairMethod: 'เปลี่ยนชุดท่อน้ำทิ้งแบบดักกลิ่นและข้อต่อเกลียวทองเหลือง',
        quantity: 1,
        unit: 'ชุด',
        unitPrice: 650,
        discountType: 'amount',
        discountValue: 0,
        total: 650,
      },
      {
        id: 'item-202',
        itemNo: 2,
        damageDescription: 'ค่าแรงช่างประปาฉุกเฉินและซีนซิลิโคนกันซึม',
        repairMethod: 'รื้อท่อเดิม ติดตั้งชุดใหม่ และทดสอบการระบายน้ำแรงดันสูง',
        quantity: 1,
        unit: 'งาน',
        unitPrice: 400,
        discountType: 'amount',
        discountValue: 0,
        total: 400,
      },
    ],
    subtotal: 1050,
    totalDiscount: 50,
    vatEnabled: false,
    vatRate: 7,
    vatAmount: 0,
    grandTotal: 1000,
    depositAmount: 0,
    remainingAmount: 1000,
    notes: 'ส่วนลดพิเศษสำหรับลูกบ้านคอนโด 50 บาท',
    paymentTerms: 'ชำระหลังเสร็จสิ้นงาน',
    warrantyTerms: 'รับประกันรอยต่อและการรั่วซึม 60 วัน',
    approvedBy: 'คุณศิริพร วงศ์สว่าง (ผู้แจ้งงาน)',
    approvedAt: '2026-09-20 15:30',
    approvalNote: 'ยินยอมตามราคาและเงื่อนไข ช่างสามารถเข้าซ่อมได้ตามเวลานัดหมาย',
    revisionVersion: 1,
    versionHistory: [
      {
        id: 'ver-201',
        timestamp: '2026-09-20 15:10',
        actor: 'ช่างสมศักดิ์',
        action: 'สร้างใบเสนอราคา',
      },
      {
        id: 'ver-202',
        timestamp: '2026-09-20 15:30',
        actor: 'คุณศิริพร วงศ์สว่าง',
        action: 'อนุมัติใบเสนอราคา',
        details: 'ยอมรับราคา 1,000.00 บาท',
      },
    ],
    createdAt: '2026-09-20 15:10',
    updatedAt: '2026-09-20 15:30',
  },
];

export class QuotationService {
  // Read all
  static getQuotations(): Quotation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_QUOTATIONS));
        return DEFAULT_QUOTATIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse quotations from storage', e);
      return DEFAULT_QUOTATIONS;
    }
  }

  // Save all
  static saveQuotations(quotes: Quotation[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch (e) {
      console.error('Failed to save quotations', e);
    }
  }

  // Get by ID
  static getQuotationById(id: string): Quotation | null {
    const list = this.getQuotations();
    return list.find((q) => q.id === id) || null;
  }

  // Get by Ticket ID
  static getQuotationsByTicketId(ticketId: string): Quotation[] {
    const list = this.getQuotations();
    return list.filter((q) => q.ticketId === ticketId);
  }

  // Generate unique number QT-YYYY-XXXX
  static generateQuotationNumber(): string {
    const list = this.getQuotations();
    const currentYear = new Date().getFullYear();
    const prefix = `QT-${currentYear}-`;
    const count = list.length + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  // Calculate single item total
  static calculateItemTotal(
    qty: number,
    price: number,
    discountType: 'amount' | 'percent',
    discountValue: number
  ): { discount: number; total: number } {
    const subtotal = (Number(qty) || 0) * (Number(price) || 0);
    let discount = 0;
    if (discountType === 'percent') {
      discount = (subtotal * (Number(discountValue) || 0)) / 100;
    } else {
      discount = Number(discountValue) || 0;
    }
    // Discount cannot exceed subtotal
    if (discount > subtotal) discount = subtotal;
    const total = Math.max(0, subtotal - discount);
    return { discount, total };
  }

  // Calculate quotation totals
  static calculateTotals(
    items: QuotationItem[],
    vatEnabled: boolean,
    vatRate: number = 7,
    depositAmount: number = 0
  ) {
    let subtotalBeforeDiscount = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      subtotalBeforeDiscount += lineSubtotal;

      let lineDiscount = 0;
      if (item.discountType === 'percent') {
        lineDiscount = (lineSubtotal * (Number(item.discountValue) || 0)) / 100;
      } else {
        lineDiscount = Number(item.discountValue) || 0;
      }
      if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal;
      totalDiscount += lineDiscount;
    });

    const netAfterDiscount = Math.max(0, subtotalBeforeDiscount - totalDiscount);
    const vatAmount = vatEnabled ? Math.round(((netAfterDiscount * vatRate) / 100) * 100) / 100 : 0;
    const grandTotal = Math.round((netAfterDiscount + vatAmount) * 100) / 100;
    const deposit = Math.min(grandTotal, Number(depositAmount) || 0);
    const remainingAmount = Math.max(0, Math.round((grandTotal - deposit) * 100) / 100);

    return {
      subtotal: subtotalBeforeDiscount,
      totalDiscount,
      netAfterDiscount,
      vatAmount,
      grandTotal,
      depositAmount: deposit,
      remainingAmount,
    };
  }

  // Create new quotation
  static createQuotation(
    data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>,
    actorName: string
  ): Quotation {
    const list = this.getQuotations();
    const newNumber = this.generateQuotationNumber();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newQuotation: Quotation = {
      ...data,
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quotationNumber: newNumber,
      revisionVersion: 1,
      versionHistory: [
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: actorName,
          action: 'สร้างใบเสนอราคา',
          details: `สร้างใบเสนอราคาใหม่ ${newNumber}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newQuotation);
    this.saveQuotations(list);
    return newQuotation;
  }

  // Update existing quotation
  static updateQuotation(
    id: string,
    updates: Partial<Quotation>,
    actorName: string,
    logAction?: string
  ): Quotation {
    const list = this.getQuotations();
    const index = list.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Quotation not found');

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const current = list[index];

    const history = [...(current.versionHistory || [])];
    if (logAction) {
      history.unshift({
        id: `log-${Date.now()}`,
        timestamp: now,
        actor: actorName,
        action: logAction,
        details: updates.notes || updates.approvalNote,
      });
    }

    const updated: Quotation = {
      ...current,
      ...updates,
      versionHistory: history,
      updatedAt: now,
    };

    list[index] = updated;
    this.saveQuotations(list);
    return updated;
  }

  // Duplicate to a new Revision / Copy
  static duplicateQuotation(id: string, actorName: string): Quotation {
    const source = this.getQuotationById(id);
    if (!source) throw new Error('Source quotation not found');

    const list = this.getQuotations();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newRev = (source.revisionVersion || 1) + 1;
    const newNumber = `${source.quotationNumber.split('-R')[0]}-R${newRev}`;

    const duplicated: Quotation = {
      ...source,
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quotationNumber: newNumber,
      status: 'draft',
      revisionVersion: newRev,
      approvedBy: undefined,
      approvedAt: undefined,
      approvalNote: undefined,
      versionHistory: [
        {
          id: `log-${Date.now()}`,
          timestamp: now,
          actor: actorName,
          action: 'ทำสำเนาแก้ไขใบเสนอราคา',
          details: `สร้างฉบับแก้ไขใหม่ (${newNumber}) จากเดิม ${source.quotationNumber}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(duplicated);
    this.saveQuotations(list);
    return duplicated;
  }

  // Approve Quotation
  static approveQuotation(
    id: string,
    approverName: string,
    approvalNote?: string
  ): Quotation {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return this.updateQuotation(
      id,
      {
        status: 'approved',
        approvedBy: approverName,
        approvedAt: now,
        approvalNote: approvalNote || 'ยอมรับราคาและเงื่อนไขตามใบเสนอราคา',
      },
      approverName,
      'อนุมัติใบเสนอราคา'
    );
  }

  // Request Revision
  static requestRevision(
    id: string,
    note: string,
    requesterName: string
  ): Quotation {
    return this.updateQuotation(
      id,
      {
        status: 'revision_requested',
        approvalNote: note,
      },
      requesterName,
      'ขอแก้ไขใบเสนอราคา'
    );
  }

  // Reject Quotation
  static rejectQuotation(
    id: string,
    reason: string,
    actorName: string
  ): Quotation {
    return this.updateQuotation(
      id,
      {
        status: 'rejected',
        approvalNote: reason,
      },
      actorName,
      'ไม่อนุมัติใบเสนอราคา'
    );
  }

  // Delete
  static deleteQuotation(id: string): boolean {
    const list = this.getQuotations();
    const filtered = list.filter((q) => q.id !== id);
    this.saveQuotations(filtered);
    return true;
  }

  // Export to CSV
  static exportQuotationToCsv(quote: Quotation) {
    const headers = [
      'ลำดับ',
      'รายการเสียหาย / งานที่ต้องทำ',
      'วิธีแก้ไข',
      'จำนวน',
      'หน่วย',
      'ราคาต่อหน่วย (บาท)',
      'ประเภทส่วนลด',
      'มูลค่าส่วนลด',
      'ราคารวม (บาท)',
    ];

    const rows = quote.items.map((item) => [
      item.itemNo,
      `"${(item.damageDescription || '').replace(/"/g, '""')}"`,
      `"${(item.repairMethod || '').replace(/"/g, '""')}"`,
      item.quantity,
      `"${item.unit}"`,
      item.unitPrice,
      item.discountType === 'percent' ? 'เปอร์เซ็นต์' : 'บาท',
      item.discountValue,
      item.total,
    ]);

    // Summary rows
    rows.push([]);
    rows.push(['', '', '', '', '', '', 'รวมก่อนส่วนลด', '', quote.subtotal]);
    rows.push(['', '', '', '', '', '', 'ส่วนลดรวม', '', quote.totalDiscount]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      `ภาษีมูลค่าเพิ่ม (${quote.vatEnabled ? quote.vatRate : 0}%)`,
      '',
      quote.vatAmount,
    ]);
    rows.push(['', '', '', '', '', '', 'ยอดสุทธิ', '', quote.grandTotal]);
    if (quote.depositAmount > 0) {
      rows.push(['', '', '', '', '', '', 'เงินมัดจำ', '', quote.depositAmount]);
      rows.push(['', '', '', '', '', '', 'ยอดคงเหลือที่ต้องชำระ', '', quote.remainingAmount]);
    }

    const csvContent =
      '\uFEFF' +
      `ใบเสนอราคาเลขที่: ${quote.quotationNumber}\n` +
      `อ้างอิงใบงาน: ${quote.ticketJobNumber || '-'}\n` +
      `ลูกค้า: ${quote.customerName} (${quote.customerPhone})\n` +
      `สถานที่: ${quote.propertyName} ${quote.unitNumber ? `ห้อง ${quote.unitNumber}` : ''}\n` +
      `วันที่ออก: ${quote.issueDate} (มีผลถึง: ${quote.validUntil})\n\n` +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Quotation_${quote.quotationNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Format currency in THB format (e.g. ฿1,250.00)
  static formatCurrency(amount: number): string {
    return `฿${(Number(amount) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
