import React, { useState } from 'react';
import {
  X,
  Printer,
  QrCode,
  Building,
  CheckCircle2,
  Download,
  Share2,
  HelpCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { RepairTicket, User } from '../types';
import { ShareLinkService } from '../services/shareLinkService';

interface PrintableQrModalProps {
  tickets: RepairTicket[];
  currentUser: User;
  onClose: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const PrintableQrModal: React.FC<PrintableQrModalProps> = ({
  tickets,
  currentUser,
  onClose,
  showToast,
}) => {
  // Extract unique units and properties from existing tickets
  const uniqueUnits = Array.from(
    new Set(tickets.map((t) => `${t.propertyName} - ห้อง ${t.unitNumber}`))
  );

  const [selectedUnits, setSelectedUnits] = useState<string[]>(() =>
    uniqueUnits.slice(0, 4)
  );
  const [customBuilding, setCustomBuilding] = useState('คอนโดมิเนียม ฟิกซ์โฟลว์ พาร์ค');
  const [customUnitStart, setCustomUnitStart] = useState('801');
  const [customUnitEnd, setCustomUnitEnd] = useState('806');
  const [qrMode, qrModeSet] = useState<'existing_jobs' | 'batch_units'>('existing_jobs');

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Generate SVG QR Code URL using quickchart QR API
  const getQrUrl = (text: string) => {
    return `https://quickchart.io/qr?text=${encodeURIComponent(
      text
    )}&size=200&margin=1&ecLevel=M`;
  };

  // Build existing tickets QR cards
  const existingJobCards = selectedUnits.map((label) => {
    const matchedTicket = tickets.find(
      (t) => `${t.propertyName} - ห้อง ${t.unitNumber}` === label
    );
    let targetUrl = `${window.location.origin}${window.location.pathname}#/guest`;
    let token = '';

    if (matchedTicket) {
      let activeLink = ShareLinkService.getActiveShareLinkForTarget(
        'ticket',
        matchedTicket.id
      );
      if (!activeLink) {
        activeLink = ShareLinkService.createShareLink({
          targetType: 'ticket',
          targetId: matchedTicket.id,
          createdBy: currentUser.name,
          allowImages: true,
          allowTimeline: true,
          maskLocation: true,
        });
      }
      token = activeLink.token;
      targetUrl = `${window.location.origin}${window.location.pathname}#/guest/job/${token}`;
    }

    return {
      title: label,
      ticket: matchedTicket,
      url: targetUrl,
      token,
    };
  });

  // Build batch unit cards
  const batchCards = [];
  const startNum = parseInt(customUnitStart) || 801;
  const endNum = Math.min(startNum + 15, parseInt(customUnitEnd) || 806);

  for (let i = startNum; i <= endNum; i++) {
    const unitStr = `${i}`;
    const url = `${window.location.origin}${window.location.pathname}#/guest/unit/${unitStr}`;
    batchCards.push({
      title: `${customBuilding} - ห้อง ${unitStr}`,
      unit: unitStr,
      building: customBuilding,
      url,
    });
  }

  const cardsToRender = qrMode === 'existing_jobs' ? existingJobCards : batchCards;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                พิมพ์ป้าย QR Code ประจำห้อง / งานซ่อม
              </h2>
              <p className="text-xs text-slate-500">
                สำหรับติดประจำห้องพักเพื่อให้ผู้พักอาศัยสแกนติดตามงานหรือแจ้งปัญหาได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Tabs (Screen Only) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center space-x-2 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => qrModeSet('existing_jobs')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                qrMode === 'existing_jobs'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตามงานซ่อมที่มีอยู่ในระบบ ({tickets.length} รายการ)
            </button>
            <button
              type="button"
              onClick={() => qrModeSet('batch_units')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                qrMode === 'batch_units'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สร้างป้าย QR ติดห้องเป็นชุด (ช่วงเลขห้อง)
            </button>
          </div>

          {qrMode === 'batch_units' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">ห้อง:</span>
              <input
                type="text"
                value={customUnitStart}
                onChange={(e) => setCustomUnitStart(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="text"
                value={customUnitEnd}
                onChange={(e) => setCustomUnitEnd(e.target.value)}
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
              />
            </div>
          )}
        </div>

        {/* Printable Sheet Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between print:hidden">
              <span>
                💡 แนะนำ: ใช้การตั้งค่ากระดาษ A4 ในหน้าต่างพิมพ์ ป้ายจะจัดเรียง 4 ใบต่อหน้าพอดี
              </span>
            </div>

            {/* Grid of Printable Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-6">
              {cardsToRender.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-300 shadow-sm flex flex-col items-center text-center space-y-3 print:border-slate-400 print:shadow-none print:break-inside-avoid"
                >
                  {/* Card Header Branding */}
                  <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-1.5 text-left">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        F
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 font-display">FixFlow</div>
                        <div className="text-[9px] text-slate-400">ระบบบริการงานช่าง</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      แจ้งซ่อม & ติดตามงาน
                    </span>
                  </div>

                  {/* Room / Unit Title */}
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-400 font-medium">ป้ายประจำห้อง</div>
                    <div className="text-base font-extrabold text-slate-900">{card.title}</div>
                  </div>

                  {/* High Quality QR Image */}
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                    <img
                      src={getQrUrl(card.url)}
                      alt="QR Code"
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 object-contain"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      สแกนเพื่อเปิดผ่านมือถือ
                    </div>
                  </div>

                  {/* Guidance Instructions in Thai */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      สแกน QR Code นี้เพื่อติดตามสถานะงานซ่อม
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ตรวจสอบความคืบหน้า วันนัดหมายช่าง และดูใบเสนอราคาได้ 24 ชั่วโมง
                    </p>
                  </div>

                  {/* Card Footer Contact */}
                  <div className="w-full pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>ศูนย์บริการลูกค้า FixFlow</span>
                    <span className="font-bold text-slate-700">โทร 02-987-6543</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
