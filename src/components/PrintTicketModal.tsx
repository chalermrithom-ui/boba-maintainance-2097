import React from 'react';
import { X, Printer, Wrench, Calendar, MapPin, Phone, User, CheckSquare } from 'lucide-react';
import { RepairTicket, STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../types';

interface PrintTicketModalProps {
  ticket: RepairTicket | null;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalCost = (ticket.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">พิมพ์ใบงานซ่อมแซม (Work Order)</h3>
            <p className="text-xs text-slate-500">ตรวจสอบรายละเอียดก่อนสั่งพิมพ์หรือบันทึกเป็น PDF</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900" id="print-content">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 text-blue-700 font-extrabold text-2xl tracking-tight">
                <Wrench className="w-7 h-7 text-blue-600 inline" />
                <span>FixFlow Maintenance</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ระบบจัดการและควบคุมงานซ่อมแซม อาคารชุดและโครงการที่พักอาศัย
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">ใบสั่งซ่อมแซม</span>
              <span className="text-xl font-mono font-black text-slate-900">{ticket.jobNumber}</span>
              <p className="text-xs text-slate-500 mt-0.5">วันที่ออกเอกสาร: {ticket.createdAt}</p>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">ข้อมูลสถานที่ & ผู้แจ้ง</h4>
              <p className="font-semibold text-slate-900">{ticket.propertyName}</p>
              <p className="text-slate-600 text-xs">
                {ticket.building ? `${ticket.building} ` : ''}
                {ticket.floor ? `ชั้น ${ticket.floor} ` : ''}
                ห้อง/บ้านเลขที่: <strong className="text-slate-800">{ticket.unitNumber}</strong>
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                <span>ผู้แจ้ง: <strong>{ticket.requesterName}</strong></span>
                <span>โทร: <strong>{ticket.requesterPhone}</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">ข้อมูลนัดหมาย & ช่างผู้รับผิดชอบ</h4>
              <p className="text-xs">
                หมวดหมู่: <span className="font-semibold">{CATEGORY_CONFIG[ticket.category]?.label || ticket.category}</span>
              </p>
              <p className="text-xs">
                ความเร่งด่วน: <span className="font-bold text-amber-700">{PRIORITY_CONFIG[ticket.priority]?.label}</span>
              </p>
              <p className="text-xs">
                ช่างผู้รับผิดชอบ: <strong className="text-blue-700">{ticket.assignedTechnician || 'ยังไม่ระบุ'}</strong>
              </p>
              <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                <span>วันนัด: <strong>{ticket.appointment?.date || 'รอระบุ'}</strong></span>
                <span>เวลา: <strong>{ticket.appointment?.timeSlot || '-'}</strong></span>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className="mb-6 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">รายละเอียดปัญหา / อาการที่แจ้ง</h4>
            <h5 className="font-bold text-slate-900 text-sm mb-1">{ticket.title}</h5>
            <p className="text-xs text-slate-700 leading-relaxed">{ticket.description}</p>
          </div>

          {/* Expenses Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">รายการค่าใช้จ่าย & อะไหล่ที่ใช้</h4>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-semibold">รายการ</th>
                  <th className="p-2.5 font-semibold">ประเภท</th>
                  <th className="p-2.5 text-center font-semibold">จำนวน</th>
                  <th className="p-2.5 text-right font-semibold">ราคาต่อหน่วย</th>
                  <th className="p-2.5 text-right font-semibold">รวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ticket.expenses && ticket.expenses.length > 0 ? (
                  ticket.expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-2.5 font-medium text-slate-800">{exp.description}</td>
                      <td className="p-2.5 text-slate-500">
                        {exp.type === 'labor' ? 'ค่าแรง' : exp.type === 'part' ? 'ค่าอะไหล่' : 'อื่น ๆ'}
                      </td>
                      <td className="p-2.5 text-center text-slate-600">{exp.quantity || 1}</td>
                      <td className="p-2.5 text-right text-slate-600">
                        {(exp.unitPrice || exp.amount).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">
                        {exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400">
                      - ยังไม่มีรายการค่าใช้จ่ายหรือไม่มีค่าใช้จ่าย -
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={4} className="p-2.5 text-right">ยอดรวมค่าใช้จ่ายทั้งสิ้น:</td>
                  <td className="p-2.5 text-right text-blue-700">{totalCost.toLocaleString()} บาท</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Checklist & Signatures */}
          <div className="border border-slate-200 rounded-xl p-4 mb-8">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บันทึกผลการตรวจสอบการทำงาน</h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                <span>ตรวจสอบสภาพพื้นที่ก่อนเริ่มซ่อม</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                <span>ดำเนินการซ่อมแซมตามมาตรฐาน</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                <span>ทดสอบการทำงานของอุปกรณ์เสร็จสิ้น</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                <span>ทำความสะอาดพื้นที่หลังการซ่อมแซม</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
              <div className="text-center">
                <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
                <p className="font-semibold text-slate-800">ลงชื่อ ................................................................</p>
                <p className="text-slate-500 mt-1">({ticket.assignedTechnician || 'ช่างผู้ปฏิบัติงาน'})</p>
                <p className="text-[11px] text-slate-400">ช่างเทคนิคผู้ดำเนินการ</p>
              </div>

              <div className="text-center">
                <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
                <p className="font-semibold text-slate-800">ลงชื่อ ................................................................</p>
                <p className="text-slate-500 mt-1">({ticket.requesterName})</p>
                <p className="text-[11px] text-slate-400">ผู้แจ้งงาน / ผู้ตรวจสอบรับมอบงาน</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            เอกสารนี้สร้างจากระบบ FixFlow • วันที่พิมพ์ {new Date().toLocaleDateString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
};
