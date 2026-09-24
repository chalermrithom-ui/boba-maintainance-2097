import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  PhoneCall,
  ShieldCheck,
  Send,
  X,
  Lock,
  ChevronLeft,
  ArrowRight,
  HelpCircle,
  Building,
  User as UserIcon,
  Upload,
  CreditCard,
  Image as ImageIcon,
  Check,
  Globe,
} from 'lucide-react';
import { Quotation, ShareLink, QUOTATION_STATUS_CONFIG, PaymentRecord } from '../types';
import { QuotationService } from '../services/quotationService';
import { ShareLinkService } from '../services/shareLinkService';
import { TicketService } from '../services/ticketService';
import { PaymentService } from '../services/paymentService';
import { useLanguage } from '../context/LanguageContext';
import { InvalidGuestLinkPage } from './InvalidGuestLinkPage';

interface GuestQuotationViewProps {
  shareToken: string;
  onNavigateToJob?: (jobToken: string) => void;
  onExitGuest?: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const GuestQuotationView: React.FC<GuestQuotationViewProps> = ({
  shareToken,
  onNavigateToJob,
  onExitGuest,
  showToast,
}) => {
  const { currentLang, toggleLang, t } = useLanguage();
  const isEn = currentLang === 'en';

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [errorStatus, setErrorStatus] = useState<'not_found' | 'expired' | 'deactivated' | null>(null);

  // Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [approverPhone, setApproverPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Revision Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionContact, setRevisionContact] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Payment Slip Upload Modal State
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentRefNo, setPaymentRefNo] = useState('');
  const [slipNote, setSlipNote] = useState('');
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false);
  const [existingPayment, setExistingPayment] = useState<PaymentRecord | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Linked Job Token
  const [linkedJobToken, setLinkedJobToken] = useState<string | null>(null);

  const loadData = () => {
    const check = ShareLinkService.getShareLinkByToken(shareToken, true);
    if (!check.isValid || !check.shareLink) {
      setErrorStatus(check.reason || 'not_found');
      return;
    }

    setShareLink(check.shareLink);

    const q = QuotationService.getQuotationById(check.shareLink.targetId);
    if (!q) {
      setErrorStatus('not_found');
      return;
    }

    setQuotation(q);
    setApproverName(q.customerName || '');
    setApproverPhone(q.customerPhone || '');
    setPaidAmount(q.depositAmount && q.depositAmount > 0 ? q.depositAmount : q.grandTotal);

    // Check existing payment records for this quotation/ticket
    const payments = PaymentService.getPayments();
    const existing = payments.find(
      (p) => p.quotationId === q.id || p.ticketId === q.ticketId
    );
    if (existing) {
      setExistingPayment(existing);
    }

    // Check if there is an active job share link
    const jLink = ShareLinkService.getActiveShareLinkForTarget('ticket', q.ticketId);
    if (jLink) {
      setLinkedJobToken(jLink.token);
    }
  };

  useEffect(() => {
    loadData();
  }, [shareToken]);

  // Handle Print/PDF
  const handlePrint = () => {
    window.print();
  };

  // Handle Slip Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isEn ? 'Please upload an image file' : 'กรุณาอัปโหลดไฟล์รูปภาพหลักฐานสลิปโอนเงิน', undefined, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setSlipImage(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPaymentSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    if (!slipImage) {
      showToast(
        isEn ? 'Please upload payment slip image' : 'กรุณาแนบรูปภาพสลิปหลักฐานการโอนเงิน',
        undefined,
        'error'
      );
      return;
    }

    setIsSubmittingSlip(true);

    setTimeout(() => {
      const tickets = TicketService.getTickets();
      const linkedTicket = tickets.find((t) => t.id === quotation.ticketId);
      const isDeposit = quotation.depositRequired && quotation.depositRequired > 0;
      const isFull = paidAmount >= quotation.grandTotal;

      const record = PaymentService.recordPayment({
        ticketId: quotation.ticketId,
        jobNumber: linkedTicket?.jobNumber || 'JOB-REF',
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: isFull ? 'paid' : isDeposit ? 'deposit_paid' : 'partially_paid',
        method: 'transfer',
        amount: paidAmount || quotation.grandTotal,
        totalAmount: quotation.grandTotal,
        remainingAmount: Math.max(0, quotation.grandTotal - (paidAmount || quotation.grandTotal)),
        paidAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        referenceNo: paymentRefNo.trim() || `SLIP-${Date.now().toString().slice(-6)}`,
        notes: slipNote.trim() || (isDeposit ? 'หลักฐานการโอนมัดจำโดยลูกค้าผ่านลิงก์' : 'หลักฐานการชำระเงินโดยลูกค้าผ่านลิงก์'),
        slipUrl: slipImage,
        customerName: quotation.customerName || approverName,
        customerPhone: quotation.customerPhone || approverPhone,
      });

      setExistingPayment(record);
      setIsSubmittingSlip(false);
      setShowSlipModal(false);
      showToast(
        isEn ? 'Payment proof submitted successfully' : 'แนบหลักฐานการโอนเงินเรียบร้อยแล้ว',
        isEn ? 'Staff will verify the payment shortly' : 'เจ้าหน้าที่จะตรวจสอบยอดเงินและออกใบเสร็จให้ต่อไป',
        'success'
      );
    }, 450);
  };

  // Handle Approve Submission
  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    if (!approverName.trim()) {
      showToast('กรุณาระบุชื่อผู้อนุมัติ', undefined, 'error');
      return;
    }
    if (!approverPhone.trim()) {
      showToast('กรุณาระบุเบอร์โทรศัพท์เพื่อยืนยัน', undefined, 'error');
      return;
    }
    if (!acceptedTerms) {
      showToast('กรุณาติ๊กยอมรับราคาและเงื่อนไข', undefined, 'error');
      return;
    }

    setIsSubmittingApproval(true);

    setTimeout(() => {
      // 1. Record Guest Approval
      ShareLinkService.recordGuestApproval({
        quotationId: quotation.id,
        approvedByName: approverName.trim(),
        approvedByPhone: approverPhone.trim(),
        acceptedTerms: true,
        note: approvalNote.trim() || undefined,
        ipInfo: 'Web Client / Guest Link',
      });

      // 2. Update Quotation Status
      const updated = QuotationService.updateQuotation(
        quotation.id,
        {
          status: 'approved',
          approvedBy: approverName.trim(),
          approvedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          approvalNote: approvalNote.trim() || undefined,
        },
        `${approverName.trim()} (ลูกค้าผ่านลิงก์)`,
        `อนุมัติราคาและเงื่อนไข ยอดรวม ${QuotationService.formatCurrency(quotation.grandTotal)} ${
          approvalNote ? `[หมายเหตุ: ${approvalNote}]` : ''
        }`
      );

      // 3. Update linked ticket status to 'scheduled' if applicable
      const tickets = TicketService.getTickets();
      const linkedTicket = tickets.find((t) => t.id === quotation.ticketId);
      if (linkedTicket && linkedTicket.status === 'new') {
        TicketService.updateTicket(
          linkedTicket.id,
          { status: 'scheduled' },
          'ระบบอัตโนมัติ (หลังลูกค้าอนุมัติใบเสนอราคา)'
        );
      }

      setIsSubmittingApproval(false);
      setShowApprovalModal(false);

      if (updated) {
        setQuotation(updated);
        showToast('อนุมัติใบเสนอราคาสำเร็จ', 'ระบบได้บันทึกการอนุมัติของคุณเรียบร้อยแล้ว', 'success');
      }
    }, 400);
  };

  // Handle Revision Submission
  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation) return;

    if (!revisionNote.trim()) {
      showToast('กรุณาระบุรายละเอียดที่ต้องการให้ปรับปรุง', undefined, 'error');
      return;
    }

    setIsSubmittingRevision(true);

    setTimeout(() => {
      // Update quotation status to revision_requested
      const updated = QuotationService.updateQuotation(
        quotation.id,
        {
          status: 'revision_requested',
          approvalNote: `ขอปรับปรุงแก้ไข: ${revisionNote.trim()} ${revisionContact ? `[เบอร์ติดต่อกลับ: ${revisionContact}]` : ''}`,
        },
        `${quotation.customerName || 'ลูกค้า'} (ผ่านลิงก์)`,
        `ขอปรับปรุงแก้ไข: ${revisionNote.trim()}`
      );

      setIsSubmittingRevision(false);
      setShowRevisionModal(false);

      if (updated) {
        setQuotation(updated);
        showToast('ส่งคำขอแก้ไขเรียบร้อยแล้ว', 'เจ้าหน้าที่จะตรวจสอบและติดต่อกลับโดยเร็วที่สุด', 'info');
      }
    }, 400);
  };

  // Invalid Token Screen
  if (errorStatus || !quotation || !shareLink) {
    return <InvalidGuestLinkPage reason={errorStatus || 'not_found'} onGoHome={onExitGuest} />;
  }

  const statusConfig = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.draft;
  const isApproved = quotation.status === 'approved';
  const isExpired = quotation.validUntil && new Date(quotation.validUntil).getTime() < Date.now();
  const canApprove =
    shareLink.allowQuotationApproval !== false &&
    quotation.status !== 'approved' &&
    quotation.status !== 'rejected' &&
    !isExpired;

  return (
    <div className="min-h-screen bg-slate-100/80 font-sans text-slate-900 flex flex-col items-center">
      {/* Top Sticky Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 font-display">
                FixFlow
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                เอกสารใบเสนอราคาและประมาณการซ่อม
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 transition-all"
              title={isEn ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'TH' : 'EN'}</span>
            </button>

            {linkedJobToken && onNavigateToJob && (
              <button
                type="button"
                onClick={() => onNavigateToJob(linkedJobToken)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{isEn ? 'View Job Ticket' : 'ดูรายละเอียดงานซ่อม'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Print / PDF' : 'พิมพ์ / บันทึก PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Quotation Document Container */}
      <main className="w-full max-w-4xl px-4 py-6 space-y-4 pb-28">
        {/* Security / Confidentiality Notice */}
        <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs text-blue-900 print:hidden">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>ลิงก์เฉพาะสำหรับตรวจสอบราคา คุณสามารถกดยืนยันอนุมัติหรือขอแก้ไขออนไลน์ได้ทันที</span>
          </div>
          {linkedJobToken && onNavigateToJob && (
            <button
              type="button"
              onClick={() => onNavigateToJob(linkedJobToken)}
              className="sm:hidden text-xs text-blue-700 font-bold underline ml-2 shrink-0"
            >
              ดูงานซ่อม
            </button>
          )}
        </div>

        {/* Approval Banner if already approved */}
        {isApproved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 shadow-xs print:hidden">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">
                  {isEn ? 'This quotation has been approved' : 'ใบเสนอราคานี้ได้รับการอนุมัติเรียบร้อยแล้ว'}
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  {isEn
                    ? 'Our technician team will proceed according to the scheduled appointment.'
                    : 'ทีมช่างจะเข้าดำเนินการตามวันและเวลานัดหมายตามที่ระบุในสัญญา'}
                </div>
                {existingPayment && (
                  <div className="mt-1.5 inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-100/90 text-emerald-800 text-[11px] font-bold rounded-md">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>
                      {isEn ? 'Payment Slip Attached' : 'แนบหลักฐานการโอนแล้ว'}: {QuotationService.formatCurrency(existingPayment.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSlipModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{existingPayment ? (isEn ? 'Update Payment Slip' : 'อัปเดตสลิปโอนเงิน') : (isEn ? 'Attach Payment Slip' : 'แนบหลักฐานการโอนเงิน')}</span>
            </button>
          </div>
        )}

        {/* Official Printable Quotation Sheet */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-6 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                    FixFlow Services
                  </h1>
                  <p className="text-xs text-slate-500">บริการช่างซ่อมบำรุงและบริหารงานอาคารครบวงจร</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-2 leading-relaxed">
                โทร: 02-987-6543 | LINE: @FixFlow | อีเมล: support@fixflow.local
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-800 text-xs font-extrabold rounded-lg uppercase tracking-wider mb-1">
                ใบเสนอราคา / Quotation
              </div>
              <div className="text-base font-extrabold font-mono text-slate-900">
                {quotation.quotationNumber}
              </div>
              <div className="text-xs text-slate-500">
                อ้างอิงใบงาน: <span className="font-mono font-bold text-blue-600">{quotation.jobNumber}</span>
              </div>
              <div className="flex sm:justify-end pt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Quotation Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                ข้อมูลลูกค้า / ผู้แจ้งงาน
              </div>
              <div className="font-bold text-sm text-slate-900">{quotation.customerName}</div>
              <div className="text-slate-600">เบอร์ติดต่อ: {quotation.customerPhone}</div>
              <div className="text-slate-600">
                สถานที่: {quotation.propertyName ? `${quotation.propertyName} ` : ''}ห้อง {quotation.unitNumber || '-'}
              </div>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                เงื่อนไขเวลาและผู้ออกเอกสาร
              </div>
              <div>
                <span className="text-slate-500">วันที่ออกเอกสาร: </span>
                <span className="font-semibold text-slate-900">
                  {new Date(quotation.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">มีผลถึงวันที่: </span>
                <span className="font-semibold text-slate-900">
                  {new Date(quotation.validUntil).toLocaleDateString('th-TH')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">ผู้จัดทำ: </span>
                <span className="font-semibold text-slate-900">{quotation.preparedBy}</span>
              </div>
            </div>
          </div>

          {/* Quotation Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[180px]">รายการความเสียหาย / งานที่ทำ</th>
                  <th className="py-3 px-3 min-w-[150px]">วิธีแก้ไข / รายละเอียด</th>
                  <th className="py-3 px-3 text-center w-16">จำนวน</th>
                  <th className="py-3 px-3 text-center w-16">หน่วย</th>
                  <th className="py-3 px-3 text-right w-24">ราคา/หน่วย</th>
                  <th className="py-3 px-3 text-right w-20">ส่วนลด</th>
                  <th className="py-3 px-3 text-right w-24 font-bold text-slate-900">รวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{item.description}</div>
                      {item.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.repairMethod || '-'}</td>
                    <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {QuotationService.formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {item.discount > 0
                        ? item.discountType === 'percent'
                          ? `${item.discount}%`
                          : QuotationService.formatCurrency(item.discount)
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {QuotationService.formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-6">
            <div className="space-y-3 w-full sm:max-w-sm text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-800">เงื่อนไขและการรับประกัน</div>
                <div>• การรับประกันงานซ่อม: {quotation.warrantyPeriod || 'รับประกันผลงาน 30 วัน'}</div>
                <div>• เงื่อนไขการชำระเงิน: {quotation.paymentTerms || 'ชำระเมื่อส่งมอบงานเรียบร้อย'}</div>
                {quotation.notes && <div className="text-slate-500">• {quotation.notes}</div>}
              </div>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>รวมเป็นเงิน:</span>
                <span className="font-mono">{QuotationService.formatCurrency(quotation.subtotal)}</span>
              </div>

              {quotation.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>ส่วนลดรวม:</span>
                  <span className="font-mono">-{QuotationService.formatCurrency(quotation.totalDiscount)}</span>
                </div>
              )}

              {quotation.vatIncluded && (
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                  <span className="font-mono">{QuotationService.formatCurrency(quotation.vatAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span>ยอดเงินสุทธิ:</span>
                <span className="text-base font-extrabold text-blue-600 font-mono">
                  {QuotationService.formatCurrency(quotation.grandTotal)}
                </span>
              </div>

              {quotation.depositRequired && quotation.depositRequired > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>เงินมัดจำ:</span>
                    <span className="font-mono">{QuotationService.formatCurrency(quotation.depositRequired)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>ยอดคงเหลือที่ต้องชำระ:</span>
                    <span className="font-mono">
                      {QuotationService.formatCurrency(quotation.grandTotal - quotation.depositRequired)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signature Blocks for Print */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 text-xs text-center">
            <div>
              <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
              <div className="font-bold">({quotation.preparedBy})</div>
              <div className="text-slate-500">ผู้เสนอราคา / FixFlow Services</div>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-slate-400 mb-2" />
              <div className="font-bold">({quotation.customerName})</div>
              <div className="text-slate-500">ผู้อนุมัติสั่งจ้าง / ลูกค้า</div>
            </div>
          </div>
        </div>

        {onExitGuest && (
          <div className="text-center pt-3 print:hidden">
            <button
              type="button"
              onClick={onExitGuest}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              เข้าสู่ระบบหลังบ้าน (เจ้าหน้าที่ / แอดมิน)
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Sticky Action Bar (Guest Actions) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-xl print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">ยอดที่ต้องชำระทั้งสิ้น:</span>
            <span className="text-base font-extrabold text-blue-600 font-mono">
              {QuotationService.formatCurrency(quotation.grandTotal)}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  ขอแก้ไข / สอบถามเพิ่มเติม
                </button>

                <button
                  type="button"
                  onClick={() => setShowApprovalModal(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>อนุมัติใบเสนอราคา</span>
                </button>
              </>
            )}

            {isApproved && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowSlipModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{existingPayment ? (isEn ? 'Update Slip' : 'อัปเดตสลิปโอน') : (isEn ? 'Attach Slip' : 'แนบสลิปโอนเงิน')}</span>
                </button>

                <div className="px-4 py-2.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Approved' : 'อนุมัติราคาแล้ว'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* 1. Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">ยืนยันการอนุมัติใบเสนอราคา</h3>
              <p className="text-xs text-slate-500 mt-1">
                เลขที่เอกสาร <span className="font-mono font-bold text-slate-700">{quotation.quotationNumber}</span> |
                ยอดเงิน <span className="font-bold text-blue-600">{QuotationService.formatCurrency(quotation.grandTotal)}</span>
              </p>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้อนุมัติ *
                </label>
                <input
                  type="text"
                  required
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="เช่น คุณสมชาย มีสุข"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์เพื่อติดต่อยืนยัน *
                </label>
                <input
                  type="tel"
                  required
                  value={approverPhone}
                  onChange={(e) => setApproverPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="เช่น สะดวกช่วงบ่ายเป็นต้นไป"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Mandatory Acceptance Checkbox */}
              <label className="flex items-start space-x-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm mt-0.5"
                />
                <span className="text-xs text-emerald-950 font-semibold leading-relaxed">
                  ข้าพเจ้ายอมรับราคาและเงื่อนไขตามใบเสนอราคานี้ และตกลงให้ช่างเข้าดำเนินการตามวันนัดหมาย
                </span>
              </label>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingApproval ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ยืนยันการอนุมัติ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              onClick={() => setShowRevisionModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">ขอแก้ไข / สอบถามเพิ่มเติม</h3>
              <p className="text-xs text-slate-500 mt-1">
                กรุณาระบุรายการหรือจุดที่ต้องการให้ช่างประเมินหรือปรับเปลี่ยน
              </p>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดที่ต้องการปรับปรุงหรือคำถาม *
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="เช่น ขอเปลี่ยนรุ่นอะไหล่เป็นแบบเดิม หรือต้องการลดรายการซ่อมฝ้าเพดานออกก่อน"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรติดต่อกลับ (หากต้องการให้โทรชี้แจง)
                </label>
                <input
                  type="tel"
                  value={revisionContact}
                  onChange={(e) => setRevisionContact(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRevision ? (
                    <span>{isEn ? 'Sending...' : 'กำลังส่ง...'}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isEn ? 'Send Revision Request' : 'ส่งคำขอแก้ไข'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Payment Proof Upload Modal */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowSlipModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEn ? 'Attach Payment Slip' : 'แนบหลักฐานการชำระเงิน'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Upload bank transfer slip or QR payment proof' : 'อัปโหลดสลิปโอนเงินผ่านธนาคารหรือ QR PromptPay'}
                </p>
              </div>
            </div>

            {/* Bank Account Information for Guest */}
            <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/70 text-xs space-y-1.5 text-blue-950">
              <div className="font-bold flex items-center space-x-1.5 text-blue-900">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{isEn ? 'Payment Destination Account' : 'บัญชีสำหรับโอนเงิน'}</span>
              </div>
              <div className="text-slate-700 pl-5 space-y-0.5 font-mono">
                <div>ธนาคารกสิกรไทย (KBANK)</div>
                <div className="font-bold text-sm text-blue-700">123-4-56789-0</div>
                <div className="font-sans text-[11px] text-slate-600">ชื่อบัญชี: บจก. ฟิกซ์โฟลว์ เซอร์วิสเซส (FixFlow)</div>
              </div>
            </div>

            <form onSubmit={handleConfirmPaymentSlip} className="space-y-4">
              {/* Slip Image Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isEn ? 'Payment Slip Image *' : 'รูปภาพสลิปโอนเงิน *'}
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {slipImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img
                      src={slipImage}
                      alt="Payment Slip"
                      className="w-full max-h-56 object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-md hover:bg-slate-50 cursor-pointer"
                      >
                        {isEn ? 'Change Image' : 'เปลี่ยนรูป'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {isEn ? 'Click to select or upload slip' : 'คลิกเพื่อเลือกหรือถ่ายรูปสลิป'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG หรือภาพถ่ายจากแอปธนาคาร
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Transferred */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Amount Paid (THB) *' : 'จำนวนเงินที่โอน (บาท) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Bank Ref / Time' : 'เลขอ้างอิง / เวลาโอน'}
                  </label>
                  <input
                    type="text"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    placeholder="เช่น 14:35 น."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Remarks (Optional)' : 'หมายเหตุเพิ่มเติม (ถ้ามี)'}
                </label>
                <input
                  type="text"
                  value={slipNote}
                  onChange={(e) => setSlipNote(e.target.value)}
                  placeholder="เช่น โอนค่ามัดจำงวดแรก หรือชำระเต็มจำนวน"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSlip || !slipImage}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSlip ? (
                    <span>{isEn ? 'Submitting...' : 'กำลังส่งหลักฐาน...'}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isEn ? 'Submit Payment Slip' : 'ยืนยันส่งหลักฐาน'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
