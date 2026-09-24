import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Edit,
  Send,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Building,
  User,
  Phone,
  Calendar,
  Clock,
  FileText,
  Wrench,
  HelpCircle,
  XCircle,
  Share2,
} from 'lucide-react';
import {
  Quotation,
  QUOTATION_STATUS_CONFIG,
  User as UserType,
} from '../types';
import { QuotationService } from '../services/quotationService';
import { ShareLinkModal } from './ShareLinkModal';

interface QuotationDetailModalProps {
  quotation: Quotation;
  currentUser: UserType;
  onClose: () => void;
  onEdit: (quotation: Quotation) => void;
  onQuotationUpdated: (updated: Quotation) => void;
  onScheduleJobFromQuotation?: (quotation: Quotation) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  currentUser,
  onClose,
  onEdit,
  onQuotationUpdated,
  onScheduleJobFromQuotation,
  showToast,
}) => {
  // Approval dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNote, setApprovalNote] = useState('ยอมรับราคาและเงื่อนไขตามใบเสนอราคานี้ พร้อมให้ช่างเข้าดำเนินการ');

  // Revision request dialog state
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Customer share link modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // View tabs: "ใบเสนอราคา" (Quotation Doc) or "ประวัติการแก้ไข" (Version History)
  const [activeTab, setActiveTab] = useState<'document' | 'history'>('document');

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    QuotationService.exportQuotationToCsv(quotation);
    showToast('ดาวน์โหลด CSV สำเร็จ', `บันทึกไฟล์ Quotation_${quotation.quotationNumber}.csv แล้ว`, 'success');
  };

  // Duplicate / Make new revision
  const handleDuplicate = () => {
    try {
      const copy = QuotationService.duplicateQuotation(quotation.id, currentUser.name);
      onQuotationUpdated(copy);
      showToast('ทำสำเนาใบเสนอราคาสำเร็จ', `สร้างใบเสนอราคาใหม่เลขที่ ${copy.quotationNumber}`, 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการทำสำเนา', undefined, 'error');
    }
  };

  // Send for approval
  const handleSendToCustomer = () => {
    try {
      const updated = QuotationService.updateQuotation(
        quotation.id,
        { status: 'pending_approval' },
        currentUser.name,
        'ส่งใบเสนอราคาให้ลูกค้าพิจารณา'
      );
      onQuotationUpdated(updated);
      showToast('ส่งใบเสนอราคาแล้ว', 'สถานะเปลี่ยนเป็น "รออนุมัติ"', 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด', undefined, 'error');
    }
  };

  // Confirm Approval
  const handleConfirmApproval = () => {
    try {
      const updated = QuotationService.approveQuotation(
        quotation.id,
        currentUser.name,
        approvalNote.trim()
      );
      onQuotationUpdated(updated);
      setShowApprovalDialog(false);
      showToast('อนุมัติใบเสนอราคาสำเร็จ', 'ขอบคุณที่ยอมรับข้อเสนอราคา', 'success');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการอนุมัติ', undefined, 'error');
    }
  };

  // Confirm Revision Request
  const handleConfirmRevision = () => {
    if (!revisionNote.trim()) {
      showToast('กรุณาระบุรายละเอียดที่ต้องการให้แก้ไข', undefined, 'error');
      return;
    }
    try {
      const updated = QuotationService.requestRevision(
        quotation.id,
        revisionNote.trim(),
        currentUser.name
      );
      onQuotationUpdated(updated);
      setShowRevisionDialog(false);
      showToast('ส่งคำขอแก้ไขแล้ว', 'ช่างและผู้ดูแลระบบจะได้รับแจ้งเพื่อปรับปรุงราคา', 'info');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด', undefined, 'error');
    }
  };

  // Confirm Rejection
  const handleConfirmReject = () => {
    try {
      const updated = QuotationService.rejectQuotation(
        quotation.id,
        rejectReason.trim() || 'ลูกค้าไม่อนุมัติราคา',
        currentUser.name
      );
      onQuotationUpdated(updated);
      setShowRejectDialog(false);
      showToast('บันทึกการไม่อนุมัติแล้ว', undefined, 'info');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด', undefined, 'error');
    }
  };

  const statusMeta = QUOTATION_STATUS_CONFIG[quotation.status] || QUOTATION_STATUS_CONFIG.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 gap-3">
          <div className="flex items-center space-x-2">
            <div className="flex p-1 bg-slate-200/80 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'document' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                เอกสารใบเสนอราคา
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'history' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ประวัติเวอร์ชัน ({(quotation.versionHistory || []).length})
              </button>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-xl border flex items-center space-x-1.5 ${statusMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusMeta.dotColor}`}></span>
              <span>{statusMeta.label}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              title="พิมพ์เอกสารหรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              title="ดาวน์โหลดไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              title="ทำสำเนาเพื่อแก้ไขเป็นเวอร์ชันใหม่"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">ทำสำเนา</span>
            </button>

            {quotation.status !== 'approved' && (
              <button
                onClick={() => onEdit(quotation)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                title="สร้างลิงก์สำหรับส่งให้ลูกค้าตรวจสอบและอนุมัติ"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">แชร์ลิงก์ให้ลูกค้า</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:bg-white print:p-0">
          {activeTab === 'document' ? (
            /* ============================================================== */
            /* FORMAL PAPER QUOTATION DOCUMENT (A4 PRINTABLE)                 */
            /* ============================================================== */
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 space-y-6 max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow">
                      F
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                      FixFlow
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold">
                      Home Services
                    </span>
                  </div>
                  <h2 className="text-xs font-bold text-slate-700 mt-1">
                    {quotation.serviceProvider || 'บริษัท ฟิกซ์โฟลว์ โฮม เซอร์วิสเซส จำกัด'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    บริการช่างซ่อมบำรุงบ้านและคอนโดมิเนียมครบวงจร • โทร: {quotation.serviceProviderPhone || '089-111-2222'}
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                    ใบเสนอราคา
                  </h1>
                  <span className="text-xs font-mono font-bold text-blue-700 block">
                    QUOTATION
                  </span>
                  <div className="font-mono text-sm font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-xl inline-block border border-slate-200">
                    {quotation.quotationNumber}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${statusMeta.badgeClass}`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">สถานะ: {statusMeta.label}</span>
                  <span className="text-[11px] opacity-85 hidden sm:inline">
                    — {statusMeta.description}
                  </span>
                </div>

                {quotation.approvedBy && (
                  <div className="text-[11px] font-semibold text-emerald-900">
                    อนุมัติโดย: {quotation.approvedBy} ({quotation.approvedAt})
                  </div>
                )}
              </div>

              {/* Meta Details: Customer & Job Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ข้อมูลลูกค้า / สถานที่ซ่อม
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{quotation.customerName}</div>
                  <div className="text-slate-600 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quotation.customerPhone}</span>
                  </div>
                  <div className="text-slate-600 flex items-start space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {quotation.propertyName}
                      {quotation.building ? ` ${quotation.building}` : ''}
                      {quotation.floor ? ` ${quotation.floor}` : ''}
                      {quotation.unitNumber ? ` ห้อง ${quotation.unitNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ข้อมูลเอกสารและงานซ่อม
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">อ้างอิงใบแจ้งซ่อม:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {quotation.ticketJobNumber || quotation.ticketId || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">วันที่ออกเอกสาร:</span>
                    <span className="font-bold text-slate-800">{quotation.issueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">เสนอราคามีผลถึง:</span>
                    <span className="font-bold text-rose-600">{quotation.validUntil}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">ฉบับปรับปรุง (Revision):</span>
                    <span className="font-bold text-slate-700">Rev. {quotation.revisionVersion || 1}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-10">ลำดับ</th>
                      <th className="p-2.5">รายการเสียหาย / รายการงาน</th>
                      <th className="p-2.5">วิธีแก้ไข</th>
                      <th className="p-2.5 text-center w-14">จำนวน</th>
                      <th className="p-2.5 text-center w-14">หน่วย</th>
                      <th className="p-2.5 text-right w-24">ราคาต่อหน่วย</th>
                      <th className="p-2.5 text-center w-20">ส่วนลด</th>
                      <th className="p-2.5 text-right w-24">ราคารวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotation.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-bold text-slate-400">
                          {item.itemNo}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {item.damageDescription}
                        </td>
                        <td className="p-2.5 text-slate-600 leading-relaxed">
                          {item.repairMethod}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-center text-slate-600">
                          {item.unit}
                        </td>
                        <td className="p-2.5 text-right text-slate-700">
                          {QuotationService.formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-2.5 text-center text-rose-600 font-medium">
                          {item.discountValue > 0
                            ? item.discountType === 'percent'
                              ? `${item.discountValue}%`
                              : QuotationService.formatCurrency(item.discountValue)
                            : '-'}
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {QuotationService.formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculation Box */}
              <div className="flex flex-col sm:flex-row justify-end">
                <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>รวมค่าสินค้า/ค่าแรงก่อนส่วนลด:</span>
                    <span className="font-bold text-slate-900">
                      {QuotationService.formatCurrency(quotation.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>ส่วนลดรวม:</span>
                    <span className="font-bold text-rose-600">
                      - {QuotationService.formatCurrency(quotation.totalDiscount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
                    <span>ยอดหลังหักส่วนลด:</span>
                    <span className="font-bold text-slate-900">
                      {QuotationService.formatCurrency(
                        quotation.subtotal - quotation.totalDiscount
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      ภาษีมูลค่าเพิ่ม VAT {quotation.vatEnabled ? `${quotation.vatRate}%` : '(ยกเว้น)'}:
                    </span>
                    <span className="font-bold text-slate-900">
                      {QuotationService.formatCurrency(quotation.vatAmount)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t-2 border-slate-900">
                    <span className="text-sm font-black text-slate-900 font-display">
                      ยอดสุทธิ (Grand Total):
                    </span>
                    <span className="text-lg font-black text-blue-700 font-display">
                      {QuotationService.formatCurrency(quotation.grandTotal)}
                    </span>
                  </div>

                  {quotation.depositAmount > 0 && (
                    <>
                      <div className="flex items-center justify-between text-amber-700 pt-1">
                        <span>เงินมัดจำ:</span>
                        <span className="font-bold">
                          {QuotationService.formatCurrency(quotation.depositAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-800 font-black pt-1 border-t border-slate-200">
                        <span>ยอดคงเหลือที่ต้องชำระ:</span>
                        <span>{QuotationService.formatCurrency(quotation.remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Terms & Conditions Box */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  หมายเหตุและเงื่อนไขการบริการ
                </div>
                {quotation.notes && <p>• <strong>หมายเหตุ:</strong> {quotation.notes}</p>}
                {quotation.paymentTerms && (
                  <p>• <strong>เงื่อนไขการชำระเงิน:</strong> {quotation.paymentTerms}</p>
                )}
                {quotation.warrantyTerms && (
                  <p>• <strong>การรับประกัน:</strong> {quotation.warrantyTerms}</p>
                )}
              </div>

              {/* Signature Blocks */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-8">
                  <p className="text-slate-500 font-medium">ผู้เสนอราคา / ช่างผู้ให้บริการ</p>
                  <div className="border-b border-slate-400 mx-8"></div>
                  <div>
                    <p className="font-bold text-slate-800">{quotation.serviceProvider || 'ช่างผู้รับผิดชอบ'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">วันที่: {quotation.issueDate}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-slate-500 font-medium">ผู้รับใบเสนอราคา / ลูกค้าผู้อนุมัติ</p>
                  <div className="border-b border-slate-400 mx-8"></div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {quotation.approvedBy || quotation.customerName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      วันที่: {quotation.approvedAt ? quotation.approvedAt.slice(0, 10) : '____ / ____ / ________'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* VERSION HISTORY & AUDIT LOG TAB                                */
            /* ============================================================== */
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ประวัติการแก้ไขและบันทึกเหตุการณ์ (Version Logs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกการส่ง อนุมัติ ขอแก้ไข หรือทำสำเนาใบเสนอราคา
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(quotation.versionHistory || []).map((log, index) => (
                  <div key={log.id || index} className="flex space-x-3 text-xs">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1"></span>
                      {index < (quotation.versionHistory || []).length - 1 && (
                        <span className="w-0.5 flex-1 bg-slate-200 my-1"></span>
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                      <span className="text-[10px] text-slate-400">ดำเนินการโดย: {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Workflow Action Bar (Hidden in print) */}
        <div className="no-print px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            ยอดสุทธิ: <strong className="text-slate-900 text-sm">{QuotationService.formatCurrency(quotation.grandTotal)}</strong>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {/* Draft State: Admin/Tech can send to customer */}
            {quotation.status === 'draft' && (
              <button
                onClick={handleSendToCustomer}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งขออนุมัติจากลูกค้า</span>
              </button>
            )}

            {/* Pending Approval / Revision Requested: Customer / Admin actions */}
            {(quotation.status === 'pending_approval' || quotation.status === 'revision_requested') && (
              currentUser.role === 'technician' ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  อยู่ระหว่างรอลูกค้าหรือผู้ดูแลระบบพิจารณาอนุมัติ (ช่างไม่สามารถอนุมัติแทนลูกค้าได้)
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                  >
                    ไม่อนุมัติ
                  </button>
                  <button
                    onClick={() => setShowRevisionDialog(true)}
                    className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                  >
                    ขอแก้ไข / สอบถามเพิ่มเติม
                  </button>
                  <button
                    onClick={() => setShowApprovalDialog(true)}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติราคา</span>
                  </button>
                </>
              )
            )}

            {/* Approved State: Quick button to schedule or link to job */}
            {quotation.status === 'approved' && onScheduleJobFromQuotation && (
              <button
                onClick={() => onScheduleJobFromQuotation(quotation)}
                className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Wrench className="w-4 h-4" />
                <span>กำหนดวันนัดหมายช่างเข้าซ่อม</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Approval */}
      {showApprovalDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">ยืนยันการอนุมัติใบเสนอราคา</h3>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold leading-relaxed">
              “ข้าพเจ้ายอมรับราคาและเงื่อนไขตามใบเสนอราคานี้”
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p>
                เลขที่ใบเสนอราคา: <strong>{quotation.quotationNumber}</strong>
              </p>
              <p>
                ยอดสุทธิที่ต้องชำระ: <strong className="text-blue-700">{QuotationService.formatCurrency(quotation.grandTotal)}</strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี):
              </label>
              <input
                type="text"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowApprovalDialog(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                ยืนยันการอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Request Revision */}
      {showRevisionDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-orange-600">
              <HelpCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">ขอแก้ไข / สอบถามเพิ่มเติม</h3>
            </div>

            <p className="text-xs text-slate-500">
              ระบุรายการที่ต้องการให้ช่างหรือแอดมินพิจารณาปรับปรุงราคาหรือขอบเขตงาน
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                รายละเอียดที่ต้องการแก้ไข *
              </label>
              <textarea
                rows={3}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="เช่น ขอลดค่าแรง หรือต้องการเปลี่ยนยี่ห้ออะไหล่..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowRevisionDialog(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-orange-600/20"
              >
                ส่งคำขอแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reject */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">ไม่อนุมัติใบเสนอราคา</h3>
            </div>

            <p className="text-xs text-slate-500">
              คุณต้องการปฏิเสธใบเสนอราคานี้หรือไม่
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                เหตุผล (ถ้ามี):
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="เช่น ราคาเกินงบประมาณ หรือตัดสินใจไม่ซ่อม"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Share Link Modal */}
      {showShareModal && (
        <ShareLinkModal
          targetType="quotation"
          targetId={quotation.id}
          targetTitle={`ใบเสนอราคา ${quotation.quotationNumber} (${quotation.customerName})`}
          currentUser={currentUser}
          onClose={() => setShowShareModal(false)}
          onOpenPreview={(token) => {
            window.open(`#/guest/quotation/${token}`, '_blank');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
