import React, { useState, useCallback } from "react";
import Cropper, { Point, Area } from "react-easy-crop";
import { X, Crop, Check, RotateCw, ZoomIn, Maximize2, Sparkles } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string;
  fileName?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string = "cropped_damage_spot.jpg"
): Promise<{ file: File; url: string }> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = (e) => reject(new Error("Failed to load image for cropping: " + e));
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create 2D context for canvas cropping");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/jpeg" });
      const url = URL.createObjectURL(file);
      resolve({ file, url });
    }, "image/jpeg", 0.92);
  });
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  fileName = "cropped_image.jpg",
  onClose,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [aspect, setAspect] = useState<number | undefined>(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropChange = (newCrop: Point) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const { file, url } = await getCroppedImg(imageSrc, croppedAreaPixels, fileName);
      onCropComplete(file, url);
      onClose();
    } catch (err) {
      console.error("Crop error:", err);
      alert("เกิดข้อผิดพลาดในการครอบตัดรูปภาพ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex justify-center items-center z-50 p-3 md:p-6">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex justify-between items-center border-b border-slate-800 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base tracking-tight font-display text-white">
                ครอบตัดและเน้นจุดชำรุด (Crop & Focus Damaged Spot)
              </h3>
              <p className="text-[11px] text-slate-400">
                ลาก ย่อ/ขยาย เพื่อเลือกเฉพาะพื้นที่ที่ชำรุดก่อนบันทึกรูป
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container Stage */}
        <div className="relative w-full h-[380px] sm:h-[420px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            showGrid={true}
          />
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-4 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Zoom Slider */}
            <div className="flex items-center space-x-3 w-full sm:w-1/2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80">
              <ZoomIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-mono text-slate-300 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Aspect Ratio Selector Buttons */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden md:inline">
                สัดส่วน:
              </span>
              <button
                type="button"
                onClick={() => setAspect(4 / 3)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  aspect === 4 / 3
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                4:3
              </button>
              <button
                type="button"
                onClick={() => setAspect(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  aspect === 1
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                1:1 (สี่เหลี่ยม)
              </button>
              <button
                type="button"
                onClick={() => setAspect(16 / 9)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  aspect === 16 / 9
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => setAspect(undefined)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  aspect === undefined
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                อิสระ (Free)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-emerald-400 font-extrabold flex items-center space-x-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ภาพจะถูกครอบและปรับโฟกัสเฉพาะจุดอัตโนมัติ</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isProcessing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? "กำลังประมวลผล..." : "ตกลง / ใช้รูปภาพนี้"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
