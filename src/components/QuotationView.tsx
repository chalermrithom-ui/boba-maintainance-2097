import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  Building,
  User,
  ExternalLink,
  Download,
} from 'lucide-react';
import {
  Quotation,
  QuotationStatus,
  QUOTATION_STATUS_CONFIG,
  User as UserType,
} from '../types';
import { QuotationService } from '../services/quotationService';
import { QuotationDetailModal } from './QuotationDetailModal';
import { QuotationFormModal } from './QuotationFormModal';

interface QuotationViewProps {
  currentUser: UserType;
  onNavigateTicket?: (ticketId: string) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuotationView: React.FC<QuotationViewProps> = ({
  currentUser,
  onNavigateTicket,
  showToast,
}) => {
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    QuotationService.getQuotations()
  );

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reloadData = () => {
    setQuotations(QuotationService.getQuotations());
  };

  // KPIs
  const totalGrand = quotations.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
  const approvedQuotes = quotations.filter((q) => q.status === 'approved');
  const pendingQuotes = quotations.filter((q) => q.status === 'pending_approval');
  const approvedGrand = approvedQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);

  // Filtered List
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNumber = q.quotationNumber.toLowerCase().includes(query);
        const matchCustomer = q.customerName.toLowerCase().includes(query);
        const matchTicket = (q.ticketJobNumber || '').toLowerCase().includes(query);
        const matchProperty = q.propertyName.toLowerCase().includes(query);
        const matchUnit = (q.unitNumber || '').toLowerCase().includes(query);
        if (!matchNumber && !matchCustomer && !matchTicket && !matchProperty && !matchUnit) {
          return false;
        }
      }
      return true;
    });
  }, [quotations, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>ระบบใบเสนอราคา & ประมาณการซ่อม</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการรายการเสนอราคา อนุมัติงบประมาณ คำนวณภาษี VAT 7% และติดตามสถานะแบบเรียลไทม์
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างใบเสนอราคาใหม่</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ใบเสนอราคาทั้งหมด</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            {quotations.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">มูลค่ารวม {QuotationService.formatCurrency(totalGrand)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">รอการอนุมัติ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-display">
            {pendingQuotes.length}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">รอการตอบรับจากลูกค้า</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">อนุมัติแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-display">
            {approvedQuotes.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            ยอดเงินที่อนุมัติ {QuotationService.formatCurrency(approvedGrand)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">อัตราการอนุมัติ</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 font-display">
            {quotations.length > 0
              ? `${Math.round((approvedQuotes.length / quotations.length) * 100)}%`
              : '0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Conversion rate</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาเลขที่ QT-, เลขที่ใบงาน JOB-, ชื่อลูกค้า หรือเลขห้อง..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({quotations.length})
          </button>
          {(Object.keys(QUOTATION_STATUS_CONFIG) as QuotationStatus[]).map((st) => {
            const count = quotations.filter((q) => q.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {QUOTATION_STATUS_CONFIG[st].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">เลขที่ใบเสนอราคา</th>
                <th className="p-3.5">อ้างอิงใบงาน</th>
                <th className="p-3.5">ลูกค้า & สถานที่</th>
                <th className="p-3.5 text-center">วันที่ออก / มีผลถึง</th>
                <th className="p-3.5 text-center">จำนวนรายการ</th>
                <th className="p-3.5 text-right">ยอดสุทธิ (บาท)</th>
                <th className="p-3.5 text-center">สถานะ</th>
                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((quote) => {
                  const statusInfo =
                    QUOTATION_STATUS_CONFIG[quote.status] || QUOTATION_STATUS_CONFIG.draft;

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => setActiveQuotation(quote)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      {/* Quotation Number */}
                      <td className="p-3.5">
                        <div className="font-mono font-black text-blue-700 text-xs">
                          {quote.quotationNumber}
                        </div>
                        {quote.revisionVersion && quote.revisionVersion > 1 && (
                          <span className="text-[10px] text-slate-400">
                            Rev. {quote.revisionVersion}
                          </span>
                        )}
                      </td>

                      {/* Reference Job */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800">
                          {quote.ticketJobNumber || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {quote.ticketTitle || 'งานบริการซ่อมบำรุง'}
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{quote.customerName}</div>
                        <div className="text-[11px] text-slate-500">
                          {quote.propertyName} {quote.unitNumber ? `ห้อง ${quote.unitNumber}` : ''}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-3.5 text-center text-[11px]">
                        <div className="text-slate-700">{quote.issueDate}</div>
                        <div className="text-rose-600 font-semibold">ถึง {quote.validUntil}</div>
                      </td>

                      {/* Items Count */}
                      <td className="p-3.5 text-center font-semibold text-slate-700">
                        {quote.items.length} รายการ
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                        {QuotationService.formatCurrency(quote.grandTotal)}
                        {quote.vatEnabled && (
                          <span className="block text-[9px] text-slate-400 font-normal">
                            รวม VAT 7%
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveQuotation(quote)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="ดูรายละเอียดใบเสนอราคา"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>ไม่พบรายการใบเสนอราคาที่ตรงกับเงื่อนไข</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Detail Modal */}
      {activeQuotation && (
        <QuotationDetailModal
          quotation={activeQuotation}
          currentUser={currentUser}
          onClose={() => setActiveQuotation(null)}
          onEdit={(q) => {
            setActiveQuotation(null);
            setEditingQuotation(q);
          }}
          onQuotationUpdated={(updated) => {
            setActiveQuotation(updated);
            reloadData();
          }}
          showToast={showToast}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <QuotationFormModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSave={(saved) => {
            reloadData();
            setActiveQuotation(saved);
          }}
          showToast={showToast}
        />
      )}

      {/* Edit Modal */}
      {editingQuotation && (
        <QuotationFormModal
          quotationToEdit={editingQuotation}
          currentUser={currentUser}
          onClose={() => setEditingQuotation(null)}
          onSave={(saved) => {
            reloadData();
            setActiveQuotation(saved);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
