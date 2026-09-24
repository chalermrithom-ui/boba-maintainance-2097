// ==========================================
// FIXFLOW REPAIR MANAGEMENT TYPES
// ==========================================

export type FixFlowRole = 'admin' | 'technician' | 'viewer' | 'resident';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface ViewerPermissions {
  viewAllJobs: boolean;
  viewAssignedJobsOnly: boolean;
  canViewQuotations: boolean;
  canViewPayments: boolean;
  canViewReports: boolean;
  canViewCustomers: boolean;
  canViewSellingPrices: boolean;
}

export interface User {
  id: string;
  loginId: string;
  name: string;
  displayName?: string;
  nameTh?: string;
  nameEn?: string;
  email: string;
  phone?: string;
  lineId?: string;
  role: FixFlowRole;
  avatarUrl?: string;
  avatar?: string;
  preferredLanguage: 'th' | 'en';
  status: UserStatus;
  active?: boolean;
  viewerPermissions?: ViewerPermissions;
  internalNote?: string;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  unitNumber?: string;
  propertyName?: string;
}

export interface AuthSession {
  userId: string;
  loginId: string;
  role: FixFlowRole;
  preferredLanguage: 'th' | 'en';
  loginAt: string;
  expiresAt?: string;
}

export interface ShareLink {
  id: string;
  token: string;
  targetType: 'ticket' | 'quotation' | 'acceptance';
  targetId: string;
  customerId?: string;
  createdBy: string;
  expiresAt?: string;
  isActive: boolean;
  allowImages: boolean;
  allowTimeline: boolean;
  allowQuotationApproval: boolean;
  maskLocation?: boolean;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
}

export interface GuestApproval {
  id: string;
  quotationId: string;
  approvedByName: string;
  approvedByPhone: string;
  acceptedTerms: boolean;
  approvedAt: string;
  note?: string;
  ipInfo?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lineId?: string;
  customerType?: 'homeowner' | 'tenant' | 'juristic_person' | 'company';
  propertyName: string;
  building?: string;
  floor?: string;
  unitNumber?: string;
  address?: string;
  siteContactName?: string;
  siteContactPhone?: string;
  accessInstructions?: string;
  preferredServiceTime?: string;
  importantNote?: string;
  notes?: string;
  activeJobsCount?: number;
  totalJobsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanySettings {
  id: string;
  logoUrl?: string;
  companyNameTh: string;
  companyNameEn?: string;
  displayBrandName: string;
  taxId?: string;
  addressTh?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  website?: string;
  lineOfficial?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  promptPayId?: string;
  paymentQrCodeUrl?: string;
  defaultGuestLinkExpiryDays: number;
  brandPrimaryColor: string;
  defaultQuotationNotesTh?: string;
  defaultQuotationNotesEn?: string;
  defaultPaymentTermsTh?: string;
  defaultPaymentTermsEn?: string;
  defaultWarrantyTermsTh?: string;
  defaultWarrantyTermsEn?: string;
  documentFooterTh?: string;
  documentFooterEn?: string;
  updatedAt: string;
}

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'partially_paid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'transfer' | 'credit_card' | 'promptpay' | 'other';

export interface PaymentRecord {
  id: string;
  ticketId: string;
  jobNumber: string;
  quotationId?: string;
  quotationNumber?: string;
  invoiceNumber: string;
  receiptNumber?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  totalAmount: number;
  remainingAmount: number;
  paidAt?: string;
  referenceNo?: string;
  notes?: string;
  slipUrl?: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  key: string;
  titleTh: string;
  titleEn: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  note?: string;
}

export interface CustomerAcceptance {
  accepted: boolean;
  acceptedByName: string;
  acceptedByPhone: string;
  signatureDataUrl?: string;
  acceptedAt: string;
  rating?: number;
  feedback?: string;
  issueReported?: string;
  followUpTicketId?: string;
}

export interface Warranty {
  durationMonths: number;
  startDate: string;
  endDate: string;
  termsTh?: string;
  termsEn?: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'void';
  claimTicketIds?: string[];
}

export type PropertyType = 'condo' | 'house';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address?: string;
  buildings?: string[];
}

export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'cancelled';

export type TicketPriority = 'normal' | 'urgent' | 'emergency';

export type TicketCategory =
  | 'electrical'
  | 'plumbing'
  | 'air_conditioner'
  | 'appliances'
  | 'doors_windows'
  | 'walls_ceiling'
  | 'furniture'
  | 'internet'
  | 'other';

export type ImagePhase = 'before' | 'during' | 'after';

export interface TicketImage {
  id: string;
  url: string;
  phase: ImagePhase;
  isPrimary?: boolean;
  caption?: string;
  uploadedAt: string;
  uploaderName?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: FixFlowRole;
  content: string;
  createdAt: string;
}

export interface Appointment {
  date: string; // YYYY-MM-DD
  timeSlot: string;
  notes?: string;
}

export type ExpenseType = 'labor' | 'part' | 'other';

export interface Expense {
  id: string;
  type: ExpenseType;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  details: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  ticketId?: string;
}

// ==========================================
// QUOTATION & ESTIMATION MODULE TYPES
// ==========================================

export interface QuotationItem {
  id: string;
  itemNo: number;
  damageDescription: string;
  repairMethod: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: 'amount' | 'percent';
  discountValue: number;
  total: number;
}

export type QuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'revision_requested'
  | 'rejected'
  | 'expired';

export interface QuotationVersionLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  ticketId: string;
  ticketJobNumber?: string;
  ticketTitle?: string;
  customerName: string;
  customerPhone: string;
  propertyName: string;
  building?: string;
  floor?: string;
  unitNumber?: string;
  serviceProvider?: string;
  serviceProviderPhone?: string;
  issueDate: string;
  validUntil: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  depositRequired?: boolean;
  depositAmount: number;
  remainingAmount: number;
  notes?: string;
  notesTh?: string;
  notesEn?: string;
  paymentTerms?: string;
  paymentTermsTh?: string;
  paymentTermsEn?: string;
  warrantyTerms?: string;
  warrantyTermsTh?: string;
  warrantyTermsEn?: string;
  customerId?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNote?: string;
  revisionVersion?: number;
  versionHistory?: QuotationVersionLog[];
  createdAt: string;
  updatedAt: string;
}

export const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; badgeClass: string; dotColor: string; colorHex: string; description: string }
> = {
  draft: {
    label: 'ร่างใบเสนอราคา',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-500',
    colorHex: '#64748b',
    description: 'บันทึกฉบับร่าง ยังไม่ได้ส่งให้ลูกค้าพิจารณา',
  },
  pending_approval: {
    label: 'รออนุมัติ',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    dotColor: 'bg-amber-500',
    colorHex: '#d97706',
    description: 'ส่งเสนอราคาแล้ว อยู่ระหว่างรอการตอบรับจากลูกค้า',
  },
  approved: {
    label: 'อนุมัติแล้ว',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    dotColor: 'bg-emerald-600',
    colorHex: '#16a34a',
    description: 'ลูกค้ายอมรับราคาและเงื่อนไขเรียบร้อย พร้อมดำเนินงาน',
  },
  revision_requested: {
    label: 'ขอแก้ไข',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
    dotColor: 'bg-orange-500',
    colorHex: '#ea580c',
    description: 'ลูกค้ามีข้อสอบถามหรือขอปรับแก้รายละเอียดราคา',
  },
  rejected: {
    label: 'ไม่อนุมัติ',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    dotColor: 'bg-rose-600',
    colorHex: '#e11d48',
    description: 'ลูกค้าปฏิเสธใบเสนอราคานี้',
  },
  expired: {
    label: 'หมดอายุ',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-400 font-medium',
    dotColor: 'bg-slate-600',
    colorHex: '#475569',
    description: 'พ้นกำหนดเวลายืนยันราคาตามวันที่ระบุ',
  },
};

export interface RepairTicket {
  id: string;
  jobNumber: string; // e.g. JOB-2026-0001
  customerId?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  propertyType: PropertyType;
  propertyName: string;
  building?: string;
  floor?: string;
  unitNumber: string;
  address?: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  assignedTechnician?: string;
  assignedTechnicianId?: string;
  assignedTechnicianPhone?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  appointment?: Appointment;
  createdAt: string;
  updatedAt: string;
  images: TicketImage[];
  comments: Comment[];
  expenses: Expense[];
  activityLogs: ActivityLog[];
  quotationIds?: string[];
  checklist?: ChecklistItem[];
  customerAcceptance?: CustomerAcceptance;
  warranty?: Warranty;
  internalNote?: string;
  followUpFromTicketId?: string;
  followUpTicketIds?: string[];
  isDraft?: boolean;
}

// Meta configurations for UI rendering
export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  dotColor: string;
  colorHex: string;
}

export const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  new: {
    label: 'งานใหม่',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    colorHex: '#2563eb',
  },
  assigned: {
    label: 'มอบหมายแล้ว',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
    colorHex: '#7c3aed',
  },
  scheduled: {
    label: 'นัดหมายแล้ว',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
    colorHex: '#0284c7',
  },
  in_progress: {
    label: 'กำลังดำเนินการ',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
    colorHex: '#ea580c',
  },
  waiting_parts: {
    label: 'รออะไหล่',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    colorHex: '#ca8a04',
  },
  completed: {
    label: 'เสร็จสิ้น',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    colorHex: '#16a34a',
  },
  cancelled: {
    label: 'ยกเลิก',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    colorHex: '#dc2626',
  },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badgeClass: string; iconClass: string; color: string }> = {
  normal: {
    label: 'ปกติ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconClass: 'text-slate-500',
    color: '#64748b',
  },
  urgent: {
    label: 'ด่วน',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    iconClass: 'text-amber-600',
    color: '#d97706',
  },
  emergency: {
    label: 'ฉุกเฉิน',
    badgeClass: 'bg-red-100 text-red-700 border-red-300 font-bold animate-pulse',
    iconClass: 'text-red-600',
    color: '#dc2626',
  },
};

export const CATEGORY_CONFIG: Record<TicketCategory, { label: string; iconName: string; color: string }> = {
  electrical: { label: 'ไฟฟ้า', iconName: 'Zap', color: '#f59e0b' },
  plumbing: { label: 'ประปา', iconName: 'Droplets', color: '#06b6d4' },
  air_conditioner: { label: 'แอร์', iconName: 'Wind', color: '#3b82f6' },
  appliances: { label: 'เครื่องใช้ไฟฟ้า', iconName: 'Tv', color: '#8b5cf6' },
  doors_windows: { label: 'ประตู/หน้าต่าง', iconName: 'DoorOpen', color: '#10b981' },
  walls_ceiling: { label: 'ผนัง/ฝ้า', iconName: 'Paintbrush', color: '#ec4899' },
  furniture: { label: 'เฟอร์นิเจอร์', iconName: 'Armchair', color: '#84cc16' },
  internet: { label: 'อินเทอร์เน็ต', iconName: 'Wifi', color: '#6366f1' },
  other: { label: 'อื่น ๆ', iconName: 'HelpCircle', color: '#64748b' },
};

// ==========================================
// LEGACY COMPATIBILITY TYPES & ENUMS
// ==========================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  VIEWER = 'VIEWER',
}

export enum JobStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum JobPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
  CRITICAL = 'CRITICAL',
}

export interface RecurringSchedule {
  id: string;
  title: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'WEEKLY' | 'MONTHLY' | 'EVERY_3_MONTHS' | 'EVERY_6_MONTHS' | 'YEARLY' | string;
  condoName?: string;
  roomNo?: string;
  technician?: string;
  nextRunDate?: string;
  nextDueDate?: string;
  priority?: any;
  details?: string;
  notes?: string;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface UserMember {
  id?: string;
  userId?: string;
  email?: string;
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  name: string;
  role: UserRole;
  phone?: string;
  roomNumber?: string;
  condoName?: string;
  pin?: string;
  mfaEnabled?: boolean;
  createdAt?: string;
}

export interface Part {
  id: string;
  name: string;
  category?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  price?: number;
  unit?: string;
  minQty?: number;
  location?: string;
  minStockThreshold?: number;
}

export interface PartUsed {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface MaintenanceLog {
  id: string;
  jobId?: string;
  repairId?: string;
  author?: string;
  updatedBy?: string;
  timestamp: string;
  content?: string;
  description?: string;
  type?: string;
  phase?: 'before' | 'during' | 'after';
}

export interface RepairJob {
  id: string;
  title?: string;
  description?: string;
  condoName?: string;
  roomNumber?: string;
  roomNo?: string;
  customerName?: string;
  customerPhone?: string;
  category?: string;
  priority?: JobPriority | any;
  status?: JobStatus | any;
  technicianName?: string;
  technician?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  apptDate?: string;
  apptTime?: string;
  workDate?: string;
  details?: string;
  notes?: string;
  totalCost?: number;
  partsUsed?: PartUsed[];
  parts?: any[];
  beforeImage?: string;
  beforeImg?: string;
  afterImage?: string;
  afterImg?: string;
  paymentProofImg?: string;
  customerSignature?: string;
  techSignature?: string;
  createdAt?: string;
  updatedAt?: string;
}
