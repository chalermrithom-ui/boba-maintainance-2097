import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Star,
  RotateCcw,
  Calendar,
  Clock,
  PhoneCall,
  MapPin,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  HelpCircle,
  X,
  Camera,
  Download,
  Globe,
} from 'lucide-react';
import { RepairTicket, ShareLink } from '../types';
import { TicketService } from '../services/ticketService';
import { ShareLinkService } from '../services/shareLinkService';
import { ActivityLogService } from '../services/activityLogService';
import { InvalidGuestLinkPage } from './InvalidGuestLinkPage';
import { useLanguage } from '../context/LanguageContext';

interface GuestWorkAcceptanceProps {
  shareToken: string;
  onNavigateToJob?: (jobToken: string) => void;
  onExitGuest?: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const GuestWorkAcceptance: React.FC<GuestWorkAcceptanceProps> = ({
  shareToken,
  onNavigateToJob,
  onExitGuest,
  showToast,
}) => {
  const { currentLang, toggleLang } = useLanguage();
  const isEn = currentLang === 'en';

  const [ticket, setTicket] = useState<RepairTicket | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [errorStatus, setErrorStatus] = useState<'not_found' | 'expired' | 'deactivated' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);

  // Issue Follow-up Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  // Success State
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Canvas reference for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const check = ShareLinkService.getShareLinkByToken(shareToken, true);
    if (!check.isValid || !check.shareLink) {
      setErrorStatus(check.reason || 'not_found');
      return;
    }

    setShareLink(check.shareLink);

    const allTickets = TicketService.getTickets();
    const found = allTickets.find((t) => t.id === check.shareLink?.targetId);
    if (!found) {
      setErrorStatus('not_found');
      return;
    }

    setTicket(found);
    setSignerName(found.requesterName || '');
    setSignerPhone(found.requesterPhone || '');

    if (found.customerAcceptance?.accepted) {
      setAcceptedSuccess(true);
    }
  }, [shareToken]);

  // Set up signature canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // slate-800
  }, [acceptedSuccess, errorStatus]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmAcceptance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!signerName.trim()) {
      showToast('กรุณาระบุชื่อผู้ตรวจรับงาน', 'Please enter your name', 'error');
      return;
    }

    if (!hasDrawn) {
      showToast('กรุณาเซ็นชื่อในช่องลายเซ็น', 'Please sign the signature pad', 'error');
      return;
    }

    setIsSubmitting(true);

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    setTimeout(() => {
      // 1. Update ticket in service
      TicketService.updateTicket(ticket.id, {
        customerAcceptance: {
          accepted: true,
          acceptedByName: signerName.trim(),
          acceptedByPhone: signerPhone.trim(),
          signatureDataUrl,
          acceptedAt: new Date().toISOString(),
          rating,
          feedback: feedback.trim() || undefined,
        },
      });

      // 2. Audit log
      ActivityLogService.logAction({
        actorId: `guest_${ticket.id}`,
        actorName: `${signerName.trim()} (ลูกค้า)`,
        actorRole: 'guest',
        actionType: 'WORK_ACCEPTED',
        targetType: 'ticket',
        targetId: ticket.id,
        targetLabel: `${ticket.jobNumber} (${ticket.title})`,
        details: `ลูกค้าตรวจรับงานซ่อมแซมเรียบร้อย พร้อมลงลายมือชื่อดิจิทัลและให้คะแนนความพึงพอใจ ${rating}/5 ดาว`,
      });

      setIsSubmitting(false);
      setAcceptedSuccess(true);
      showToast('ตรวจรับงานสำเร็จ', 'Work acceptance recorded successfully', 'success');
    }, 450);
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !issueDescription.trim()) return;

    setIsReportingIssue(true);

    setTimeout(() => {
      // Create follow-up ticket note
      TicketService.addComment(ticket.id, {
        authorId: `guest_${ticket.id}`,
        authorName: `${signerName.trim() || ticket.requesterName} (ลูกค้าแจ้งติดตามผล)`,
        authorRole: 'resident',
        content: `[แจ้งปัญหาเพิ่มเติมหลังตรวจงาน]: ${issueDescription.trim()}`,
      });

      // Audit log
      ActivityLogService.logAction({
        actorId: `guest_${ticket.id}`,
        actorName: `${signerName.trim() || ticket.requesterName} (ลูกค้า)`,
        actorRole: 'guest',
        actionType: 'TICKET_UPDATED',
        targetType: 'ticket',
        targetId: ticket.id,
        targetLabel: ticket.jobNumber,
        details: `ลูกค้าแจ้งปัญหาเพิ่มเติมที่ต้องติดตามผล: "${issueDescription.trim()}"`,
      });

      setIsReportingIssue(false);
      setShowIssueModal(false);
      showToast('ส่งแจ้งปัญหาเรียบร้อย', 'Issue report submitted. Technician will contact you shortly.', 'success');
    }, 400);
  };

  if (errorStatus || !ticket || !shareLink) {
    return <InvalidGuestLinkPage reason={errorStatus || 'not_found'} onGoHome={onExitGuest} />;
  }

  // Before & After images
  const beforeImages = ticket.images.filter((img) => img.phase === 'before');
  const afterImages = ticket.images.filter((img) => img.phase === 'after');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 font-display">FixFlow</div>
              <div className="text-[10px] text-slate-500 font-medium">
                {isEn ? 'Work Acceptance Portal' : 'ระบบตรวจรับงานซ่อมแซม'}
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

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {isEn ? 'Official Client Portal' : 'พอร์ทัลตรวจรับงาน'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
              {isEn ? 'Repair Completed' : 'งานซ่อมแซมเสร็จสิ้นแล้ว'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display leading-snug">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-blue-100">
              <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-md font-bold text-white">
                {ticket.jobNumber}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-blue-300" />
                {ticket.propertyName} {ticket.building ? `(${ticket.building})` : ''}
              </span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-blue-300" />
                {ticket.updatedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Already Accepted Confirmation Notice */}
        {acceptedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-emerald-900 font-display">
                {isEn ? 'Work Accepted and Verified' : 'ตรวจรับงานซ่อมแซมเรียบร้อยแล้ว'}
              </h2>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                {isEn
                  ? `Signed and confirmed by ${ticket.customerAcceptance?.acceptedByName || signerName}. Your 90-day warranty coverage is now active.`
                  : `ตรวจรับโดย ${ticket.customerAcceptance?.acceptedByName || signerName} บันทึกลายเซ็นเรียบร้อย การรับประกันงานซ่อมแซมเริ่มมีผลตั้งแต่วันนี้`}
              </p>
              {ticket.customerAcceptance?.signatureDataUrl && (
                <div className="mt-3 inline-block bg-white p-2 rounded-xl border border-emerald-200">
                  <div className="text-[10px] text-slate-500 font-bold mb-1">{isEn ? 'Your Signature' : 'ลายมือชื่อของคุณ'}</div>
                  <img
                    src={ticket.customerAcceptance.signatureDataUrl}
                    alt="Signature"
                    className="h-12 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Before & After Photo Comparison */}
        {(beforeImages.length > 0 || afterImages.length > 0) && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 font-display text-base">
                  {isEn ? 'Before & After Photo Comparison' : 'เปรียบเทียบภาพ ก่อนและหลังซ่อม'}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {beforeImages.length + afterImages.length} {isEn ? 'photos' : 'ภาพถ่าย'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Phase */}
              <div className="space-y-2">
                <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                  {isEn ? 'Before Repair' : 'ก่อนการซ่อมแซม'}
                </div>
                {beforeImages.length > 0 ? (
                  beforeImages.map((img) => (
                    <div key={img.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                      <img
                        src={img.url}
                        alt="Before repair"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-2 text-xs">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-32 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    {isEn ? 'No before photos uploaded' : 'ไม่มีรูปภาพก่อนซ่อม'}
                  </div>
                )}
              </div>

              {/* After Phase */}
              <div className="space-y-2">
                <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {isEn ? 'After Repair (Completed)' : 'หลังซ่อมแซมเสร็จสิ้น'}
                </div>
                {afterImages.length > 0 ? (
                  afterImages.map((img) => (
                    <div key={img.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                      <img
                        src={img.url}
                        alt="After repair"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-2 text-xs">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-32 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    {isEn ? 'No after photos uploaded' : 'ไม่มีรูปภาพหลังซ่อม'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Work Details & Technician */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
          <h2 className="font-bold text-slate-900 font-display text-base">
            {isEn ? 'Repair Summary & Warranty' : 'สรุปงานซ่อมและการรับประกัน'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="text-slate-500 font-semibold">{isEn ? 'Assigned Technician' : 'ช่างผู้รับผิดชอบ'}</div>
              <div className="font-bold text-slate-900 text-sm">{ticket.assignedTechnician || 'ทีมช่างส่วนกลาง FixFlow'}</div>
              {ticket.assignedTechnicianPhone && (
                <div className="text-blue-600 font-mono">{ticket.assignedTechnicianPhone}</div>
              )}
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
              <div className="text-blue-700 font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {isEn ? 'Warranty Coverage' : 'ระยะเวลารับประกันผลงาน'}
              </div>
              <div className="font-bold text-blue-950 text-sm">90 วัน (นับจากวันตรวจรับงาน)</div>
              <div className="text-blue-700 text-[11px]">ครอบคลุมอะไหล่และจุดที่ซ่อมแซมตามมาตรฐาน FixFlow</div>
            </div>
          </div>

          {/* Expenses & Items Done */}
          {ticket.expenses && ticket.expenses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2">
                {isEn ? 'Service Items Breakdown' : 'รายการงานซ่อมแซมและอะไหล่'}
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {ticket.expenses.map((exp) => (
                  <div key={exp.id} className="py-2 flex justify-between items-center">
                    <span className="text-slate-700">{exp.description}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {exp.amount.toLocaleString()} {isEn ? 'THB' : 'บาท'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acceptance & Signature Form (if not yet accepted) */}
        {!acceptedSuccess ? (
          <form onSubmit={handleConfirmAcceptance} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                {isEn ? 'Customer Verification & Signature' : 'ยืนยันและลงลายมือชื่อตรวจรับงาน'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isEn
                  ? 'Please review the repair outcome and sign on the canvas below to confirm acceptance.'
                  : 'กรุณาตรวจสอบผลการซ่อมแซมและเซ็นชื่อในช่องด้านล่างเพื่อยืนยันตรวจรับงาน'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Signatory Name' : 'ชื่อ-นามสกุล ผู้ตรวจรับงาน'} *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="เช่น คุณสมชาย มีสุข"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Contact Phone' : 'เบอร์โทรศัพท์ติดต่อ'} *
                </label>
                <input
                  type="tel"
                  required
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isEn ? 'Service Rating' : 'ระดับความพึงพอใจในการให้บริการ'}
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2 font-mono">
                  {rating}/5
                </span>
              </div>
            </div>

            {/* Feedback Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Feedback or Comments (Optional)' : 'ความคิดเห็นหรือคำแนะนำ (ระบุหรือไม่ก็ได้)'}
              </label>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="เช่น ช่างทำงานรวดเร็ว สะอาด สุภาพมาก..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Signature Canvas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isEn ? 'Digital Signature' : 'ช่องลงลายมือชื่อดิจิทัล (เซ็นชื่อด้วยนิ้วมือหรือเมาส์)'} *
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Clear' : 'ลบลายเซ็น'}</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white relative overflow-hidden touch-none">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={160}
                  className="w-full h-40 cursor-crosshair block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                    {isEn ? 'Sign here with finger or mouse' : 'เซ็นชื่อที่นี่ (ใช้นิ้วลากหรือเมาส์)'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || !hasDrawn}
                className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md ${
                  hasDrawn && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span>{isEn ? 'Recording Acceptance...' : 'กำลังบันทึกข้อมูล...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEn ? 'Confirm Work Acceptance' : 'ยืนยันการตรวจรับงานซ่อม'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center justify-center space-x-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{isEn ? 'Found an issue? Request follow-up visit' : 'พบจุดที่ยังไม่เรียบร้อย? แจ้งให้ช่างดูแลต่อ'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-base font-display">
              {isEn ? 'Need Assistance with This Repair?' : 'ต้องการความช่วยเหลือเพิ่มเติมเกี่ยวกับงานนี้?'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isEn
                ? 'Your warranty is active for 90 days. If the issue reoccurs within the warranty period, we will send a technician free of charge.'
                : 'งานซ่อมนี้อยู่ภายใต้การรับประกัน 90 วัน หากเกิดปัญหาซ้ำในช่วงรับประกัน ทีมงานพร้อมเข้าดูแลโดยไม่มีค่าบริการ'}
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="tel:029876543"
                className="py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>02-987-6543</span>
              </a>
              {onExitGuest && (
                <button
                  type="button"
                  onClick={onExitGuest}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEn ? 'Return to FixFlow' : 'กลับสู่หน้าหลัก'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Follow-up Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 font-display">
              {isEn ? 'Report Issue for Follow-up' : 'แจ้งปัญหาที่ต้องการให้ช่างดูแลต่อ'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              {isEn
                ? 'Describe the issue or defect. The coordinator will review and contact you to schedule a follow-up visit.'
                : 'ระบุจุดที่ยังบกพร่องหรือต้องการให้แก้ไขเพิ่มเติม ทีมงานจะประสานงานช่างเข้าตรวจสอบให้โดยเร็ว'}
            </p>

            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEn ? 'Issue Description' : 'รายละเอียดปัญหาที่พบ'} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="เช่น ยังมีเสียงลมดังผิดปกติเวลาเปิดแอร์เบอร์แรง, ก๊อกน้ำยังมีหยดเล็กน้อย..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button
                  type="submit"
                  disabled={isReportingIssue || !issueDescription.trim()}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isReportingIssue ? 'กำลังส่งข้อมูล...' : isEn ? 'Submit Issue' : 'ส่งแจ้งปัญหา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
