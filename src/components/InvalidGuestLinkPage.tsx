import React from 'react';
import { AlertCircle, Clock, ShieldAlert, PhoneCall, MessageSquare, ArrowLeft, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InvalidGuestLinkPageProps {
  reason: 'not_found' | 'expired' | 'deactivated' | string;
  onGoHome?: () => void;
}

export const InvalidGuestLinkPage: React.FC<InvalidGuestLinkPageProps> = ({ reason, onGoHome }) => {
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';

  const config = {
    expired: {
      icon: Clock,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleTh: 'ลิงก์การเข้าถึงหมดอายุแล้ว',
      titleEn: 'Guest Access Link Expired',
      descTh: 'ลิงก์นี้หมดอายุการใช้งานตามนโยบายความปลอดภัยของระบบ กรุณาติดต่อฝ่ายบริการลูกค้าหรือนิติบุคคลเพื่อขอรับลิงก์ใหม่',
      descEn: 'This link has expired according to system security policy. Please contact customer service or building administration to request a new link.',
    },
    deactivated: {
      icon: ShieldAlert,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconColor: 'text-rose-600',
      titleTh: 'ลิงก์นี้ถูกปิดการใช้งานชั่วคราว',
      titleEn: 'Link Deactivated',
      descTh: 'ผู้ดูแลระบบหรือเจ้าหน้าที่ได้ปิดการใช้งานลิงก์นี้ชั่วคราว หากท่านต้องการเข้าดูข้อมูลกรุณาติดต่อเจ้าหน้าที่ดูแลงานของคุณ',
      descEn: 'This link has been deactivated by the system administrator. If you require access, please contact your service coordinator.',
    },
    not_found: {
      icon: AlertCircle,
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      iconColor: 'text-slate-600',
      titleTh: 'ไม่พบข้อมูลงานตามรหัสลิงก์นี้',
      titleEn: 'Link Not Found or Invalid',
      descTh: 'รหัสโทเค็น (Token) ไม่ถูกต้อง หรือข้อมูลใบงานนี้อาจถูกยกเลิกไปแล้ว กรุณาตรวจสอบลิงก์อีกครั้ง',
      descEn: 'The security token is invalid, or the corresponding repair record may have been removed. Please verify your link URL.',
    },
  };

  const currentConfig = (config as any)[reason] || config.not_found;
  const IconComponent = currentConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center relative overflow-hidden">
        {/* Top brand accent */}
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-6">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 font-display">FixFlow</span>
        </div>

        <div className={`w-16 h-16 ${currentConfig.bg} ${currentConfig.border} border rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <IconComponent className={`w-8 h-8 ${currentConfig.iconColor}`} />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {isEn ? currentConfig.titleEn : currentConfig.titleTh}
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {isEn ? currentConfig.descEn : currentConfig.descTh}
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left mb-6 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {isEn ? 'Direct Contact Channels' : 'ช่องทางติดต่อฝ่ายบริการลูกค้า'}
          </div>
          <a
            href="tel:029876543"
            className="flex items-center space-x-3 text-sm text-slate-800 hover:text-blue-600 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">02-987-6543 (Call Center)</span>
          </a>
          <div className="flex items-center space-x-3 text-sm text-slate-800">
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>LINE Official: <span className="font-mono font-semibold text-emerald-700">@fixflow.service</span></span>
          </div>
        </div>

        <div className="space-y-2">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Return to FixFlow Portal' : 'กลับสู่หน้าหลักระบบ FixFlow'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
