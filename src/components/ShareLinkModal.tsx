import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Power,
  Trash2,
  X,
  Lock,
  Calendar,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { ShareLink, User } from '../types';
import { ShareLinkService } from '../services/shareLinkService';

interface ShareLinkModalProps {
  targetType: 'ticket' | 'quotation' | 'acceptance';
  targetId: string;
  targetTitle: string;
  currentUser: User;
  onClose: () => void;
  onOpenPreview?: (token: string, type: 'ticket' | 'quotation' | 'acceptance') => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  targetType,
  targetId,
  targetTitle,
  currentUser,
  onClose,
  onOpenPreview,
  showToast,
}) => {
  const [activeLink, setActiveLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [allowImages, setAllowImages] = useState(true);
  const [allowTimeline, setAllowTimeline] = useState(true);
  const [allowQuotationApproval, setAllowQuotationApproval] = useState(true);
  const [maskLocation, setMaskLocation] = useState(true);

  // Load existing active share link or create one if none
  const loadLinks = () => {
    const existing = ShareLinkService.getActiveShareLinkForTarget(targetType, targetId);
    if (existing) {
      setActiveLink(existing);
      setAllowImages(existing.allowImages);
      setAllowTimeline(existing.allowTimeline);
      setAllowQuotationApproval(existing.allowQuotationApproval);
      setMaskLocation(existing.maskLocation ?? true);
    } else {
      setActiveLink(null);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [targetType, targetId]);

  const handleCreateNewLink = () => {
    const created = ShareLinkService.createShareLink({
      targetType,
      targetId,
      createdBy: currentUser.name,
      expiresInDays,
      allowImages,
      allowTimeline,
      allowQuotationApproval,
      maskLocation,
    });
    setActiveLink(created);
    showToast('สร้างลิงก์สำหรับลูกค้าสำเร็จ', 'สามารถคัดลอกและส่งให้ลูกค้าได้ทันที', 'success');
  };

  const handleRegenerate = () => {
    if (!activeLink) return;
    if (confirm('ยืนยันการสร้างโทเคนใหม่? ลิงก์เดิมจะใช้งานไม่ได้ทันที')) {
      const updated = ShareLinkService.regenerateToken(activeLink.id);
      if (updated) {
        setActiveLink(updated);
        showToast('สร้างลิงก์ใหม่สำเร็จ', 'โทเคนเดิมถูกยกเลิกแล้ว', 'info');
      }
    }
  };

  const handleToggleActive = () => {
    if (!activeLink) return;
    const updated = ShareLinkService.toggleLinkActive(activeLink.id);
    if (updated) {
      setActiveLink(updated);
      showToast(
        updated.isActive ? 'เปิดใช้งานลิงก์แล้ว' : 'ปิดใช้งานลิงก์แล้ว',
        updated.isActive ? 'ลูกค้าสามารถเข้าดูงานได้' : 'ลูกค้าจะไม่สามารถเข้าดูงานได้ชั่วคราว',
        'info'
      );
    }
  };

  const handleSaveSettings = () => {
    if (!activeLink) return;
    const updated = ShareLinkService.updateShareLink(activeLink.id, {
      allowImages,
      allowTimeline,
      allowQuotationApproval,
      maskLocation,
    });
    if (updated) {
      setActiveLink(updated);
      showToast('บันทึกการตั้งค่าลิงก์สำเร็จ', undefined, 'success');
    }
  };

  const shareUrl = activeLink ? ShareLinkService.buildShareUrl(activeLink.token, targetType) : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('คัดลอกลิงก์สำเร็จ', 'นำไปส่งให้ลูกค้าทาง LINE หรือ SMS ได้ทันที', 'success');
      setTimeout(() => setCopied(false), 2500);
    } else {
      // Fallback
      showToast('ลิงก์สำหรับลูกค้า', shareUrl, 'info');
    }
  };

  const isExpired = activeLink?.expiresAt ? new Date(activeLink.expiresAt).getTime() < Date.now() : false;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                สร้างและจัดการลิงก์สำหรับลูกค้า (Guest View)
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-sm">
                อ้างอิง: {targetTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Security & Privacy Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start space-x-3 text-xs text-blue-900">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">ความปลอดภัยสูงสุด:</span> ลิงก์จะสร้างด้วย Secure Token แบบสุ่มความยาว 48 ตัวอักษร ลูกค้าสามารถเปิดดูงานได้โดยไม่ต้อง Login และระบบจะปกปิดข้อมูลส่วนตัว ข้อมูลช่าง และต้นทุนภายในอัตโนมัติ
            </div>
          </div>

          {/* Active Link Section */}
          {activeLink ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      !activeLink.isActive
                        ? 'bg-slate-400'
                        : isExpired
                        ? 'bg-amber-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {!activeLink.isActive
                        ? 'ลิงก์ถูกปิดใช้งาน (Deactivated)'
                        : isExpired
                        ? 'ลิงก์หมดอายุแล้ว (Expired)'
                        : 'ลิงก์พร้อมใช้งาน (Active)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      สร้างเมื่อ {new Date(activeLink.createdAt).toLocaleDateString('th-TH')} โดย {activeLink.createdBy}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                    activeLink.isActive
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{activeLink.isActive ? 'ปิดใช้งานชั่วคราว' : 'เปิดใช้งานอีกครั้ง'}</span>
                </button>
              </div>

              {/* URL Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ลิงก์สำหรับส่งให้ลูกค้า
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Preview & Regenerate */}
              <div className="flex flex-wrap gap-2 pt-1">
                {onOpenPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPreview(activeLink.token, targetType);
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>เปิดหน้าตัวอย่างที่ลูกค้าจะเห็น (Preview)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>สร้างลิงก์ใหม่ (ยกเลิกลิงก์เดิม)</span>
                </button>
              </div>

              {/* Access Stats */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">จำนวนครั้งที่เปิดดู</div>
                    <div className="text-sm font-bold text-slate-900">
                      {activeLink.viewCount || 0} ครั้ง
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">เปิดดูล่าสุด</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {activeLink.lastViewedAt
                        ? new Date(activeLink.lastViewedAt).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : 'ยังไม่มีการเปิดดู'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy & View Settings */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    การตั้งค่าสิทธิ์ที่ลูกค้ามองเห็นผ่านลิงก์นี้
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    บันทึกการตั้งค่า
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">แสดงรูปภาพประกอบงาน</div>
                      <div className="text-[11px] text-slate-500">ให้ลูกค้าเห็นรูปก่อน/หลังซ่อม</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowImages}
                      onChange={(e) => setAllowImages(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">แสดงไทม์ไลน์ความคืบหน้า</div>
                      <div className="text-[11px] text-slate-500">ลำดับขั้นตอนการปฏิบัติงานของช่าง</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowTimeline}
                      onChange={(e) => setAllowTimeline(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm"
                    />
                  </label>

                  {targetType === 'quotation' && (
                    <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">อนุญาตให้กดอนุมัติราคาผ่านเว็บ</div>
                        <div className="text-[11px] text-slate-500">ลูกค้ากดยืนยันราคาและเงื่อนไขออนไลน์ได้ทันที</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowQuotationApproval}
                        onChange={(e) => setAllowQuotationApproval(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">ปกปิดข้อมูลห้องบางส่วนเพื่อความเป็นส่วนตัว</div>
                      <div className="text-[11px] text-slate-500">เช่น แสดงเป็น &ldquo;ห้อง ***5&rdquo; เพื่อความปลอดภัย</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={maskLocation}
                      onChange={(e) => setMaskLocation(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Create Link Form */
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">ยังไม่มีลิงก์สำหรับรายการนี้</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  สร้างลิงก์เพื่อให้ลูกค้าสามารถติดตามสถานะงานหรือดูใบเสนอราคาได้สะดวกผ่านสมาร์ตโฟน
                </p>
              </div>

              {/* Expiry Selector */}
              <div className="max-w-xs mx-auto text-left pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  อายุการใช้งานของลิงก์
                </label>
                <select
                  value={expiresInDays === null ? 'none' : expiresInDays}
                  onChange={(e) =>
                    setExpiresInDays(e.target.value === 'none' ? null : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                >
                  <option value={7}>7 วัน (แนะนำสำหรับงานด่วน)</option>
                  <option value={30}>30 วัน (มาตรฐาน)</option>
                  <option value={90}>90 วัน</option>
                  <option value="none">ไม่มีวันหมดอายุ (จนกว่าผู้ดูแลจะปิด)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateNewLink}
                className="w-full max-w-xs py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>สร้างลิงก์ให้ลูกค้าดูเดี๋ยวนี้</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/80 rounded-xl transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
