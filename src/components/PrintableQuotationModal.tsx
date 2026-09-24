import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  FileText,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Quotation } from '../types';
import { CompanyService } from '../services/companyService';
import { useLanguage } from '../context/LanguageContext';

interface PrintableQuotationModalProps {
  quotation: Quotation;
  onClose: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PrintableQuotationModal: React.FC<PrintableQuotationModalProps> = ({
  quotation,
  onClose,
  showToast,
}) => {
  const { currentLang } = useLanguage();
  const isEn = currentLang === 'en';
  const company = CompanyService.getSettings();

  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleNativePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);

    try {
      // Dynamic import to be safe with SSR/browser bundles
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as unknown as () => any;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${quotation.quotationNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(printAreaRef.current).save();
      showToast('ดาวน์โหลด PDF สำเร็จ', 'PDF downloaded successfully', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to window.print
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8 shadow-2xl border border-slate-100 relative print:border-none print:shadow-none print:max-h-none print:w-full print:p-0">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 font-display">
              {isEn ? 'Official Quotation Document (A4)' : 'ใบเสนอราคามาตรฐาน A4'}
            </h2>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {quotation.quotationNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleNativePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{isEn ? 'Print' : 'พิมพ์เอกสาร'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'สร้าง PDF...' : isEn ? 'Download PDF' : 'ดาวน์โหลด PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable A4 Container */}
        <div
          ref={printAreaRef}
          className="bg-white text-slate-900 p-4 sm:p-8 space-y-6 font-sans text-xs border border-slate-200 rounded-2xl print:border-none print:p-2"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div className="space-y-1 max-w-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  FF
                </div>
                <span className="text-lg font-extrabold font-display tracking-tight text-slate-900">
                  {company.companyNameTh}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 pt-1 leading-relaxed">{company.addressTh}</div>
              <div className="text-[11px] text-slate-600">
                เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-semibold">{company.taxId}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                โทร: <span className="font-mono">{company.phone}</span> • อีเมล: {company.email}
              </div>
            </div>

            <div className="text-right space-y-1">
              <h1 className="text-2xl font-black font-display text-slate-900 uppercase tracking-tight">
                ใบเสนอราคา
              </h1>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">QUOTATION</div>
              <div className="pt-2">
                <span className="text-[11px] text-slate-500">เลขที่ / No: </span>
                <span className="font-mono font-bold text-slate-900 text-sm">{quotation.quotationNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">วันที่ / Date: </span>
                <span className="font-mono font-semibold text-slate-800">{quotation.issueDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">ใช้ได้ถึง / Valid Until: </span>
                <span className="font-mono font-semibold text-rose-700">{quotation.validUntil}</span>
              </div>
            </div>
          </div>

          {/* Customer & Job Info Box */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                ลูกค้า / Customer
              </div>
              <div className="font-bold text-slate-900 text-sm">{quotation.customerName}</div>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5">โทร: {quotation.customerPhone}</div>
              {quotation.customerAddress && (
                <div className="text-[11px] text-slate-600 mt-1">{quotation.customerAddress}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                รายละเอียดงาน / Job Details
              </div>
              <div className="font-bold text-slate-900">{quotation.title || quotation.ticketTitle || 'งานบริการตรวจเช็กและซ่อมแซม'}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                อ้างอิงใบงาน: <span className="font-mono font-bold text-blue-700">{quotation.jobNumber || quotation.ticketJobNumber || '-'}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                สถานที่: <span className="text-slate-800">{quotation.propertyName || quotation.customerAddress || '-'} {quotation.unitNumber ? `ห้อง ${quotation.unitNumber}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[140px]">รายการเสียหาย / รายการงาน</th>
                  <th className="py-2.5 px-3 min-w-[130px]">วิธีแก้ไข</th>
                  <th className="py-2.5 px-2 text-center w-14">จำนวน</th>
                  <th className="py-2.5 px-2 text-center w-14">หน่วย</th>
                  <th className="py-2.5 px-2.5 text-right w-20">ราคา/หน่วย</th>
                  <th className="py-2.5 px-2.5 text-right w-20">ส่วนลด</th>
                  <th className="py-2.5 px-3 text-right w-24">ราคารวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.items.map((item, idx) => {
                  const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  let lineDiscount = 0;
                  if (item.discountType === 'percent') {
                    lineDiscount = (lineSubtotal * (Number(item.discountValue) || 0)) / 100;
                  } else {
                    lineDiscount = Number(item.discountValue) || 0;
                  }
                  if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{item.itemNo || idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 leading-snug">{item.damageDescription}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 leading-snug">
                        {item.repairMethod || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{item.unit || 'งาน'}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono">{Number(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-rose-600">
                        {lineDiscount > 0 ? (
                          <span>
                            -{lineDiscount.toLocaleString()}
                            {item.discountType === 'percent' && (
                              <span className="text-[10px] text-slate-400 block">({item.discountValue}%)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {Number(item.total || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary & Calculations */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-4">
            <div className="flex-1 max-w-md space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>ช่องทางการชำระเงิน (Payment Method):</span>
                </div>
                <div>ธนาคาร: <strong className="text-slate-900">{company.bankName}</strong></div>
                <div>ชื่อบัญชี: <strong className="text-slate-900">{company.bankAccountName}</strong></div>
                <div>เลขที่บัญชี: <strong className="font-mono text-blue-700 font-bold">{company.bankAccountNumber}</strong></div>
                <div>PromptPay ID: <span className="font-mono font-bold text-slate-800">{company.promptPayId || company.taxId}</span></div>
              </div>

              {quotation.notes && (
                <div className="text-[11px] text-slate-600 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-800">หมายเหตุ / เงื่อนไขเพิ่มเติม:</strong> {quotation.notes}
                </div>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>รวมเป็นเงิน (Subtotal):</span>
                <span className="font-mono font-bold text-slate-800">{(quotation.subtotal || 0).toLocaleString()} ฿</span>
              </div>
              {(quotation.totalDiscount || 0) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>ส่วนลด (Discount):</span>
                  <span className="font-mono font-bold">- {(quotation.totalDiscount || 0).toLocaleString()} ฿</span>
                </div>
              )}
              {quotation.vatEnabled && (
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
                  <span className="font-mono font-bold text-slate-800">{(quotation.vatAmount || 0).toLocaleString()} ฿</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-300">
                <span>ยอดสุทธิ (Grand Total):</span>
                <span className="font-mono text-blue-700">{(quotation.grandTotal || 0).toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200 text-[11px]">
                <span>เงินมัดจำ (Deposit):</span>
                <span className="font-mono font-bold text-amber-700">
                  {(quotation.depositAmount || 0) > 0 ? `${(quotation.depositAmount || 0).toLocaleString()} ฿` : '0 ฿'}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-xs bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-emerald-900">
                <span>ยอดคงเหลือ (Remaining Balance):</span>
                <span className="font-mono font-black text-emerald-700">
                  {(quotation.remainingAmount ?? (quotation.grandTotal - (quotation.depositAmount || 0))).toLocaleString()} ฿
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Dual Signatures */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <strong>หมายเหตุและเงื่อนไข:</strong> 1. ใบเสนอราคานี้มีผลบังคับใช้ 15 วัน นับจากวันที่ออกเอกสาร 2. กำหนดชำระเงินมัดจำ 50% ก่อนเริ่มดำเนินการ และส่วนที่เหลือชำระทันทีเมื่อตรวจรับงานเรียบร้อย 3. รับประกันผลงานซ่อมแซม 90 วัน นับจากวันส่งมอบงาน
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              {/* Company Signature */}
              <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl">
                <div className="h-14 flex items-center justify-center">
                  <div className="font-serif italic font-bold text-blue-700 text-lg">FixFlow Operations</div>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold text-slate-800">ผู้มีอำนาจลงนาม / Authorized Signature</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{company.companyNameTh}</div>
                </div>
              </div>

              {/* Customer Signature */}
              <div className="text-center p-4 border border-dashed border-slate-300 rounded-xl">
                <div className="h-14 flex items-center justify-center">
                  {quotation.status === 'approved' ? (
                    <div className="flex items-center text-emerald-600 font-bold text-xs space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>อนุมัติผ่านระบบเรียบร้อย (Approved)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">ลงชื่อเพื่อยืนยันการสั่งซ่อม</span>
                  )}
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="font-bold text-slate-800">ผู้อนุมัติสั่งซ่อม / Customer Approval</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">วันที่: ____ / ____ / ________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
