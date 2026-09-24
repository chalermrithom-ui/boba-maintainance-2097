import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  UserX,
  UserCheck,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { User } from '../types';

export type ActionType = 'suspend' | 'reactivate' | 'delete';

interface ConfirmActionModalProps {
  user: User;
  actionType: ActionType;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  user,
  actionType,
  onClose,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  const config = {
    suspend: {
      title: 'ระงับการใช้งานบัญชี',
      desc: `คุณต้องการระงับการใช้งานบัญชี "${user.name}" (@${user.loginId}) ใช่หรือไม่? ผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง`,
      confirmText: 'ยืนยันระงับบัญชี',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 text-white',
      icon: <UserX className="w-6 h-6 text-rose-600" />,
      iconBg: 'bg-rose-100',
    },
    reactivate: {
      title: 'เปิดใช้งานบัญชี',
      desc: `คุณต้องการเปิดใช้งานบัญชี "${user.name}" (@${user.loginId}) ใช่หรือไม่? ผู้ใช้จะสามารถเข้าสู่ระบบและปฏิบัติหน้าที่ได้ตามปกติ`,
      confirmText: 'ยืนยันเปิดใช้งาน',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white',
      icon: <UserCheck className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
    },
    delete: {
      title: 'ลบบัญชีผู้ใช้ (Soft Delete)',
      desc: `คุณต้องการลบบัญชี "${user.name}" (@${user.loginId}) ใช่หรือไม่? ระบบจะทำการ Soft Delete โดยเก็บประวัติงานซ่อม บันทึกกิจกรรม และใบเสนอราคาเดิมไว้เพื่อการตรวจสอบ`,
      confirmText: 'ยืนยันลบบัญชี',
      confirmColor: 'bg-red-600 hover:bg-red-700 shadow-red-500/20 text-white',
      icon: <Trash2 className="w-6 h-6 text-red-600" />,
      iconBg: 'bg-red-100',
    },
  }[actionType];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-12 h-12 ${config.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
          {config.icon}
        </div>

        <h3 className="text-lg font-bold text-slate-900 font-display">
          {config.title}
        </h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {config.desc}
        </p>

        {actionType === 'delete' && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>ข้อมูลประวัติและใบแจ้งซ่อมจะไม่สูญหาย บัญชีจะถูกเปลี่ยนสถานะเป็น deleted</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleAction}
            disabled={isSubmitting}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 ${config.confirmColor}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <span>{config.confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
