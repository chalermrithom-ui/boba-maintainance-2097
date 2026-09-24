import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Shield,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Camera,
  DollarSign,
  History,
  Tag,
  Wrench,
  Eye,
  Upload,
  X,
  FileText,
  Printer,
  Edit,
  ExternalLink,
  Share2,
  Star,
  CheckSquare,
  Square,
  Award,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import {
  RepairTicket,
  TicketStatus,
  TicketImage,
  Expense,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_CONFIG,
  User as UserType,
  ImagePhase,
  Quotation,
} from '../types';
import { TicketService, TECHNICIANS_LIST } from '../services/ticketService';
import { QuotationService } from '../services/quotationService';
import { ShareLinkService } from '../services/shareLinkService';
import { ImageModal } from './ImageModal';
import { QuotationFormModal } from './QuotationFormModal';
import { PrintableQuotationModal } from './PrintableQuotationModal';
import { ShareLinkModal } from './ShareLinkModal';

interface TicketDetailProps {
  ticket: RepairTicket;
  currentUser: UserType;
  onBack: () => void;
  onTicketUpdated: (updated: RepairTicket) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  currentUser,
  onBack,
  onTicketUpdated,
  showToast,
}) => {
  // Modal states
  const [activeImage, setActiveImage] = useState<TicketImage | null>(null);
  const [imagePhaseTab, setImagePhaseTab] = useState<'all' | 'before' | 'during' | 'after'>('all');

  // Comment input
  const [commentText, setCommentText] = useState('');

  // Add Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState<'labor' | 'part' | 'other'>('part');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseQty, setExpenseQty] = useState<number>(1);

  // Add Photo modal state
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoPhase, setPhotoPhase] = useState<ImagePhase>('during');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quotation states for this ticket
  const [ticketQuotations, setTicketQuotations] = useState<Quotation[]>(() =>
    QuotationService.getQuotationsByTicketId(ticket.id)
  );
  const [isQuotationFormOpen, setIsQuotationFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [viewingPrintQuotation, setViewingPrintQuotation] = useState<Quotation | null>(null);

  // On-site Customer Signature Modal State
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState(ticket.requesterName || '');
  const [signerPhone, setSignerPhone] = useState(ticket.requesterPhone || '');
  const [signRating, setSignRating] = useState(5);
  const [signFeedback, setSignFeedback] = useState('');
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawnSign, setHasDrawnSign] = useState(false);
  const isDrawingSignRef = useRef(false);

  // Warranty Claim Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimIssueText, setClaimIssueText] = useState('');
  const [claimReporterName, setClaimReporterName] = useState(ticket.requesterName || '');
  const [claimReporterPhone, setClaimReporterPhone] = useState(ticket.requesterPhone || '');

  // Customer Share Link Modal State
  const [shareModalTarget, setShareModalTarget] = useState<{
    type: 'ticket' | 'quotation' | 'acceptance';
    id: string;
    title: string;
  } | null>(null);

  const reloadTicketQuotations = () => {
    setTicketQuotations(QuotationService.getQuotationsByTicketId(ticket.id));
  };

  // Status Change Handler
  const handleStatusChange = (newStatus: TicketStatus) => {
    try {
      const updated = TicketService.updateTicket(
        ticket.id,
        { status: newStatus },
        currentUser.name
      );
      onTicketUpdated(updated);
      showToast('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะเป็น ${STATUS_CONFIG[newStatus].label}`, 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', undefined, 'error');
    }
  };

  // Assign Tech Handler
  const handleAssignTech = (techName: string) => {
    const tech = TECHNICIANS_LIST.find((t) => t.name === techName);
    try {
      const updated = TicketService.updateTicket(
        ticket.id,
        {
          assignedTechnician: techName,
          assignedTechnicianPhone: tech?.phone,
          status: ticket.status === 'new' ? 'assigned' : ticket.status,
        },
        currentUser.name
      );
      onTicketUpdated(updated);
      showToast('มอบหมายช่างสำเร็จ', `มอบหมายงานให้ ${techName}`, 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด', undefined, 'error');
    }
  };

  // Add Comment Handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const updated = TicketService.addComment(ticket.id, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        content: commentText.trim(),
      });
      onTicketUpdated(updated);
      setCommentText('');
      showToast('เพิ่มข้อความสำเร็จ', undefined, 'success');
    } catch (e) {
      showToast('ไม่สามารถส่งข้อความได้', undefined, 'error');
    }
  };

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;

    try {
      const qty = Number(expenseQty) || 1;
      const unitP = Number(expenseAmount);
      const totalAmount = unitP * qty;

      const updated = TicketService.addExpense(
        ticket.id,
        {
          type: expenseType,
          description: expenseDesc.trim(),
          amount: totalAmount,
          quantity: qty,
          unitPrice: unitP,
        },
        currentUser.name
      );

      onTicketUpdated(updated);
      setShowExpenseModal(false);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseQty(1);
      showToast('บันทึกค่าใช้จ่ายสำเร็จ', `เพิ่มรายการ ${expenseDesc}`, 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย', undefined, 'error');
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = (expId: string) => {
    try {
      const updated = TicketService.deleteExpense(ticket.id, expId, currentUser.name);
      onTicketUpdated(updated);
      showToast('ลบรายการค่าใช้จ่ายแล้ว', undefined, 'info');
    } catch (e) {
      showToast('ไม่สามารถลบรายการได้', undefined, 'error');
    }
  };

  // Add Photo Handler
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;

    try {
      const updated = TicketService.addImage(
        ticket.id,
        {
          url: photoUrl.trim(),
          phase: photoPhase,
          caption: photoCaption.trim() || undefined,
        },
        currentUser.name
      );

      onTicketUpdated(updated);
      setShowAddPhotoModal(false);
      setPhotoUrl('');
      setPhotoCaption('');
      showToast('เพิ่มรูปภาพสำเร็จ', undefined, 'success');
    } catch (e) {
      showToast('ไม่สามารถเพิ่มรูปภาพได้', undefined, 'error');
    }
  };

  // Filter photos by phase
  const filteredImages = (ticket.images || []).filter((img) => {
    if (imagePhaseTab === 'all') return true;
    return img.phase === imagePhaseTab;
  });

  // Checklist Item Toggle Handler
  const handleToggleChecklistItem = (key: string, currentCompleted: boolean) => {
    try {
      const updated = TicketService.toggleChecklistItem(
        ticket.id,
        key,
        !currentCompleted,
        currentUser.name
      );
      onTicketUpdated(updated);
      showToast('อัปเดตรายการตรวจเช็กแล้ว', undefined, 'success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการอัปเดต', undefined, 'error');
    }
  };

  // Canvas Drawing Handlers for On-site Signature
  const startDrawingSign = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingSignRef.current = true;
    setHasDrawnSign(true);
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSign = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignRef.current) return;
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingSign = () => {
    isDrawingSignRef.current = false;
  };

  const clearSignCanvas = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSign(false);
  };

  const handleSaveOnSiteSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      showToast('กรุณาระบุชื่อผู้ลงนามตรวจรับงาน', undefined, 'error');
      return;
    }
    const canvas = signCanvasRef.current;
    const signatureDataUrl = canvas && hasDrawnSign ? canvas.toDataURL('image/png') : undefined;

    const updated = TicketService.recordCustomerAcceptance(ticket.id, {
      acceptedByName: signerName.trim(),
      acceptedByPhone: signerPhone.trim(),
      signatureDataUrl,
      rating: signRating,
      feedback: signFeedback.trim() || undefined,
    });

    if (updated) {
      onTicketUpdated(updated);
      setShowSignModal(false);
      showToast('บันทึกการตรวจรับงานและออกใบรับประกันสำเร็จ', 'สถานะงานเปลี่ยนเป็นเสร็จสิ้น', 'success');
    }
  };

  const handleCreateWarrantyClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimIssueText.trim()) {
      showToast('กรุณาระบุรายละเอียดปัญหาที่ต้องการเคลม', undefined, 'error');
      return;
    }

    const claimTicket = TicketService.reportCustomerIssue(
      ticket.id,
      claimIssueText.trim(),
      claimReporterName.trim() || ticket.requesterName,
      claimReporterPhone.trim() || ticket.requesterPhone
    );

    if (claimTicket) {
      // Reload current ticket because followUpTicketIds changed
      const updatedOriginal = TicketService.getTicketById(ticket.id);
      if (updatedOriginal) onTicketUpdated(updatedOriginal);
      setShowClaimModal(false);
      setClaimIssueText('');
      showToast(
        'เปิดใบเคลมประกันสำเร็จ',
        `สร้างใบงานต่อเนื่องเลขที่ ${claimTicket.jobNumber} เรียบร้อยแล้ว`,
        'success'
      );
    }
  };

  const totalExpenses = (ticket.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="ย้อนกลับไปหน้ารายการ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {ticket.jobNumber}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border ${
                  PRIORITY_CONFIG[ticket.priority]?.badgeClass
                }`}
              >
                {PRIORITY_CONFIG[ticket.priority]?.label}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-display leading-tight">
              {ticket.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() =>
                setShareModalTarget({
                  type: 'ticket',
                  id: ticket.id,
                  title: `${ticket.jobNumber} - ${ticket.title}`,
                })
              }
              className="px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer border border-blue-200 shadow-xs"
              title="สร้างลิงก์สำหรับส่งให้ลูกค้าดูสถานะงาน"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>แชร์ลิงก์ลูกค้า</span>
            </button>
          )}

          {/* Current Status Pill */}
          <div
            className={`px-3.5 py-2 rounded-2xl border font-bold text-xs flex items-center space-x-2 ${
              STATUS_CONFIG[ticket.status]?.badgeClass
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[ticket.status]?.dotColor}`}></span>
            <span>{STATUS_CONFIG[ticket.status]?.label}</span>
          </div>
        </div>
      </div>

      {/* Viewer Read-Only Notice Bar */}
      {currentUser.role === 'viewer' && (
        <div className="bg-slate-100 border border-slate-200 text-slate-700 rounded-3xl p-4.5 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <Eye className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">โหมดผู้ดูอย่างเดียว (Viewer Mode):</span>
              <span className="text-slate-600 ml-1">คุณสามารถดูข้อมูลงานซ่อมแซม รูปภาพ และประวัติได้ แต่ไม่สามารถแก้ไขสถานะหรือเพิ่มข้อมูลได้</span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-xl shrink-0">Read-Only</span>
        </div>
      )}

      {/* Role Action Controls Bar (Admin / Tech controls) */}
      {(currentUser.role === 'admin' || currentUser.role === 'technician') && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              {currentUser.role === 'admin' ? (
                <Shield className="w-4 h-4 text-purple-400" />
              ) : (
                <HardHat className="w-4 h-4 text-orange-400" />
              )}
              <span className="font-bold text-slate-200">
                แผงควบคุมการจัดการ ({currentUser.role === 'admin' ? 'สำหรับผู้ดูแลระบบ' : 'สำหรับช่างผู้ปฏิบัติงาน'})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">เข้าใช้งานในนาม {currentUser.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {/* Change Status Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                เปลี่ยนสถานะงาน:
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(STATUS_CONFIG) as TicketStatus[])
                  .filter((st) => {
                    if (currentUser.role === 'technician') {
                      return ['in_progress', 'waiting_parts', 'completed'].includes(st);
                    }
                    return true;
                  })
                  .map((st) => (
                    <option key={st} value={st}>
                      {STATUS_CONFIG[st].label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Assign Technician Dropdown (Admin only) */}
            {currentUser.role === 'admin' ? (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  มอบหมายช่างผู้รับผิดชอบ:
                </label>
                <select
                  value={ticket.assignedTechnician || ''}
                  onChange={(e) => handleAssignTech(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- ยังไม่มอบหมายช่าง --</option>
                  {TECHNICIANS_LIST.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.specialty})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  บันทึกการทำงานของช่าง:
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="flex-1 px-2 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    เริ่มงาน
                  </button>
                  <button
                    onClick={() => handleStatusChange('waiting_parts')}
                    className="flex-1 px-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    รออะไหล่
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="flex-1 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    ปิดงาน
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions (Add Photo & Add Expense) */}
            <div className="flex items-end space-x-2">
              <button
                onClick={() => setShowAddPhotoModal(true)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>เพิ่มรูปภาพ</span>
              </button>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>ลงค่าใช้จ่าย</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Details & Right Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on Large) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                รายละเอียดปัญหาที่แจ้ง
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                หมวดหมู่: {CATEGORY_CONFIG[ticket.category]?.label || ticket.category}
              </span>
            </div>

            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
              {ticket.description}
            </p>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>สร้างเมื่อ: <strong className="text-slate-700">{ticket.createdAt}</strong></span>
              <span>อัปเดตล่าสุด: <strong className="text-slate-700">{ticket.updatedAt}</strong></span>
            </div>
          </div>

          {/* Photos Gallery Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">แกลเลอรีรูปภาพงานซ่อม</h3>
                <p className="text-xs text-slate-500">หลักฐานรูปภาพก่อนซ่อม ระหว่างซ่อม และหลังซ่อม</p>
              </div>
              {currentUser.role !== 'viewer' && (
                <button
                  onClick={() => setShowAddPhotoModal(true)}
                  className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรูปภาพ</span>
                </button>
              )}
            </div>

            {/* Phase Tabs */}
            <div className="flex space-x-1.5 p-1 bg-slate-100 rounded-2xl max-w-md text-xs">
              <button
                onClick={() => setImagePhaseTab('all')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  imagePhaseTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมด ({(ticket.images || []).length})
              </button>
              <button
                onClick={() => setImagePhaseTab('before')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  imagePhaseTab === 'before'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ก่อนซ่อม
              </button>
              <button
                onClick={() => setImagePhaseTab('during')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  imagePhaseTab === 'during'
                    ? 'bg-white text-blue-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ระหว่างซ่อม
              </button>
              <button
                onClick={() => setImagePhaseTab('after')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  imagePhaseTab === 'after'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                หลังซ่อม
              </button>
            </div>

            {/* Photo Grid */}
            {filteredImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-200 shadow-xs cursor-pointer"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'รูปงานซ่อม'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center space-x-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow ${
                          img.phase === 'before'
                            ? 'bg-amber-500 text-white'
                            : img.phase === 'during'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {img.phase === 'before' ? 'ก่อนซ่อม' : img.phase === 'during' ? 'ระหว่างซ่อม' : 'หลังซ่อม'}
                      </span>
                    </div>

                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] truncate">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                <Camera className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p>ยังไม่มีรูปภาพในหมวดหมู่นี้</p>
                <button
                  onClick={() => setShowAddPhotoModal(true)}
                  className="mt-2 text-blue-600 font-bold hover:underline"
                >
                  คลิกเพื่อเพิ่มรูปภาพ
                </button>
              </div>
            )}
          </div>

          {/* Expenses & Parts Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">รายการค่าใช้จ่ายและอะไหล่</h3>
                <p className="text-xs text-slate-500">บันทึกต้นทุนค่าแรงและอะไหล่ที่เปลี่ยน</p>
              </div>
              {currentUser.role !== 'viewer' && (
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ลงค่าใช้จ่าย</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">รายการ</th>
                    <th className="p-2.5">ประเภท</th>
                    <th className="p-2.5 text-center">จำนวน</th>
                    <th className="p-2.5 text-right">ราคาต่อหน่วย</th>
                    <th className="p-2.5 text-right">รวม (บาท)</th>
                    <th className="p-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticket.expenses && ticket.expenses.length > 0 ? (
                    ticket.expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-medium text-slate-900">{exp.description}</td>
                        <td className="p-2.5 text-slate-500">
                          {exp.type === 'labor' ? 'ค่าแรง' : exp.type === 'part' ? 'ค่าอะไหล่' : 'อื่น ๆ'}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">{exp.quantity || 1}</td>
                        <td className="p-2.5 text-right text-slate-600">
                          {(exp.unitPrice || exp.amount).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {exp.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          {currentUser.role !== 'viewer' && (
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 text-xs">
                        ยังไม่มีการบันทึกค่าใช้จ่ายในงานนี้
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-xs">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right text-slate-700">
                      ยอดรวมค่าใช้จ่ายทั้งหมด:
                    </td>
                    <td className="p-2.5 text-right text-emerald-700 font-black">
                      {totalExpenses.toLocaleString()} บาท
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* On-site Repair & Maintenance Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    รายการตรวจเช็กหน้างาน (On-site Checklist)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ขั้นตอนมาตรฐานสำหรับช่างเทคนิคในการเข้าตรวจสอบ ซ่อมแซม และทดสอบก่อนส่งมอบ
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  เสร็จ {(ticket.checklist || []).filter((i) => i.completed).length} / {(ticket.checklist || []).length || 4} ข้อ
                </span>
              </div>
            </div>

            {/* Checklist progress bar */}
            {(() => {
              const items = ticket.checklist && ticket.checklist.length > 0 ? ticket.checklist : [];
              const totalCount = items.length || 4;
              const completedCount = items.filter((i) => i.completed).length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              return (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percent === 100 ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>ความคืบหน้าการตรวจเช็ก</span>
                    <span className={percent === 100 ? 'text-emerald-700 font-bold' : 'text-sky-700 font-bold'}>
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Checklist items list */}
            <div className="space-y-2 pt-1">
              {(ticket.checklist && ticket.checklist.length > 0
                ? ticket.checklist
                : [
                    { id: 'c1', key: 'safety_check', titleTh: 'ตรวจความปลอดภัย ตัดเบรกเกอร์/ปิดวาล์วน้ำหลัก', completed: false },
                    { id: 'c2', key: 'inspection', titleTh: 'ตรวจสอบจุดรั่วซึม/ตรวจเช็กอุปกรณ์เบื้องต้น', completed: false },
                    { id: 'c3', key: 'repair_work', titleTh: 'ดำเนินการซ่อมแซมและเปลี่ยนชิ้นส่วนอะไหล่', completed: false },
                    { id: 'c4', key: 'test_cleanup', titleTh: 'ทดสอบระบบการทำงานและทำความสะอาดพื้นที่', completed: false },
                  ]
              ).map((item) => (
                <div
                  key={item.key}
                  onClick={() => {
                    if (currentUser.role !== 'viewer') {
                      handleToggleChecklistItem(item.key, item.completed);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    item.completed
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:border-sky-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <span className={`text-xs font-semibold ${item.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {item.titleTh}
                      </span>
                      {item.completedAt && (
                        <div className="text-[10px] text-emerald-700">
                          สำเร็จเมื่อ: {item.completedAt} {item.completedBy ? `โดย ${item.completedBy}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.completed ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      เรียบร้อย
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                      รอดำเนินการ
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quotations Section (Phase 2) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ใบเสนอราคาสำหรับงานนี้ ({ticketQuotations.length} ฉบับ)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    รองรับการสร้างหลายใบเสนอราคาต่อ 1 งาน พร้อมคำนวณและพิมพ์ A4
                  </p>
                </div>
              </div>

              {currentUser.role !== 'viewer' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuotation(null);
                    setIsQuotationFormOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-blue-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างใบเสนอราคาใหม่</span>
                </button>
              )}
            </div>

            {ticketQuotations.length > 0 ? (
              <div className="space-y-3">
                {ticketQuotations.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {q.quotationNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'pending_approval'
                              ? 'bg-blue-100 text-blue-800'
                              : q.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {q.status === 'approved'
                            ? 'อนุมัติแล้ว'
                            : q.status === 'pending_approval'
                            ? 'รออนุมัติ'
                            : q.status === 'rejected'
                            ? 'ไม่อนุมัติ'
                            : 'ฉบับร่าง'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          วันที่ออก: {q.issueDate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700">
                        {q.items.length} รายการงาน/ความเสียหาย • ผู้เสนอราคา: <span className="font-semibold">{q.serviceProvider}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                        <span>ยอดรวมก่อนภาษี: <strong>{q.subtotal.toLocaleString()} ฿</strong></span>
                        {q.totalDiscount > 0 && (
                          <span className="text-rose-600">ส่วนลด: <strong>-{q.totalDiscount.toLocaleString()} ฿</strong></span>
                        )}
                        {q.vatEnabled && (
                          <span>VAT 7%: <strong>{q.vatAmount.toLocaleString()} ฿</strong></span>
                        )}
                        <span className="text-blue-700 font-bold">ยอดสุทธิ: <strong>{q.grandTotal.toLocaleString()} ฿</strong></span>
                        {q.depositAmount > 0 && (
                          <span className="text-amber-700 font-semibold">มัดจำ: <strong>{q.depositAmount.toLocaleString()} ฿</strong></span>
                        )}
                        <span className="text-emerald-700 font-bold">คงเหลือ: <strong>{q.remainingAmount.toLocaleString()} ฿</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setViewingPrintQuotation(q)}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="พิมพ์เอกสาร A4 หรือ Export PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>พิมพ์ / PDF</span>
                      </button>

                      {currentUser.role !== 'viewer' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuotation(q);
                            setIsQuotationFormOpen(true);
                          }}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          title="แก้ไขใบเสนอราคา"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                          <span>แก้ไข</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p>ยังไม่มีการออกใบเสนอราคาสำหรับงานซ่อมนี้</p>
                {currentUser.role !== 'viewer' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuotation(null);
                      setIsQuotationFormOpen(true);
                    }}
                    className="px-4 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition cursor-pointer"
                  >
                    + สร้างใบเสนอราคาฉบับแรก
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer Acceptance & Sign-off Card (Guest Portal Integration) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    การตรวจรับงานโดยลูกค้า (Work Acceptance)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    สถานะการตรวจรับงาน ลายมือชื่อ และการประเมินความพึงพอใจของลูกค้า
                  </p>
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() =>
                    setShareModalTarget({
                      type: 'acceptance',
                      id: ticket.id,
                      title: `ตรวจรับงาน: ${ticket.jobNumber} - ${ticket.title}`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 border border-emerald-200 transition cursor-pointer"
                  title="สร้างลิงก์สำหรับส่งให้ลูกค้าเซ็นตรวจรับงาน"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สร้างลิงก์ตรวจรับงาน</span>
                </button>
              )}
            </div>

            {ticket.customerAcceptance?.accepted ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                      ลูกค้าตรวจรับงานเรียบร้อยแล้ว
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      ({new Date(ticket.customerAcceptance.acceptedAt).toLocaleString('th-TH')})
                    </span>
                  </div>
                  {ticket.customerAcceptance.rating && (
                    <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-xs font-bold text-amber-600 self-start sm:self-auto">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{ticket.customerAcceptance.rating} / 5 คะแนน</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[11px]">ผู้ตรวจรับมอบงาน:</span>
                    <strong className="text-slate-900">{ticket.customerAcceptance.acceptedByName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">เบอร์โทรศัพท์ผู้ตรวจรับ:</span>
                    <strong className="text-slate-900">{ticket.customerAcceptance.acceptedByPhone}</strong>
                  </div>
                </div>

                {ticket.customerAcceptance.feedback && (
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/70 text-xs text-slate-700">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">ข้อเสนอแนะ / ความคิดเห็น:</span>
                    <p className="italic">"{ticket.customerAcceptance.feedback}"</p>
                  </div>
                )}

                {ticket.customerAcceptance.signatureDataUrl && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">ลายมือชื่อดิจิทัล (Digital Signature):</span>
                    <div className="bg-white border border-emerald-200 rounded-xl p-2 inline-block shadow-2xs">
                      <img
                        src={ticket.customerAcceptance.signatureDataUrl}
                        alt="Customer Signature"
                        className="max-h-20 max-w-xs object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 space-y-2">
                <CheckCircle2 className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-600">ยังไม่ได้รับการตรวจรับงานจากลูกค้า</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  หลังจากช่างซ่อมแซมเสร็จสิ้น คุณสามารถให้ลูกค้าเซ็นรับมอบงานบนแท็บเล็ต/มือถือหน้างานได้ทันที หรือสร้างลิงก์สำหรับส่งทาง LINE ให้ลูกค้าเปิดตรวจดูรูปผลงานและเซ็นรับมอบออนไลน์
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  {currentUser.role !== 'viewer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSignerName(ticket.requesterName || '');
                        setSignerPhone(ticket.requesterPhone || '');
                        setShowSignModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <PenTool className="w-4 h-4" />
                      <span>ลูกค้าลงชื่อหน้างานทันที (On-site Sign)</span>
                    </button>
                  )}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() =>
                        setShareModalTarget({
                          type: 'acceptance',
                          id: ticket.id,
                          title: `ตรวจรับงาน: ${ticket.jobNumber} - ${ticket.title}`,
                        })
                      }
                      className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <span>สร้างลิงก์ส่ง LINE ให้ลูกค้าตรวจรับ</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Warranty & Guarantee Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    การรับประกันผลงานและเคลมประกัน (Warranty & Claims)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ติดตามระยะเวลารับประกันงานซ่อม บันทึกเงื่อนไข และเปิดใบเคลมกรณีพบปัญหาซ้ำ
                  </p>
                </div>
              </div>

              {ticket.warranty && ticket.warranty.status === 'active' && currentUser.role !== 'viewer' && (
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-xl text-xs flex items-center space-x-1 border border-amber-300 transition cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>แจ้งเคลมงานซ่อม</span>
                </button>
              )}
            </div>

            {ticket.warranty ? (
              <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-amber-950 text-xs sm:text-sm">
                      ความคุ้มครองรับประกัน {ticket.warranty.durationMonths} เดือน
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      คุ้มครองอยู่ (Active)
                    </span>
                  </div>
                  <div className="text-xs text-amber-900">
                    เริ่ม: <strong>{ticket.warranty.startDate}</strong> ถึง <strong>{ticket.warranty.endDate}</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="text-slate-500 font-medium">เงื่อนไขการรับประกัน: </span>
                    <span className="font-semibold">{ticket.warranty.termsTh || 'รับประกันคุณภาพงานซ่อมแซมและอะไหล่ที่เปลี่ยน'}</span>
                  </div>
                  {ticket.followUpTicketIds && ticket.followUpTicketIds.length > 0 && (
                    <div className="pt-2">
                      <span className="text-rose-700 font-bold block mb-1">
                        ประวัติการเปิดเคลมประกันที่เกี่ยวข้อง ({ticket.followUpTicketIds.length} รายการ):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ticket.followUpTicketIds.map((fId) => (
                          <span
                            key={fId}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-mono text-xs font-bold"
                          >
                            {fId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">งานนี้ยังไม่มีข้อมูลการรับประกัน</span>
                  <span className="text-[11px] text-slate-400">
                    ใบรับประกันงานจะเปิดใช้อัตโนมัติ 90 วัน เมื่อลูกค้าเซ็นตรวจรับงานเรียบร้อย หรือเมื่อปิดงานสำเร็จ
                  </span>
                </div>
                {currentUser.role !== 'viewer' && (
                  <button
                    type="button"
                    onClick={() => {
                      const nowStr = new Date().toISOString().slice(0, 10);
                      const endDateStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                      const updated = TicketService.updateTicket(
                        ticket.id,
                        {
                          warranty: {
                            durationMonths: 3,
                            startDate: nowStr,
                            endDate: endDateStr,
                            status: 'active',
                            termsTh: 'รับประกันคุณภาพงานซ่อมแซมและอะไหล่ 90 วัน',
                            termsEn: '90-day repair and replacement warranty',
                          },
                        },
                        currentUser.name
                      );
                      onTicketUpdated(updated);
                      showToast('เปิดใช้งานการรับประกันสำเร็จ', 'ออกใบรับประกัน 90 วันแล้ว', 'success');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition cursor-pointer shrink-0 ml-3"
                  >
                    + กำหนดรับประกัน 90 วัน
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Comments and Progress Notes Feed */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              ข้อความและการสื่อสาร ({ (ticket.comments || []).length })
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(ticket.comments || []).length > 0 ? (
                ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                      comment.authorRole === 'technician'
                        ? 'bg-orange-50/60 border border-orange-200'
                        : comment.authorRole === 'admin'
                        ? 'bg-purple-50/60 border border-purple-200'
                        : 'bg-blue-50/60 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-800">{comment.authorName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            comment.authorRole === 'technician'
                              ? 'bg-orange-200 text-orange-800'
                              : comment.authorRole === 'admin'
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {comment.authorRole === 'technician'
                            ? 'ช่าง'
                            : comment.authorRole === 'admin'
                            ? 'นิติ/แอดมิน'
                            : 'ผู้แจ้ง'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pt-1">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  ยังไม่มีข้อความเพิ่มเติม
                </div>
              )}
            </div>

            {/* Comment Form */}
            {currentUser.role !== 'viewer' ? (
              <form onSubmit={handleAddComment} className="pt-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="พิมพ์ข้อความหรืออัปเดตความคืบหน้า..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="pt-2 text-center text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                ผู้ใช้ระดับ Viewer มีสิทธิ์ดูข้อมูลอย่างเดียว ไม่สามารถส่งข้อความได้
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location, Tech & Timeline */}
        <div className="space-y-6">
          {/* Location & Resident Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ข้อมูลสถานที่ & ผู้ติดต่อ
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">{ticket.propertyName}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {ticket.building ? `${ticket.building} ` : ''}
                    {ticket.floor ? `ชั้น ${ticket.floor} ` : ''}
                    ห้อง/บ้านเลขที่: <strong className="text-slate-800 font-black">{ticket.unitNumber}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 pt-2 border-t border-slate-100">
                <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{ticket.requesterName}</span>
                    <a
                      href={`tel:${ticket.requesterPhone}`}
                      className="text-blue-600 hover:underline flex items-center space-x-1 font-bold"
                    >
                      <Phone className="w-3 h-3 inline" />
                      <span>{ticket.requesterPhone}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment & Assigned Tech Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              การนัดหมาย & ช่างผู้ดูแล
            </h3>

            {/* Appointment */}
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center justify-between text-sky-900 font-bold">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 inline text-sky-600" />
                  <span>วันนัดหมาย:</span>
                </span>
                <span>{ticket.appointment?.date || 'ยังไม่ได้ระบุ'}</span>
              </div>
              <div className="text-[11px] text-sky-800">
                เวลา: <strong>{ticket.appointment?.timeSlot || '-'}</strong>
              </div>
              {ticket.appointment?.notes && (
                <p className="text-[10px] text-sky-700 italic pt-1 border-t border-sky-200/60">
                  หมายเหตุ: {ticket.appointment.notes}
                </p>
              )}
            </div>

            {/* Tech */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 mb-1">ช่างผู้รับผิดชอบงาน:</div>
              {ticket.assignedTechnician ? (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{ticket.assignedTechnician}</h5>
                      <span className="text-[10px] text-slate-400">ช่างเทคนิคประจำโครงการ</span>
                    </div>
                  </div>
                  {ticket.assignedTechnicianPhone && (
                    <a
                      href={`tel:${ticket.assignedTechnicianPhone}`}
                      className="p-2 bg-white rounded-xl text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                      title="โทรหาช่าง"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  ยังไม่ได้มอบหมายช่างผู้รับผิดชอบ
                </div>
              )}
            </div>
          </div>

          {/* Activity Log / Timeline */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                ประวัติการดำเนินงาน (Timeline)
              </h3>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {(ticket.activityLogs || []).map((log, index) => (
                <div key={log.id || index} className="flex space-x-3 text-xs">
                  <div className="flex flex-col items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                    {index < (ticket.activityLogs || []).length - 1 && (
                      <span className="w-0.5 flex-1 bg-slate-200 my-1"></span>
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">• {log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-slate-400">โดย: {log.actorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">บันทึกค่าใช้จ่ายงานซ่อม</h3>
            <p className="text-xs text-slate-500 mb-4">ระบุค่าแรง ค่าอะไหล่ หรืออุปกรณ์ที่ใช้</p>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ประเภทค่าใช้จ่าย</label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="part">ค่าอะไหล่ / อุปกรณ์</option>
                  <option value="labor">ค่าแรงช่าง</option>
                  <option value="other">ค่าใช้จ่ายอื่น ๆ</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">รายละเอียดรายการ</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="เช่น ท่อน้ำทิ้งย่น, เซรามิควาล์ว, ค่าบริการล้างแอร์"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">จำนวน</label>
                  <input
                    type="number"
                    min={1}
                    value={expenseQty}
                    onChange={(e) => setExpenseQty(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    min={0}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">เพิ่มรูปภาพในใบงาน</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddPhotoModal(false);
                  setPhotoUrl('');
                  setPhotoCaption('');
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              อัปโหลดไฟล์รูปภาพพร้อมแสดงตัวอย่าง หรือระบุ URL รูปภาพ
            </p>

            <form onSubmit={handleAddPhoto} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">หมวดหมู่ขั้นตอน</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoPhase('before')}
                    className={`py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      photoPhase === 'before'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ก่อนซ่อม
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoPhase('during')}
                    className={`py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      photoPhase === 'during'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ระหว่างซ่อม
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoPhase('after')}
                    className={`py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
                      photoPhase === 'after'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    หลังซ่อม
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">เลือกรูปภาพ</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPhoto(true);
                  }}
                  onDragLeave={() => setIsDraggingPhoto(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPhoto(false);
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setPhotoUrl(event.target?.result as string);
                        if (!photoCaption) {
                          setPhotoCaption(files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      };
                      reader.readAsDataURL(files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                    isDraggingPhoto
                      ? 'border-blue-600 bg-blue-50'
                      : photoUrl
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setPhotoUrl(event.target?.result as string);
                          if (!photoCaption) {
                            setPhotoCaption(files[0].name.replace(/\.[^/.]+$/, ''));
                          }
                        };
                        reader.readAsDataURL(files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {photoUrl ? (
                    <div className="space-y-2">
                      <img
                        src={photoUrl}
                        alt="รูปภาพตัวอย่าง"
                        className="w-full h-36 object-cover rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold px-1">
                        <span>✓ เลือกรูปภาพแล้ว (แสดงตัวอย่าง)</span>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setPhotoUrl('');
                          }}
                          className="text-rose-600 hover:underline"
                        >
                          ลบรูปนี้
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3">
                      <Upload className="w-8 h-8 mx-auto text-blue-600 mb-1.5" />
                      <p className="text-xs font-bold text-slate-800">
                        ลากและวางรูปภาพที่นี่ หรือ{' '}
                        <span className="text-blue-600 underline">คลิกเพื่อเลือกไฟล์</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">รองรับ JPG, PNG, WEBP (แสดงตัวอย่างทันที)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative: Web URL */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">หรือระบุ URL รูปภาพโดยตรง</label>
                <input
                  type="url"
                  value={photoUrl.startsWith('data:') ? '' : photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">คำอธิบายภาพ (ถ้ามี)</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="เช่น ตรวจสอบจุดรั่วซึม, หลังติดตั้งอะไหล่ใหม่"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPhotoModal(false);
                    setPhotoUrl('');
                    setPhotoCaption('');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!photoUrl}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  เพิ่มรูปภาพ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-screen Image Modal */}
      <ImageModal image={activeImage} onClose={() => setActiveImage(null)} />

      {/* Quotation Form Modal */}
      {isQuotationFormOpen && (
        <QuotationFormModal
          ticket={ticket}
          quotationToEdit={editingQuotation}
          currentUser={currentUser}
          onClose={() => {
            setIsQuotationFormOpen(false);
            setEditingQuotation(null);
          }}
          onSave={() => {
            setIsQuotationFormOpen(false);
            setEditingQuotation(null);
            reloadTicketQuotations();
          }}
          showToast={showToast}
        />
      )}

      {/* Printable Quotation Modal (A4 / PDF) */}
      {viewingPrintQuotation && (
        <PrintableQuotationModal
          quotation={viewingPrintQuotation}
          onClose={() => setViewingPrintQuotation(null)}
          showToast={showToast}
        />
      )}

      {/* Share Link Modal for Guest Customer Portal */}
      {shareModalTarget && (
        <ShareLinkModal
          targetType={shareModalTarget.type}
          targetId={shareModalTarget.id}
          targetTitle={shareModalTarget.title}
          currentUser={currentUser}
          onClose={() => setShareModalTarget(null)}
          showToast={showToast}
        />
      )}

      {/* On-site Customer Signature Modal (Tablet / Mobile Friendly Canvas) */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">ตรวจรับงานและลงนามหน้างาน</h3>
                  <p className="text-xs text-slate-500">สำหรับลูกค้ายืนยันรับมอบงานซ่อมแซมเสร็จสมบูรณ์</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOnSiteSignature} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ตรวจรับงาน *</label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    value={signerPhone}
                    onChange={(e) => setSignerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">คะแนนความพึงพอใจ</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSignRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= signRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-2">
                    {signRating} / 5 ดาว
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">ข้อเสนอแนะเพิ่มเติม (ถ้ามี)</label>
                <input
                  type="text"
                  value={signFeedback}
                  onChange={(e) => setSignFeedback(e.target.value)}
                  placeholder="เช่น ช่างทำงานรวดเร็ว สะอาดเรียบร้อยมาก"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    วาดลายมือชื่อผู้ตรวจรับ (Digital Signature)
                  </label>
                  <button
                    type="button"
                    onClick={clearSignCanvas}
                    className="text-[11px] text-rose-600 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างลายเซ็น</span>
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden touch-none relative">
                  <canvas
                    ref={signCanvasRef}
                    width={460}
                    height={150}
                    onMouseDown={startDrawingSign}
                    onMouseMove={drawSign}
                    onMouseUp={stopDrawingSign}
                    onMouseLeave={stopDrawingSign}
                    onTouchStart={startDrawingSign}
                    onTouchMove={drawSign}
                    onTouchEnd={stopDrawingSign}
                    className="w-full h-36 bg-white cursor-crosshair block"
                  />
                  {!hasDrawnSign && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs italic">
                      แตะหรือลากนิ้ว/ปากกาเพื่อเซ็นชื่อที่นี่
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  ยืนยันตรวจรับงาน & ออกใบรับประกัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">แจ้งเคลมงานซ่อมแซม</h3>
                  <p className="text-xs text-slate-500">ภายใต้การรับประกันของใบงาน {ticket.jobNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarrantyClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  รายละเอียดปัญหาที่พบซ้ำ / ข้อบกพร่อง *
                </label>
                <textarea
                  required
                  rows={4}
                  value={claimIssueText}
                  onChange={(e) => setClaimIssueText(e.target.value)}
                  placeholder="เช่น ก๊อกน้ำจุดเดิมเริ่มมีน้ำหยดอีกครั้ง หรือ มีเสียงดังผิดปกติ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ผู้แจ้งเคลม</label>
                  <input
                    type="text"
                    value={claimReporterName}
                    onChange={(e) => setClaimReporterName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรติดต่อ</label>
                  <input
                    type="tel"
                    value={claimReporterPhone}
                    onChange={(e) => setClaimReporterPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                <span className="font-bold block">ข้อกำหนดการเคลมประกัน:</span>
                <p>ระบบจะสร้างใบงานใหม่ประเภทด่วน (Follow-up Ticket) เชื่อมโยงกับใบงานเดิมนี้ เพื่อให้ทีมช่างเข้าตรวจสอบแก้ไขโดยไม่มีค่าใช้จ่ายตามเงื่อนไข</p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  ยืนยันเปิดใบเคลมประกัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
