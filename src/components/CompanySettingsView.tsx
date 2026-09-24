import React, { useState } from 'react';
import {
  Building2,
  Save,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Palette,
} from 'lucide-react';
import { CompanySettings, User } from '../types';
import { CompanyService } from '../services/companyService';
import { ActivityLogService } from '../services/activityLogService';
import { useLanguage } from '../context/LanguageContext';

interface CompanySettingsViewProps {
  currentUser: User;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  currentUser,
  showToast,
}) => {
  const { currentLang, t } = useLanguage();
  const isEn = currentLang === 'en';

  const [settings, setSettings] = useState<CompanySettings>(CompanyService.getSettings());
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = currentUser.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    setTimeout(() => {
      CompanyService.saveSettings(settings);

      // Audit Log
      ActivityLogService.logAction({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actionType: 'USER_UPDATED',
        targetType: 'company',
        targetId: 'company_settings',
        targetLabel: settings.companyNameTh,
        details: 'แก้ไขข้อมูลบริษัท ข้อมูลบัญชีธนาคาร และเงื่อนไขใบเสนอราคา',
      });

      setIsSaving(false);
      showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'Company settings updated successfully', 'success');
    }, 350);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>{isEn ? 'Company Profile & Settings' : 'ตั้งค่าข้อมูลบริษัทและแบรนด์'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn
              ? 'Company details, official bank accounts, PromptPay QR, and document terms.'
              : 'ข้อมูลส่วนหัวเอกสาร ใบเสนอราคา ใบเสร็จรับเงิน บัญชีธนาคาร และเงื่อนไขบริการ'}
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : isEn ? 'Save Settings' : 'บันทึกการตั้งค่า'}</span>
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isEn
              ? 'Read-only mode: Only administrators can update company and billing settings.'
              : 'โหมดดูอย่างเดียว: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขข้อมูลบริษัทได้'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-5">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{isEn ? 'Company Identity' : 'ข้อมูลนิติบุคคลและแบรนด์'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Company Name (Thai)' : 'ชื่อบริษัท / กิจการ (ภาษาไทย)'} *
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.companyNameTh}
                onChange={(e) => setSettings({ ...settings, companyNameTh: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Company Name (English)' : 'ชื่อบริษัท / กิจการ (English)'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.companyNameEn || ''}
                onChange={(e) => setSettings({ ...settings, companyNameEn: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Tax ID / Registration Number' : 'เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.taxId}
                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Brand Primary Color (HEX)' : 'สีประจำแบรนด์ (Primary Color Hex)'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  disabled={!canEdit}
                  value={settings.brandColor || '#2563eb'}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.brandColor || '#2563eb'}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono uppercase disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Office Address (Thai)' : 'ที่อยู่สำนักงานใหญ่ (ภาษาไทย)'}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={settings.addressTh}
                onChange={(e) => setSettings({ ...settings, addressTh: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Office Address (English)' : 'ที่อยู่สำนักงานใหญ่ (English)'}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={settings.addressEn || ''}
                onChange={(e) => setSettings({ ...settings, addressEn: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Official Phone' : 'เบอร์โทรศัพท์ติดต่อ'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Email' : 'อีเมลฝ่ายบริการ'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  disabled={!canEdit}
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'LINE Official ID' : 'LINE Official Account'}
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={settings.lineOfficial || ''}
                  onChange={(e) => setSettings({ ...settings, lineOfficial: e.target.value })}
                  placeholder="@fixflow.service"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono disabled:opacity-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank & Payment Accounts */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-5">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>{isEn ? 'Bank Accounts & PromptPay QR' : 'บัญชีรับชำระเงินและ QR PromptPay'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Bank Name' : 'ธนาคาร'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Account Name' : 'ชื่อบัญชี'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.bankAccountName}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Account Number' : 'เลขที่บัญชี'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.bankAccountNumber}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold disabled:opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'PromptPay ID / Phone / Tax' : 'พร้อมเพย์ ID'}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={settings.promptPayId || ''}
                onChange={(e) => setSettings({ ...settings, promptPayId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isEn ? 'Default Guest Link Validity (Days)' : 'อายุเริ่มต้นของลิงก์ลูกค้า (วัน)'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="90"
                  disabled={!canEdit}
                  value={settings.defaultLinkExpiryDays || 15}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultLinkExpiryDays: parseInt(e.target.value) || 15 })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold disabled:opacity-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Document Terms & Conditions */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-5">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>{isEn ? 'Default Quotation Terms' : 'ข้อกำหนดและเงื่อนไขเริ่มต้นในใบเสนอราคา'}</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isEn ? 'Standard Terms & Conditions' : 'เงื่อนไขการให้บริการและการรับประกันมาตรฐาน'}
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              value={
                settings.defaultTerms ||
                '1. ใบเสนอราคานี้มีผลบังคับใช้ 15 วัน นับจากวันที่ออกเอกสาร\n2. กำหนดชำระเงินมัดจำ 50% ก่อนเริ่มดำเนินการ และส่วนที่เหลือชำระทันทีเมื่อตรวจรับงานเรียบร้อย\n3. รับประกันผลงานซ่อมแซม 90 วัน นับจากวันส่งมอบงาน'
              }
              onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden disabled:opacity-75 font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        {canEdit && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึก...' : isEn ? 'Save All Changes' : 'บันทึกการเปลี่ยนแปลงทั้งหมด'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
