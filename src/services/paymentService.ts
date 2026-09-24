import { PaymentRecord, PaymentStatus, PaymentMethod } from '../types';

const PAYMENTS_KEY = 'fixflow_payments_data_v1';

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    ticketId: 'ticket-5',
    jobNumber: 'JOB-2026-0005',
    invoiceNumber: 'INV-2026-0001',
    receiptNumber: 'RC-2026-0001',
    status: 'paid',
    method: 'promptpay',
    amount: 1250,
    totalAmount: 1250,
    remainingAmount: 0,
    paidAt: '2026-09-18 11:50',
    referenceNo: 'TXN-9823145',
    notes: 'ชำระค่าเปลี่ยนวาล์วก๊อกน้ำฝักบัวครบถ้วนผ่าน QR PromptPay',
    slipUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    customerName: 'คุณอรทัย วงศ์วิจิตร',
    customerPhone: '083-456-7890',
    createdAt: '2026-09-18 11:50',
  },
  {
    id: 'pay-2',
    ticketId: 'ticket-1',
    jobNumber: 'JOB-2026-0001',
    quotationId: 'quote-1',
    quotationNumber: 'QT-2026-0001',
    invoiceNumber: 'INV-2026-0002',
    status: 'deposit_paid',
    method: 'transfer',
    amount: 1000,
    totalAmount: 2461,
    remainingAmount: 1461,
    paidAt: '2026-09-20 16:30',
    referenceNo: 'KBANK-884210',
    notes: 'มัดจำค่าบริการล้างแอร์และน้ำยาแอร์ก่อนเริ่มงาน',
    customerName: 'คุณสมชาย มีสุข',
    customerPhone: '081-234-5678',
    createdAt: '2026-09-20 16:30',
  },
];

export const PaymentService = {
  getPayments(): PaymentRecord[] {
    try {
      const stored = localStorage.getItem(PAYMENTS_KEY);
      if (!stored) {
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return JSON.parse(stored) as PaymentRecord[];
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  getPaymentByTicketId(ticketId: string): PaymentRecord | undefined {
    return this.getPayments().find((p) => p.ticketId === ticketId);
  },

  recordPayment(
    payment: Omit<PaymentRecord, 'id' | 'invoiceNumber' | 'createdAt'> & {
      id?: string;
      invoiceNumber?: string;
    }
  ): PaymentRecord {
    const list = this.getPayments();
    const count = list.length + 1;
    const year = new Date().getFullYear();
    const padded = String(count).padStart(4, '0');

    const invoiceNumber = payment.invoiceNumber || `INV-${year}-${padded}`;
    const receiptNumber =
      payment.status === 'paid' ? `RC-${year}-${padded}` : payment.receiptNumber;

    if (payment.id) {
      const idx = list.findIndex((p) => p.id === payment.id);
      if (idx !== -1) {
        const updated: PaymentRecord = {
          ...list[idx],
          ...payment,
          invoiceNumber,
          receiptNumber,
        };
        list[idx] = updated;
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
        return updated;
      }
    }

    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}`,
      invoiceNumber,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newPayment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
    return newPayment;
  },
};
