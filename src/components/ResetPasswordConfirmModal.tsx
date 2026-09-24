import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Shuffle,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface ResetPasswordConfirmModalProps {
  user: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
  showToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResetPasswordConfirmModal: React.FC<ResetPasswordConfirmModalProps> = ({
  user,
  onClose,
  onSuccess,
  showToast,
}) => {
  const [tempPassword, setTempPassword] = useState(() => AuthService.generateTemporaryPassword());
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    showToast?.('คัดลอกรหัสผ่านแล้ว', tempPassword, 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmReset = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      const res = AuthService.resetPassword(user.id, tempPassword);
      setIsSubmitting(false);

      if (res.success) {
        setIsSuccess(true);
        const refreshed = AuthService.getUserById(user.id);
        if (refreshed) {
          onSuccess(refreshed);
        }
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 font-display">
          รีเซ็ตรหัสผ่านผู้ใช้งาน
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          บัญชี: <span className="font-semibold text-slate-800">{user.name}</span> (@{user.loginId})
        </p>

        {!isSuccess ? (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>การบังคับเปลี่ยนรหัสผ่านครั้งแรก</span>
              </div>
              <p className="leading-relaxed">
                ระบบจะตั้งรหัสผ่านชั่วคราวให้ผู้ใช้ และเมื่อผู้ใช้เข้าสู่ระบบด้วยรหัสผ่านนี้ ระบบจะบังคับให้ตั้งรหัสผ่านใหม่ทันที
              </p>
            </div>

            {/* Generated Temporary Password Display */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>รหัสผ่านชั่วคราวใหม่</span>
                <button
                  type="button"
                  onClick={() => setTempPassword(AuthService.generateTemporaryPassword())}
                  className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-[11px]"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>สุ่มใหม่</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-blue-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center space-x-1.5 text-xs font-semibold shrink-0 transition-colors"
                  title="คัดลอกรหัสผ่าน"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isSubmitting || !tempPassword.trim()}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>ยืนยันการรีเซ็ตรหัสผ่าน</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-emerald-900">
                รีเซ็ตรหัสผ่านเรียบร้อยแล้ว
              </div>
              <p className="text-xs text-emerald-700">
                ส่งมอบรหัสผ่านชั่วคราวนี้ให้แก่ผู้ใช้งาน เพื่อใช้เข้าสู่ระบบและตั้งรหัสผ่านใหม่
              </p>

              <div className="p-3 bg-white rounded-xl border border-emerald-300 font-mono font-extrabold text-base text-slate-800 tracking-wider flex items-center justify-center space-x-3 mt-2">
                <span>{tempPassword}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              เสร็จสิ้นและปิดหน้าต่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
