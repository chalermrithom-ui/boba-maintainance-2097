import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  FileText,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  X,
  Share2,
  Lock,
  Building,
  User as UserIcon,
  Globe,
  PenTool,
} from 'lucide-react';
import { RepairTicket, STATUS_CONFIG, CATEGORY_CONFIG, ShareLink } from '../types';
import { TicketService } from '../services/ticketService';
import { ShareLinkService } from '../services/shareLinkService';
import { QuotationService } from '../services/quotationService';
import { useLanguage } from '../context/LanguageContext';
import { InvalidGuestLinkPage } from './InvalidGuestLinkPage';

interface GuestTicketViewProps {
  shareToken: string;
  onNavigateToQuotation?: (quotationToken: string) => void;
  onNavigateToAcceptance?: (acceptanceToken: string) => void;
  onExitGuest?: () => void;
}

export const GuestTicketView: React.FC<GuestTicketViewProps> = ({
  shareToken,
  onNavigateToQuotation,
  onNavigateToAcceptance,
  onExitGuest,
}) => {
  const { currentLang, toggleLang, t } = useLanguage();
  const isEn = currentLang === 'en';

  const [ticket, setTicket] = useState<RepairTicket | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [errorStatus, setErrorStatus] = useState<'not_found' | 'expired' | 'deactivated' | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [linkedQuotationToken, setLinkedQuotationToken] = useState<string | null>(null);
  const [linkedAcceptanceToken, setLinkedAcceptanceToken] = useState<string | null>(null);

  useEffect(() => {
    // Validate share token and log view count
    const check = ShareLinkService.getShareLinkByToken(shareToken, true);
    if (!check.isValid || !check.shareLink) {
      setErrorStatus(check.reason || 'not_found');
      return;
    }

    setShareLink(check.shareLink);

    // Load ticket
    const allTickets = TicketService.getTickets();
    const found = allTickets.find((t) => t.id === check.shareLink?.targetId);
    if (!found) {
      setErrorStatus('not_found');
      return;
    }

    setTicket(found);

    // Check if there is an active quotation share link for this ticket
    const quotations = QuotationService.getQuotationsByTicketId(found.id);
    if (quotations.length > 0) {
      const q = quotations[0];
      const qLink = ShareLinkService.getActiveShareLinkForTarget('quotation', q.id);
      if (qLink) {
        setLinkedQuotationToken(qLink.token);
      }
    }

    // Check if there is an active acceptance share link for this ticket
    const aLink = ShareLinkService.getActiveShareLinkForTarget('acceptance', found.id);
    if (aLink) {
      setLinkedAcceptanceToken(aLink.token);
    }
  }, [shareToken]);

  // If token is invalid or expired
  if (errorStatus || !ticket || !shareLink) {
    return <InvalidGuestLinkPage reason={errorStatus || 'not_found'} onGoHome={onExitGuest} />;
  }

  const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.new;
  const categoryInfo = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.other;

  // Masked location string
  const maskedLocation = ShareLinkService.maskLocation(
    ticket.unitNumber,
    ticket.propertyName,
    shareLink.maskLocation !== false
  );

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col items-center">
      {/* Top Banner Branding */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 font-display">
                FixFlow
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ระบบติดตามสถานะงานซ่อมสำหรับลูกค้า
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

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all border border-blue-200"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isEn ? 'Contact Staff' : 'ติดต่อผู้ดูแล'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl px-4 py-5 space-y-4 pb-20">
        {/* Security Notice Box */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>ลิงก์นี้เป็นลิงก์เฉพาะสำหรับดูข้อมูลงาน กรุณาไม่ส่งต่อให้ผู้อื่น</span>
        </div>

        {/* Primary Job Status Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  {ticket.jobNumber}
                </span>
                <span className="text-xs text-slate-400">
                  {isEn ? 'Created: ' : 'แจ้งเมื่อ '}{new Date(ticket.createdAt).toLocaleDateString(isEn ? 'en-US' : 'th-TH')}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {ticket.title}
              </h1>
            </div>

            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 ${statusInfo.badgeClass}`}>
              <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
              <span>{isEn ? (ticket.status.replace('_', ' ').toUpperCase()) : statusInfo.label}</span>
            </div>
          </div>

          {/* Quick Location & Appointment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{isEn ? 'Location' : 'สถานที่'}</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {maskedLocation}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">{isEn ? 'Appointment Date & Time' : 'วันและเวลานัดหมาย'}</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {ticket.appointment?.date
                    ? `${ticket.appointment.date} ${ticket.appointment.timeSlot || ''}`
                    : ticket.scheduledStart
                    ? new Date(ticket.scheduledStart).toLocaleString(isEn ? 'en-US' : 'th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : (isEn ? 'Pending scheduling / In coordination' : 'อยู่ระหว่างการประสานงานนัดหมาย')}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Technician Alias (Privacy Safe) */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                🔧
              </div>
              <div>
                <div className="text-[10px] text-indigo-700/80">{isEn ? 'Assigned Technician Team' : 'ทีมช่างผู้รับผิดชอบ'}</div>
                <div className="text-xs font-bold text-indigo-950">
                  {ticket.assignedTechnician || (isEn ? 'FixFlow Operations Team' : 'ทีมช่างส่วนกลาง FixFlow')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
            >
              {isEn ? 'Contact Support' : 'ติดต่อฝ่ายช่าง'}
            </button>
          </div>

          {/* Linked Quotation Banner if Available */}
          {linkedQuotationToken && onNavigateToQuotation && (
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white flex items-center justify-between shadow-md shadow-blue-500/20">
              <div className="space-y-0.5">
                <div className="text-[11px] text-blue-100 font-medium">
                  {isEn ? 'Cost Estimation Document' : 'เอกสารประมาณการซ่อม'}
                </div>
                <div className="text-sm font-bold">
                  {isEn ? 'Quotation is ready for review and approval' : 'มีใบเสนอราคาพร้อมให้ตรวจสอบและอนุมัติ'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToQuotation(linkedQuotationToken)}
                className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <span>{isEn ? 'View Quotation' : 'ดูใบเสนอราคา'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Linked Acceptance Banner if Available (e.g. ticket completed or inspection ready) */}
          {linkedAcceptanceToken && onNavigateToAcceptance && (
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white flex items-center justify-between shadow-md shadow-emerald-500/20">
              <div className="space-y-0.5">
                <div className="text-[11px] text-emerald-100 font-medium">
                  {isEn ? 'Final Inspection & Acceptance' : 'การส่งมอบและตรวจรับงาน'}
                </div>
                <div className="text-sm font-bold">
                  {ticket.customerAcceptance?.accepted
                    ? (isEn ? 'Work inspected and signed' : 'ลูกค้าตรวจรับงานเรียบร้อยแล้ว')
                    : (isEn ? 'Ready for your inspection and digital signature' : 'พร้อมให้ตรวจรับงานและเซ็นชื่อออนไลน์')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToAcceptance(linkedAcceptanceToken)}
                className="px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{ticket.customerAcceptance?.accepted ? (isEn ? 'View Acceptance' : 'ดูผลการตรวจรับ') : (isEn ? 'Sign Acceptance' : 'เซ็นตรวจรับงาน')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Problem Description Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>{isEn ? 'Reported Problem Description' : 'รายละเอียดปัญหาที่แจ้งซ่อม'}</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {ticket.description}
          </p>

          {/* Photos if allowed */}
          {shareLink.allowImages !== false && ticket.images && ticket.images.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                {isEn ? `Job Photos (${ticket.images.length})` : `รูปภาพประกอบงาน (${ticket.images.length} รูป)`}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ticket.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-2xl overflow-hidden bg-slate-100 aspect-4/3 border border-slate-200"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || (isEn ? 'Job photo' : 'รูปภาพงานซ่อม')}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-950/70 text-white text-[10px] rounded-md font-medium">
                      {img.phase === 'before'
                        ? (isEn ? 'Before' : 'ก่อนซ่อม')
                        : img.phase === 'during'
                        ? (isEn ? 'In-progress' : 'ระหว่างซ่อม')
                        : (isEn ? 'After' : 'หลังซ่อมเสร็จ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline if allowed */}
        {shareLink.allowTimeline !== false && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'Work Progress Timeline' : 'ความคืบหน้าการดำเนินงาน'}</span>
            </h2>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Created */}
              <div className="relative flex items-start space-x-3">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center text-[9px] text-white">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {isEn ? 'Ticket Received & Registered' : 'รับเรื่องแจ้งซ่อมแล้ว'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(ticket.createdAt).toLocaleString(isEn ? 'en-US' : 'th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Assigned / Scheduled */}
              {(ticket.status !== 'new') && (
                <div className="relative flex items-start space-x-3">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center text-[9px] text-white">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {isEn ? 'Technician Assigned & Scheduled' : 'มอบหมายทีมช่างและนัดหมาย'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {ticket.appointment?.date
                        ? (isEn
                            ? `Scheduled on ${ticket.appointment.date} at ${ticket.appointment.timeSlot}`
                            : `นัดหมายวันที่ ${ticket.appointment.date} เวลา ${ticket.appointment.timeSlot}`)
                        : (isEn ? 'Coordination completed' : 'ประสานงานเรียบร้อย')}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: In progress */}
              {(ticket.status === 'in_progress' || ticket.status === 'waiting_parts' || ticket.status === 'completed') && (
                <div className="relative flex items-start space-x-3">
                  <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full ring-4 ring-white flex items-center justify-center text-[9px] text-white ${
                    ticket.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'
                  }`}>
                    {ticket.status === 'completed' ? '✓' : '•'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {ticket.status === 'waiting_parts'
                        ? (isEn ? 'Waiting for Replacement Parts' : 'อยู่ระหว่างรออะไหล่')
                        : (isEn ? 'Repair Work in Progress' : 'ช่างกำลังปฏิบัติงานซ่อม')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isEn ? 'Carried out according to standard procedures' : 'เข้าดำเนินการซ่อมตามขั้นตอนมาตรฐาน'}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Completed */}
              {ticket.status === 'completed' && (
                <div className="relative flex items-start space-x-3">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center text-[9px] text-white">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800">
                      {isEn ? 'Repair Completed' : 'งานซ่อมเสร็จสิ้นสมบูรณ์'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isEn ? 'Verified and ready for client handover' : 'ตรวจสอบและส่งมอบงานเรียบร้อยแล้ว'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Contact Banner */}
        <div className="p-4 bg-slate-200/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            <div className="font-bold text-slate-800">
              {isEn ? 'Questions regarding this repair?' : 'มีข้อสงสัยเกี่ยวกับงานซ่อมนี้?'}
            </div>
            <div className="text-[11px] text-slate-500">
              {isEn
                ? 'Call our customer service center or contact management'
                : 'โทรติดต่อฝ่ายบริการลูกค้าหรือนิติบุคคลเพื่อสอบถามเพิ่มเติม'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all shadow-xs text-center cursor-pointer"
          >
            {isEn ? 'Customer Service' : 'ติดต่อฝ่ายบริการลูกค้า'}
          </button>
        </div>

        {onExitGuest && (
          <div className="text-center pt-2">
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

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <PhoneCall className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900">ติดต่อฝ่ายบริการลูกค้า</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              ศูนย์บริการซ่อมบำรุง FixFlow พร้อมให้คำปรึกษาตลอดเวลาทำการ (08:00 - 18:00 น.)
            </p>

            <div className="space-y-2 mb-4">
              <a
                href="tel:029876543"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20"
              >
                <PhoneCall className="w-4 h-4" />
                <span>โทร 02-987-6543 (สำนักงาน)</span>
              </a>

              <a
                href="https://line.me"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <span>ติดต่อผ่าน LINE Official: @FixFlow</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
