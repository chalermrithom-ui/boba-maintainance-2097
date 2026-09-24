import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Building2,
  KeyRound,
  X,
  UserCheck,
  UserX,
  Shield,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
  onOpenGuestMode?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel,
  onOpenGuestMode,
}) => {
  const [language, setLanguage] = useState<'th' | 'en'>('th');
  const isEn = language === 'en';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    const remembered = AuthService.getRememberedIdentifier();
    if (remembered) {
      setIdentifier(remembered);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = AuthService.login(identifier, password, rememberMe);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          isEn
            ? result.errorMessageEn || result.errorMessage || 'Login failed'
            : result.errorMessage || 'เข้าสู่ระบบไม่สำเร็จ'
        );
      }
    }, 350);
  };

  const handleQuickLogin = (idOrEmail: string, pass = '123456') => {
    setIdentifier(idOrEmail);
    setPassword(pass);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = AuthService.login(idOrEmail, pass, rememberMe);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          isEn
            ? result.errorMessageEn || result.errorMessage || 'Login failed'
            : result.errorMessage || 'เข้าสู่ระบบไม่สำเร็จ'
        );
      }
    }, 300);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AuthService.requestPasswordReset(forgotEmail);
    setForgotStatus(res);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => setLanguage(isEn ? 'th' : 'en')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-blue-300" />
          <span>{isEn ? 'ไทย' : 'English'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-4 ring-white/10 mb-3">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight font-display">FixFlow</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 text-center max-w-sm">
            {isEn
              ? 'Maintenance & Repair Operations Platform'
              : 'ระบบบริหารจัดการงานช่างซ่อมบ้านและคอนโด'}
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {isEn ? 'Sign In' : 'เข้าสู่ระบบ'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'For Administrators and Field Technicians'
                : 'สำหรับผู้ดูแลระบบ (Admin) และช่างเทคนิค (Technician)'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isEn ? 'Login ID or Email' : 'Login ID หรืออีเมล'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isEn ? 'admin.fixflow or admin@company.com' : 'admin.fixflow หรือ admin@company.com'}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isEn
                  ? 'Accepts both your unique Login ID or registered email'
                  : 'รองรับทั้ง Login ID และอีเมลที่ลงทะเบียนไว้'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Password' : 'รหัสผ่าน'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(identifier);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                >
                  {isEn ? 'Forgot Password?' : 'ลืมรหัสผ่าน?'}
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 select-none">
                  {isEn ? 'Remember me' : 'จดจำการเข้าสู่ระบบ'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEn ? 'Verifying...' : 'กำลังตรวจสอบ...'}</span>
                </>
              ) : (
                <>
                  <span>{isEn ? 'Sign In' : 'เข้าสู่ระบบ'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Test Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isEn ? 'Demo Accounts (Phase 1)' : 'บัญชีทดสอบระบบ (Phase 1 Mock Data)'}
              </span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono font-semibold">
                PW: 12345678
              </span>
            </div>

            {/* Role Category Tabs / Grids */}
            <div className="space-y-2 text-xs">
              {/* Admins */}
              <div>
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  👑 {isEn ? 'Admin (2 accounts - Full Access)' : 'Admin (2 บัญชี - สิทธิ์ดูแลระบบทั้งหมด)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@fixflow.local', '12345678')}
                    className="p-2 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-left transition-all flex items-center space-x-2 text-blue-950 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      A1
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">คุณแอดมิน</div>
                      <div className="text-[10px] text-blue-700 font-mono truncate">admin@fixflow.local</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('manager@fixflow.local', '12345678')}
                    className="p-2 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-left transition-all flex items-center space-x-2 text-blue-950 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      A2
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">ผู้ดูแลสำรอง</div>
                      <div className="text-[10px] text-blue-700 font-mono truncate">manager@fixflow.local</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Technicians */}
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  🔧 {isEn ? 'Technician (2 accounts - Assigned Jobs Only)' : 'Technician (2 บัญชี - ดูเฉพาะงานที่รับมอบหมาย)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('somchai.tech', '12345678')}
                    className="p-2 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 rounded-xl text-left transition-all flex items-center space-x-2 text-amber-950 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      T1
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">สมชาย ช่างแอร์</div>
                      <div className="text-[10px] text-amber-700 font-mono truncate">somchai.tech</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('wichai.tech', '12345678')}
                    className="p-2 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80 rounded-xl text-left transition-all flex items-center space-x-2 text-amber-950 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      T2
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">วิชัย ช่างประปา</div>
                      <div className="text-[10px] text-amber-700 font-mono truncate">wichai.tech</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Viewers */}
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  👁️ {isEn ? 'Viewer (2 accounts - Read-Only Access)' : 'Viewer (2 บัญชี - ผู้ตรวจดู อ่านอย่างเดียว)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('viewer@fixflow.local', '12345678')}
                    className="p-2 bg-slate-100 hover:bg-slate-200/90 border border-slate-200 rounded-xl text-left transition-all flex items-center space-x-2 text-slate-900 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      V1
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">ผู้ดูบัญชี</div>
                      <div className="text-[10px] text-slate-600 font-mono truncate">viewer@fixflow.local</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('partner@fixflow.local', '12345678')}
                    className="p-2 bg-slate-100 hover:bg-slate-200/90 border border-slate-200 rounded-xl text-left transition-all flex items-center space-x-2 text-slate-900 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      V2
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">หุ้นส่วนกิจการ</div>
                      <div className="text-[10px] text-slate-600 font-mono truncate">partner@fixflow.local</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {onCancel && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                {isEn ? 'Back to main view' : 'กลับไปหน้าหลัก'}
              </button>
            </div>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {isEn
              ? 'Decoupled auth architecture ready for Firebase Authentication & Firestore'
              : 'สถาปัตยกรรมพร้อมต่อยอดเชื่อมโยง Firebase Authentication & Firestore'}
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStatus(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 font-display">
              {isEn ? 'Forgot Password' : 'ลืมรหัสผ่าน'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              {isEn
                ? 'Enter your Login ID or email. The administrator can reset a temporary password for your account.'
                : 'ระบุ Login ID หรืออีเมลของคุณ ผู้ดูแลระบบ (Admin) สามารถออกรหัสผ่านชั่วคราวให้คุณได้ผ่านระบบจัดการผู้ใช้งาน'}
            </p>

            {forgotStatus ? (
              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed mb-4 ${
                  forgotStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {forgotStatus.message}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Login ID or Email' : 'Login ID หรืออีเมล'}
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="เช่น admin.fixflow หรือ thana@company.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isEn ? 'Request Password Reset' : 'ส่งคำขอกู้คืนรหัสผ่าน'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotStatus(null);
              }}
              className="w-full mt-2 py-2 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              {isEn ? 'Close' : 'ปิดหน้าต่าง'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
