import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  QrCode,
  Building,
  Calendar,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Download,
  Eye,
} from 'lucide-react';
import { PaymentRecord, User, RepairTicket, PaymentStatus, PaymentMethod, Quotation } from '../types';
import { PaymentService } from '../services/paymentService';
import { TicketService } from '../services/ticketService';
import { ActivityLogService } from '../services/activityLogService';
import { CompanyService } from '../services/companyService';
import { QuotationService } from '../services/quotationService';
import { useLanguage } from '../context/LanguageContext';

interface PaymentsViewProps {
  currentUser: User;
  onSelectTicket?: (ticket: RepairTicket) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  currentUser,
  onSelectTicket,
  showToast,
}) => {
  const { currentLang, t } = useLanguage();
  const isEn = currentLang === 'en';

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('promptpay');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);

  // View Receipt Modal
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  const companySettings = CompanyService.getSettings();
  const tickets = TicketService.getTickets();

  const loadPayments = () => {
    setPayments(PaymentService.getPayments());
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jobNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalRevenue = payments
    .filter((p) => p.status === 'paid' || p.status === 'deposit_paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const paidCount = payments.filter((p) => p.status === 'paid').length;

  const handleTicketSelectChange = (tId: string) => {
    setSelectedTicketId(tId);
    const quote = QuotationService.getQuotationsByTicketId(tId).find(
      (q) => q.status === 'approved' || q.status === 'pending_approval'
    );
    if (quote) {
      if (quote.depositAmount > 0) {
        setIsDeposit(true);
        setAmount(quote.depositAmount.toString());
        setNotes(`ชำระเงินมัดจำตามใบเสนอราคา ${quote.quotationNumber} (ยอดรวมสุทธิ ${quote.grandTotal.toLocaleString()} บาท)`);
      } else {
        setIsDeposit(false);
        setAmount(quote.grandTotal.toString());
        setNotes(`ชำระเงินตามใบเสนอราคา ${quote.quotationNumber}`);
      }
    }
  };

  const handleOpenRecordModal = () => {
    const defaultTicket = tickets[0];
    const initialTicketId = defaultTicket?.id || '';
    setSelectedTicketId(initialTicketId);
    
    // Look up quotation for default ticket
    const quote = initialTicketId
      ? QuotationService.getQuotationsByTicketId(initialTicketId).find(
          (q) => q.status === 'approved' || q.status === 'pending_approval'
        )
      : null;

    if (quote) {
      if (quote.depositAmount > 0) {
        setIsDeposit(true);
        setAmount(quote.depositAmount.toString());
        setNotes(`ชำระเงินมัดจำตามใบเสนอราคา ${quote.quotationNumber}`);
      } else {
        setIsDeposit(false);
        setAmount(quote.grandTotal.toString());
        setNotes(`ชำระเงินตามใบเสนอราคา ${quote.quotationNumber}`);
      }
    } else {
      setAmount('1500');
      setIsDeposit(false);
      setNotes('');
    }

    setMethod('promptpay');
    setReferenceNo(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setShowRecordModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    if (!ticket) {
      showToast('กรุณาเลือกใบงาน', 'Please select a job ticket', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'Invalid amount', 'error');
      return;
    }

    const newPayment = PaymentService.recordPayment({
      ticketId: ticket.id,
      jobNumber: ticket.jobNumber,
      status: isDeposit ? 'deposit_paid' : 'paid',
      method,
      amount: numAmount,
      totalAmount: numAmount,
      remainingAmount: isDeposit ? numAmount : 0,
      paidAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
      customerName: ticket.requesterName,
      customerPhone: ticket.requesterPhone,
    });

    // Audit Log
    ActivityLogService.logAction({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actionType: 'PAYMENT_RECORDED',
      targetType: 'payment',
      targetId: newPayment.id,
      targetLabel: `${newPayment.invoiceNumber} (${newPayment.customerName})`,
      details: `บันทึกการรับชำระเงิน ${numAmount.toLocaleString()} บาท ผ่าน ${method} สำหรับงาน ${ticket.jobNumber}`,
    });

    setShowRecordModal(false);
    loadPayments();
    showToast('บันทึกการชำระเงินเรียบร้อย', 'Payment recorded successfully', 'success');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>{isEn ? 'Payments & Billing' : 'การเงิน การชำระเงิน และใบเสร็จ'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn
              ? 'Track customer payment receipts, invoices (INV), PromptPay QR, and cash flow.'
              : 'บันทึกการรับเงิน ออกใบแจ้งหนี้ (INV) ใบเสร็จรับเงิน (RC) และตรวจสอบยอดค้างชำระ'}
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            type="button"
            onClick={handleOpenRecordModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? 'Record Payment' : 'บันทึกการรับเงิน'}</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">{isEn ? 'Total Revenue Collected' : 'ยอดรับชำระแล้วทั้งหมด'}</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isEn ? 'THB' : 'บาท'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">{isEn ? 'Outstanding Balance' : 'ยอดรอชำระคงเหลือ'}</div>
            <div className="text-xl font-bold text-amber-600 font-mono mt-0.5">
              {totalOutstanding.toLocaleString()} <span className="text-xs font-normal text-slate-500">{isEn ? 'THB' : 'บาท'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">{isEn ? 'Settled Invoices' : 'ใบเสร็จที่ชำระครบถ้วน'}</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {paidCount} / {payments.length} <span className="text-xs font-normal text-slate-500">{isEn ? 'records' : 'รายการ'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search invoice number, receipt, customer name...' : 'ค้นหาเลขที่ INV, RC, ชื่อลูกค้า, เลขที่งานซ่อม...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 text-xs sm:text-sm border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="all">{isEn ? 'All Statuses' : 'ทุกสถานะการชำระ'}</option>
            <option value="paid">{isEn ? 'Fully Paid' : 'ชำระครบถ้วน (Paid)'}</option>
            <option value="deposit_paid">{isEn ? 'Deposit Paid' : 'ชำระมัดจำแล้ว (Deposit)'}</option>
            <option value="unpaid">{isEn ? 'Unpaid' : 'ยังไม่ชำระ (Unpaid)'}</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">{isEn ? 'Invoice / Receipt' : 'เลขที่เอกสาร'}</th>
                <th className="px-5 py-3.5">{isEn ? 'Customer & Job' : 'ลูกค้า / งานซ่อม'}</th>
                <th className="px-5 py-3.5">{isEn ? 'Method' : 'วิธีชำระ'}</th>
                <th className="px-5 py-3.5 text-right">{isEn ? 'Amount' : 'จำนวนเงิน'}</th>
                <th className="px-5 py-3.5 text-center">{isEn ? 'Status' : 'สถานะ'}</th>
                <th className="px-5 py-3.5 text-center">{isEn ? 'Action' : 'จัดการ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-mono font-bold text-blue-700">{p.invoiceNumber}</div>
                    {p.receiptNumber && (
                      <div className="font-mono text-[11px] text-emerald-700 mt-0.5">
                        {p.receiptNumber}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.paidAt || p.createdAt}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{p.customerName}</div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                        {p.jobNumber}
                      </span>
                      <span className="font-mono">{p.customerPhone}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {p.method === 'promptpay' && <QrCode className="w-3 h-3 mr-1 text-blue-600" />}
                      {p.method === 'transfer' && <Building className="w-3 h-3 mr-1 text-indigo-600" />}
                      {p.method === 'cash' && <Receipt className="w-3 h-3 mr-1 text-emerald-600" />}
                      {p.method === 'promptpay'
                        ? 'QR PromptPay'
                        : p.method === 'transfer'
                        ? 'โอนธนาคาร'
                        : p.method === 'cash'
                        ? 'เงินสด'
                        : 'บัตรเครดิต'}
                    </span>
                    {p.referenceNo && (
                      <div className="font-mono text-[10px] text-slate-400 mt-1">
                        Ref: {p.referenceNo}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {p.amount.toLocaleString()} ฿
                    </div>
                    {p.remainingAmount > 0 && (
                      <div className="text-[11px] text-amber-600 font-mono">
                        คงเหลือ {p.remainingAmount.toLocaleString()} ฿
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : p.status === 'deposit_paid'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {p.status === 'paid' ? 'ชำระแล้ว' : p.status === 'deposit_paid' ? 'มัดจำแล้ว' : 'รอชำระ'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => setViewingPayment(p)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isEn ? 'View' : 'ดูใบเสร็จ'}</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">
                    {isEn ? 'No payment records found' : 'ไม่พบข้อมูลการชำระเงิน'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              onClick={() => setShowRecordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 font-display">
              {isEn ? 'Record Customer Payment' : 'บันทึกการรับชำระเงิน'}
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEn ? 'Select Repair Job' : 'เลือกใบงานซ่อมแซม'} *
                </label>
                <select
                  required
                  value={selectedTicketId}
                  onChange={(e) => handleTicketSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {tickets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.jobNumber} - {t.title} ({t.requesterName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Amount (THB)' : 'ยอดเงินที่ชำระ (บาท)'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Payment Method' : 'ช่องทางชำระ'} *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="promptpay">QR PromptPay</option>
                    <option value="transfer">โอนเงินผ่านธนาคาร</option>
                    <option value="cash">เงินสด</option>
                    <option value="credit_card">บัตรเครดิต</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEn ? 'Reference Number / Transaction ID' : 'เลขที่อ้างอิงสลิป / Ref No.'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="เช่น KBANK-123456 หรือ PromptPay TXN"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isDeposit"
                  checked={isDeposit}
                  onChange={(e) => setIsDeposit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isDeposit" className="text-xs text-slate-700 cursor-pointer font-medium">
                  {isEn ? 'This is a deposit payment (requires final balance later)' : 'เป็นการชำระเงินมัดจำ (ยังมียอดคงค้างงวดสุดท้าย)'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEn ? 'Notes' : 'หมายเหตุ'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุหมายเหตุการรับชำระ..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isEn ? 'Save Payment' : 'บันทึกการรับเงิน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Printable Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up space-y-6">
            <button
              onClick={() => setViewingPayment(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content for Display / Print */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4 text-xs" id="printable-receipt">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="font-extrabold text-base text-slate-900 font-display">
                    {companySettings.companyNameTh}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{companySettings.addressTh}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Tax ID: {companySettings.taxId}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-blue-700 uppercase tracking-wider">
                    ใบเสร็จรับเงิน / RECEIPT
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {viewingPayment.receiptNumber || viewingPayment.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{viewingPayment.paidAt || viewingPayment.createdAt}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-1">
                <div>
                  <div className="text-slate-500 font-semibold">ได้รับเงินจาก (Customer):</div>
                  <div className="font-bold text-slate-900 mt-0.5">{viewingPayment.customerName}</div>
                  <div className="text-slate-500 font-mono">{viewingPayment.customerPhone}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">อ้างอิงใบงาน (Job Ref):</div>
                  <div className="font-bold font-mono text-slate-900 mt-0.5">{viewingPayment.jobNumber}</div>
                  <div className="text-slate-500">{viewingPayment.method.toUpperCase()}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">ค่าบริการและอะไหล่ซ่อมแซม</div>
                  {viewingPayment.notes && <div className="text-[11px] text-slate-500 mt-0.5">{viewingPayment.notes}</div>}
                </div>
                <div className="font-mono font-extrabold text-slate-900 text-base">
                  {viewingPayment.amount.toLocaleString()} ฿
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <div>สถานะ: <strong className="text-emerald-700">ชำระเรียบร้อยสมบูรณ์</strong></div>
                <div className="flex items-center text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  FixFlow Verified
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isEn ? 'Print Receipt' : 'พิมพ์ใบเสร็จ'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? 'Close' : 'ปิด'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
