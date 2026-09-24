import React, { useState } from "react";
import { Part } from "../types";
import { QrCode, X, Printer, Download, Check, Copy, Package, Sparkles } from "lucide-react";

interface PartQrLabelModalProps {
  part: Part;
  onClose: () => void;
}

export const PartQrLabelModal: React.FC<PartQrLabelModalProps> = ({ part, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [qrImgError, setQrImgError] = useState<boolean>(false);

  // Encode QR payload JSON or part ID
  const qrData = JSON.stringify({
    id: part.id,
    name: part.name,
    unit: part.unit,
    price: part.price
  });

  // Primary & fallback QR code image URLs
  const primaryQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    part.id
  )}`;
  const fallbackQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(
    part.id
  )}`;
  const qrImageUrl = qrImgError ? fallbackQrUrl : primaryQrUrl;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(part.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy error:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-indigo-400" />
            <h3 className="font-display font-bold text-sm">ป้าย QR Code สำหรับติดอะไหล่</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable QR Code Label Box */}
        <div className="p-6 text-center space-y-4">
          <div className="border-2 border-slate-800 rounded-2xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-900 text-xs tracking-wider uppercase font-mono">
                B.O.B.A. INVENTORY
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                SPARE PART
              </span>
            </div>

            <div className="flex justify-center my-2">
              <img
                src={qrImageUrl}
                alt={`QR Code for ${part.name}`}
                referrerPolicy="no-referrer"
                onError={() => setQrImgError(true)}
                className="w-44 h-44 object-contain border border-slate-200 rounded-xl p-2 bg-white"
              />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{part.name}</h4>
              <div className="flex items-center justify-center space-x-2 text-xs font-mono font-bold text-slate-600 mt-1">
                <span>รหัส: {part.id}</span>
                <span>•</span>
                <span>฿{part.price.toLocaleString()} / {part.unit}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 no-print">
            <button
              type="button"
              onClick={handleCopyId}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "คัดลอกรหัสแล้ว!" : "คัดลอกรหัส"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors shadow-md cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>พิมพ์ป้าย ลาเบล</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
