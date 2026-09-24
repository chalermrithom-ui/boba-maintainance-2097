import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shuffle,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { User, FixFlowRole, ViewerPermissions } from '../types';
import { AuthService, CreateUserDTO } from '../services/authService';

interface UserFormModalProps {
  userToEdit?: User | null;
  onClose: () => void;
  onSave: (savedUser: User) => void;
  showToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  userToEdit,
  onClose,
  onSave,
  showToast,
}) => {
  const isEdit = !!userToEdit;

  // Form states
  const [name, setName] = useState(userToEdit?.name || '');
  const [displayName, setDisplayName] = useState(userToEdit?.displayName || '');
  const [loginId, setLoginId] = useState(userToEdit?.loginId || '');
  const [email, setEmail] = useState(userToEdit?.email || '');
  const [phone, setPhone] = useState(userToEdit?.phone || '');
  const [lineId, setLineId] = useState(userToEdit?.lineId || '');
  const [role, setRole] = useState<FixFlowRole>(userToEdit?.role || 'technician');
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>(
    userToEdit?.status === 'suspended' ? 'suspended' : 'active'
  );
  const [preferredLanguage, setPreferredLanguage] = useState<'th' | 'en'>(
    userToEdit?.preferredLanguage || 'th'
  );
  const [avatarUrl, setAvatarUrl] = useState(userToEdit?.avatarUrl || PRESET_AVATARS[0]);
  const [internalNote, setInternalNote] = useState(userToEdit?.internalNote || '');

  // Viewer Permissions
  const [viewerPermissions, setViewerPermissions] = useState<ViewerPermissions>(
    userToEdit?.viewerPermissions || {
      viewAllJobs: true,
      viewAssignedJobsOnly: false,
      canViewQuotations: true,
      canViewPayments: false,
      canViewReports: true,
      canViewCustomers: true,
      canViewSellingPrices: false,
    }
  );

  // Password for new user
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(true);

  // Validation feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Login ID validation
  const loginIdValidation = AuthService.validateLoginId(loginId, userToEdit?.id);

  // Live password validation
  const passwordValidation = !isEdit ? AuthService.validatePassword(password) : null;
  const passwordsMatch = isEdit || (password.length > 0 && password === confirmPassword);

  // Auto suggest loginId when typing name on new user
  const handleGenerateLoginIdSuggestion = () => {
    if (!name.trim()) return;
    const transliterated = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10);
    const prefix = role === 'admin' ? 'admin.' : role === 'viewer' ? 'viewer.' : 'tech.';
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const candidate = `${prefix}${transliterated || 'user'}${randomSuffix}`;
    setLoginId(candidate);
  };

  const handleGenerateRandomPassword = () => {
    const temp = AuthService.generateTemporaryPassword();
    setPassword(temp);
    setConfirmPassword(temp);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Login ID
    if (!loginIdValidation.valid) {
      setErrorMsg(loginIdValidation.error || 'Login ID ไม่ถูกต้อง');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อ-นามสกุล');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('กรุณาระบุอีเมลให้ถูกต้อง');
      return;
    }

    // Role modification checks
    if (isEdit && userToEdit) {
      if (userToEdit.role === 'admin' && role !== 'admin') {
        const check = AuthService.canDemoteOrDeleteAdmin(userToEdit.id);
        if (!check.allowed) {
          setErrorMsg(check.messageTh);
          return;
        }
      }
      if (userToEdit.role !== role && !roleChangeReason.trim()) {
        setErrorMsg('กรุณาระบุเหตุผลการเปลี่ยนบทบาทผู้ใช้');
        return;
      }
    }

    if (!isEdit) {
      if (!passwordValidation?.valid) {
        setErrorMsg(passwordValidation?.error || 'รหัสผ่านไม่ตรงตามข้อกำหนด');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (isEdit && userToEdit) {
        const updates: Partial<User> = {
          name: name.trim(),
          displayName: displayName.trim() || name.trim(),
          loginId: loginId.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          lineId: lineId.trim() || undefined,
          role,
          status,
          preferredLanguage,
          avatarUrl,
          internalNote: internalNote.trim() || undefined,
          viewerPermissions: role === 'viewer' ? viewerPermissions : undefined,
        };

        if (userToEdit.role !== role && roleChangeReason.trim()) {
          updates.internalNote = `[${new Date().toISOString().slice(0, 10)}] เปลี่ยนจาก ${userToEdit.role} เป็น ${role}: ${roleChangeReason.trim()}`;
        }

        const result = AuthService.updateUser(userToEdit.id, updates);

        setIsSubmitting(false);

        if (!result.success || !result.user) {
          setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        } else {
          showToast?.('แก้ไขข้อมูลผู้ใช้สำเร็จ', `บันทึกการเปลี่ยนแปลงของ "${result.user.name}" แล้ว`, 'success');
          onSave(result.user);
        }
      } else {
        const dto: CreateUserDTO = {
          name: name.trim(),
          displayName: displayName.trim() || name.trim(),
          loginId: loginId.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          lineId: lineId.trim() || undefined,
          password: password.trim(),
          role,
          status,
          preferredLanguage,
          avatarUrl,
          internalNote: internalNote.trim() || undefined,
          viewerPermissions: role === 'viewer' ? viewerPermissions : undefined,
          isTemporaryPassword,
        };

        const result = AuthService.createUser(dto);
        setIsSubmitting(false);

        if (!result.success || !result.user) {
          setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
        } else {
          showToast?.(
            'สร้างบัญชีผู้ใช้ใหม่สำเร็จ',
            `สร้างบัญชี ${result.user.name} (${result.user.loginId}) เรียบร้อยแล้ว`,
            'success'
          );
          onSave(result.user);
        }
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-6 animate-scale-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              {role === 'admin' ? <Shield className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                {isEdit ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่ / Add User'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `แก้ไขรายละเอียดของบัญชี ${userToEdit?.loginId}`
                  : 'สร้างบัญชีสำหรับผู้ดูแลระบบหรือช่างเทคนิค'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ชื่อ-นามสกุล / Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ช่างสมชาย มีฤทธิ์"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Login ID / Username */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Login ID / Username <span className="text-rose-500">*</span>
              </label>
              {!isEdit && (
                <button
                  type="button"
                  onClick={handleGenerateLoginIdSuggestion}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>แนะนำชื่อผู้ใช้</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toLowerCase().trim())}
                placeholder="เช่น technician.somchai หรือ somchai_01"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                  loginId.length > 0
                    ? loginIdValidation.valid
                      ? 'border-emerald-300 focus:ring-emerald-500'
                      : 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {loginId.length > 0 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {loginIdValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
              )}
            </div>

            {/* Login ID Guidelines & Live Status */}
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                กติกา: 4-30 ตัวอักษร (a-z, 0-9, จุด ., ขีดกลาง -, ขีดล่าง _)
              </span>
              {loginId.length > 0 && (
                <span
                  className={`font-semibold ${
                    loginIdValidation.valid ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {loginIdValidation.valid ? '✓ Login ID ใช้งานได้' : loginIdValidation.error}
                </span>
              )}
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                อีเมล / Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                เบอร์โทรศัพท์ / Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Line ID & Display Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ชื่อที่แสดง / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น ช่างสมชาย, ฝ่ายบริหาร"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                LINE ID (สำหรับติดต่อ)
              </label>
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="เช่น @somchaifix หรือ somchai_line"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                บทบาทผู้ใช้ / Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 transition-all ${
                    role === 'technician'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>ช่างซ่อม</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 transition-all ${
                    role === 'admin'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>ผู้ดูแลระบบ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 transition-all ${
                    role === 'viewer'
                      ? 'bg-amber-50 border-amber-600 text-amber-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ผู้ดู (Viewer)</span>
                </button>
              </div>
            </div>

            {/* Role Change Reason (if changing existing user's role) */}
            {isEdit && userToEdit && userToEdit.role !== role && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>เปลี่ยนบทบาทจาก "{userToEdit.role}" เป็น "{role}"</span>
                </div>
                <input
                  type="text"
                  required
                  value={roleChangeReason}
                  onChange={(e) => setRoleChangeReason(e.target.value)}
                  placeholder="ระบุเหตุผลในการเปลี่ยนบทบาท (เช่น ได้รับแต่งตั้งเป็นหัวหน้า, หมุนเวียนหน้าที่)"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Viewer Granular Permissions Config */}
            {role === 'viewer' && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>สิทธิ์การมองเห็นสำหรับ Viewer (Granular Permissions)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.viewAllJobs}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, viewAllJobs: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ดูรายการงานซ่อมทั้งหมด</span>
                  </label>

                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.canViewQuotations}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, canViewQuotations: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ดูใบเสนอราคา</span>
                  </label>

                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.canViewCustomers}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, canViewCustomers: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ดูข้อมูลลูกค้า & ผู้แจ้ง</span>
                  </label>

                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.canViewReports}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, canViewReports: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ดูรายงานและสถิติภาพรวม</span>
                  </label>

                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.canViewSellingPrices}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, canViewSellingPrices: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>แสดงยอดราคาและค่าบริการ</span>
                  </label>

                  <label className="flex items-center space-x-2 p-1.5 bg-white rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-50/30">
                    <input
                      type="checkbox"
                      checked={viewerPermissions.canViewPayments}
                      onChange={(e) =>
                        setViewerPermissions({ ...viewerPermissions, canViewPayments: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>ดูหลักฐานและการชำระเงิน</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                สถานะบัญชี / Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    status === 'active'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ใช้งาน (Active)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('suspended')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    status === 'suspended'
                      ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>ระงับการใช้</span>
                </button>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              บันทึกช่วยจำภายใน (Internal Note)
            </label>
            <textarea
              rows={2}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="บันทึกข้อความสำหรับผู้ดูแลระบบ เช่น ช่างเชี่ยวชาญด้านประปาและแอร์ หรือ ผู้ตรวจการคอนโด"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
            />
          </div>

          {/* Password Section (Only on Create) */}
          {!isEdit && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    รหัสผ่านเริ่มต้น / Temporary Password
                  </div>
                  <div className="text-[11px] text-slate-500">
                    อย่างน้อย 8 ตัวอักษร มีตัวอักษรภาษาอังกฤษและตัวเลข
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>สุ่มรหัสผ่าน</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="รหัสผ่านเริ่มต้น"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่าน"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Password Strength */}
              {password.length > 0 && passwordValidation && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">ความปลอดภัยรหัสผ่าน:</span>
                    <span
                      className={`font-bold ${
                        passwordValidation.strength === 'strong'
                          ? 'text-emerald-600'
                          : passwordValidation.strength === 'fair'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {passwordValidation.strength === 'strong'
                        ? 'ปลอดภัยสูง'
                        : passwordValidation.strength === 'fair'
                        ? 'ปานกลาง'
                        : 'ยังไม่ปลอดภัย'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordValidation.strength === 'weak'
                          ? 'w-1/3 bg-rose-500'
                          : passwordValidation.strength === 'fair'
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Force password change on first login */}
              <label className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTemporaryPassword}
                  onChange={(e) => setIsTemporaryPassword(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  บังคับให้ผู้ใช้เปลี่ยนรหัสผ่านใหม่เมื่อเข้าสู่ระบบครั้งแรก (แนะนำ)
                </span>
              </label>
            </div>
          )}

          {/* Language & Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ภาษาเริ่มต้น / Default Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('th')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 ${
                    preferredLanguage === 'th'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🇹🇭</span>
                  <span>ไทย (TH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLanguage('en')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 ${
                    preferredLanguage === 'en'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>English (EN)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                รูปโปรไฟล์ / Profile Photo
              </label>
              <div className="flex items-center space-x-2">
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shrink-0 shadow-xs"
                />
                <div className="flex space-x-1 overflow-x-auto py-1">
                  {PRESET_AVATARS.slice(0, 4).map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                        avatarUrl === url ? 'border-blue-600 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !loginIdValidation.valid || !passwordsMatch}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <span>{isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้งาน'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
