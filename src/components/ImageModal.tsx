import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';
import { TicketImage } from '../types';

interface ImageModalProps {
  image: TicketImage | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                image.phase === 'before'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : image.phase === 'during'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {image.phase === 'before' ? 'ก่อนซ่อม' : image.phase === 'during' ? 'ระหว่างซ่อม' : 'หลังซ่อม'}
            </span>
            {image.isPrimary && (
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-xs font-medium">
                รูปหลัก
              </span>
            )}
            <span className="text-xs text-slate-400">อัปโหลดเมื่อ {image.uploadedAt}</span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="เปิดภาพเต็ม"
            >
              <ZoomIn className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="flex-1 bg-black/60 flex items-center justify-center p-2 overflow-hidden">
          <img
            src={image.url}
            alt={image.caption || 'รูปภาพงานซ่อม'}
            className="max-h-[68vh] max-w-full object-contain rounded-lg"
          />
        </div>

        {/* Caption & Uploader */}
        {(image.caption || image.uploaderName) && (
          <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 text-slate-300 text-sm flex items-center justify-between">
            <p className="font-normal">{image.caption || 'ไม่มีคำอธิบายภาพ'}</p>
            {image.uploaderName && (
              <span className="text-xs text-slate-400">อัปโหลดโดย: {image.uploaderName}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
