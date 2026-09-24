import { CompanySettings } from '../types';

const COMPANY_SETTINGS_KEY = 'fixflow_company_settings_v1';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 'company_default',
  logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=120&q=80',
  companyNameTh: 'บริษัท ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส จำกัด',
  companyNameEn: 'FixFlow Home Services Co., Ltd.',
  displayBrandName: 'FixFlow (ฟิกซ์โฟลว์)',
  taxId: '0105565012345',
  addressTh: '88/12 อาคารไชโย ทาวเวอร์ ชั้น 10 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  addressEn: '88/12 Chaiyo Tower, 10th Fl., Sukhumvit Rd., Khlong Toei Nuea, Watthana, Bangkok 10110',
  phone: '02-987-6543, 089-123-4567',
  email: 'contact@fixflowservice.com',
  website: 'https://fixflow.example.com',
  lineOfficial: '@fixflow.service',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankAccountName: 'บจก. ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส',
  bankAccountNumber: '789-2-34567-8',
  promptPayId: '0105565012345',
  paymentQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=00020101021129370016A000000677010111011300668912345675802TH53037646304A1B2',
  defaultGuestLinkExpiryDays: 30,
  brandPrimaryColor: '#2563eb',
  defaultQuotationNotesTh: 'ราคารวมค่าแรงและค่าอะไหล่ตามรายการที่ระบุข้างต้นเรียบร้อยแล้ว หากพบจุดชำรุดเพิ่มเติมระหว่างดำเนินการ ช่างจะแจ้งขออนุมัติก่อนทำทุกครั้ง',
  defaultQuotationNotesEn: 'Prices include listed labor and replacement parts. Should additional defects be uncovered during repair, technician will seek prior authorization before proceeding.',
  defaultPaymentTermsTh: 'ชำระเมื่อส่งมอบงานและทดสอบระบบการทำงานเรียบร้อยผ่านการโอนหรือสแกน QR PromptPay',
  defaultPaymentTermsEn: 'Payable upon final handover and satisfactory functional verification via bank transfer or PromptPay QR.',
  defaultWarrantyTermsTh: 'รับประกันงานซ่อมแซมและอะไหล่เป็นระยะเวลา 90 วัน นับจากวันตรวจรับงาน (ไม่ครอบคลุมกรณีอุบัติเหตุหรือภัยธรรมชาติ)',
  defaultWarrantyTermsEn: '90-day warranty coverage for repair workmanship and replaced parts from date of acceptance.',
  documentFooterTh: 'ขอบพระคุณที่ไว้วางใจให้ FixFlow ดูแลบ้านและคอนโดของคุณ',
  documentFooterEn: 'Thank you for choosing FixFlow Home Services.',
  updatedAt: '2026-09-20T08:00:00Z',
};

export const CompanyService = {
  getSettings(): CompanySettings {
    try {
      const stored = localStorage.getItem(COMPANY_SETTINGS_KEY);
      if (!stored) {
        localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
        return DEFAULT_COMPANY_SETTINGS;
      }
      return JSON.parse(stored) as CompanySettings;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  },

  updateSettings(settings: Partial<CompanySettings>): CompanySettings {
    const current = this.getSettings();
    const updated: CompanySettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },

  saveSettings(settings: Partial<CompanySettings>): CompanySettings {
    return this.updateSettings(settings);
  },
};
