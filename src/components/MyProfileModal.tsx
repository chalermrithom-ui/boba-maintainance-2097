import React, { useState } from 'react';
import {
  User as UserIcon,
  X,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Globe,
  KeyRound,
} from 'lucide-react';
import { User } from '../types';
import { AuthService } from '../services/authService';
import { ActivityLogService } from '../services/activityLogService';
import { useLanguage } from '../context/LanguageContext';

interface MyProfileModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  user,
  onClose,
  onUserUpdated,
  showToast,
}) => {
  const { currentLang, setLang } = useLanguage();
  const isEn = currentLang === 'en';

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'Passwords do not match', 'error');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      const res = AuthService.changePassword(user.id, newPassword, currentPassword || undefined);

      if (!res.success) {
        setIsChangingPassword(false);
        showToast(res.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', res.errorEn, 'error');
        return;
      }

      ActivityLogService.logAction({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        actionType: 'PASSWORD_RESET',
        targetType: 'user',
        targetId: user.id,
        targetLabel: user.name,
        details: 'ผู้ใช้เปลี่ยนรหัสผ่านด้วยตนเองผ่านเมนู My Profile',
      });

      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('เปลี่ยนรหัสผ่านสำเร็จ', 'Password changed successfully', 'success');
      setActiveTab('info');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-scale-up space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">{user.name}</h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {user.role}
              </span>
              <span className="text-xs text-slate-400 font-mono">@{user.loginId}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'info' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isEn ? 'Personal Info' : 'ข้อมูลส่วนตัว'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isEn ? 'Change Password' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </div>

        {activeTab === 'info' ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">อีเมล (Email)</span>
                <span className="font-semibold text-slate-800 font-mono">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">เบอร์โทรศัพท์ (Phone)</span>
                <span className="font-semibold text-slate-800 font-mono">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">LINE ID</span>
                <span className="font-semibold text-emerald-700 font-mono">{user.lineId || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">สถานะบัญชี</span>
                <span className="inline-flex items-center text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {user.status === 'active' ? 'Active (ใช้งานปกติ)' : 'Suspended'}
                </span>
              </div>
            </div>

            {/* Language Preference */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800">{isEn ? 'Language' : 'ภาษาแสดงผล'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setLang('th')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentLang === 'th' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ไทย
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentLang === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? 'Close' : 'ปิด'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEn ? 'Current Password' : 'รหัสผ่านปัจจุบัน (หากมี)'}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="เช่น 123456 หรือรหัสผ่านปัจจุบัน"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEn ? 'New Password' : 'รหัสผ่านใหม่'} *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEn ? 'Confirm New Password' : 'ยืนยันรหัสผ่านใหม่อีกครั้ง'} *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isChangingPassword ? 'กำลังบันทึก...' : isEn ? 'Update Password' : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
