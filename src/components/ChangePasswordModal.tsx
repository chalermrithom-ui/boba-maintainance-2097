import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  X,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface ChangePasswordModalProps {
  user: User;
  isForcedFirstTime?: boolean;
  onSuccess: (updatedUser: User) => void;
  onClose?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  isForcedFirstTime = false,
  onSuccess,
  onClose,
}) => {
  const isEn = user.preferredLanguage === 'en';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate live password rules
  const validation = AuthService.validatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isForcedFirstTime && !oldPassword) {
      setErrorMsg(isEn ? 'Please enter current password' : 'กรุณาระบุรหัสผ่านปัจจุบัน');
      return;
    }

    if (!validation.valid) {
      setErrorMsg(isEn ? validation.errorEn || validation.error : validation.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(isEn ? 'Passwords do not match' : 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = AuthService.changePassword(
        user.id,
        newPassword,
        isForcedFirstTime ? undefined : oldPassword
      );

      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(isEn ? res.errorEn || res.error : res.error);
      } else {
        const refreshed = AuthService.getUserById(user.id);
        if (refreshed) {
          onSuccess(refreshed);
        }
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scale-up">
        {/* Close button only if not forced */}
        {!isForcedFirstTime && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isForcedFirstTime
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {isForcedFirstTime ? <ShieldAlert className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              {isForcedFirstTime
                ? isEn
                  ? 'First-Time Password Setup'
                  : 'ตั้งรหัสผ่านใหม่ในการเข้าใช้งานครั้งแรก'
                : isEn
                ? 'Change Password'
                : 'เปลี่ยนรหัสผ่าน'}
            </h2>
            <p className="text-xs text-slate-500">
              {isForcedFirstTime
                ? isEn
                  ? 'You must set a secure permanent password to continue.'
                  : 'เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งานระบบ'
                : isEn
                ? `Account: ${user.loginId}`
                : `บัญชีผู้ใช้: ${user.loginId}`}
            </p>
          </div>
        </div>

        {/* Warning Banner for First-Time login */}
        {isForcedFirstTime && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {isEn
                ? 'Admin generated a temporary password for this account. Please create your personal password now.'
                : 'ผู้ดูแลระบบได้สร้างรหัสผ่านชั่วคราวให้คุณ กรุณากำหนดรหัสผ่านใหม่เพื่อความปลอดภัยในการเข้าใช้งาน'}
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password (if not forced) */}
          {!isForcedFirstTime && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Current Password' : 'รหัสผ่านปัจจุบัน'}
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isEn ? 'New Password' : 'รหัสผ่านใหม่'}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{isEn ? 'Security Level:' : 'ระดับความปลอดภัย:'}</span>
                  <span
                    className={`font-bold ${
                      validation.strength === 'strong'
                        ? 'text-emerald-600'
                        : validation.strength === 'fair'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {validation.strength === 'strong'
                      ? isEn
                        ? 'Strong'
                        : 'ปลอดภัยสูง'
                      : validation.strength === 'fair'
                      ? isEn
                        ? 'Moderate'
                        : 'ปานกลาง'
                      : isEn
                      ? 'Weak'
                      : 'ยังไม่ปลอดภัย'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      validation.strength === 'weak'
                        ? 'w-1/3 bg-rose-500'
                        : validation.strength === 'fair'
                        ? 'w-2/3 bg-amber-500'
                        : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Criteria checklist */}
            <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    validation.criteria.minLength ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span>{isEn ? 'At least 8 characters' : 'ความยาวอย่างน้อย 8 ตัวอักษร'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    validation.criteria.hasLetter ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span>{isEn ? 'At least 1 letter (A-Z, a-z)' : 'มีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    validation.criteria.hasNumber ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span>{isEn ? 'At least 1 digit (0-9)' : 'มีตัวเลขอารบิกอย่างน้อย 1 ตัว (0-9)'}</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isEn ? 'Confirm New Password' : 'ยืนยันรหัสผ่านใหม่'}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`text-[11px] mt-1 font-medium ${
                  passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {passwordsMatch
                  ? isEn
                    ? '✓ Passwords match'
                    : '✓ รหัสผ่านตรงกันเรียบร้อย'
                  : isEn
                  ? '✗ Passwords do not match'
                  : '✗ รหัสผ่านไม่ตรงกัน'}
              </p>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !validation.valid || !passwordsMatch}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEn ? 'Updating...' : 'กำลังบันทึกรหัสผ่าน...'}</span>
                </>
              ) : (
                <>
                  <span>{isEn ? 'Save New Password' : 'บันทึกรหัสผ่านใหม่'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
