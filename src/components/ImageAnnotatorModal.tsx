import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Check,
  RotateCcw,
  Trash2,
  Pencil,
  Circle,
  Square,
  ArrowRight,
  Type,
  Palette,
  Sparkles,
  Layers,
  ZoomIn,
  Move
} from "lucide-react";

export interface ImageAnnotatorModalProps {
  imageSrc: string;
  fileName?: string;
  title?: string;
  onClose: () => void;
  onSave: (annotatedFile: File, annotatedPreviewUrl: string) => void;
}

export type ToolType = "pen" | "circle" | "rect" | "arrow" | "text";

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  type: ToolType;
  color: string;
  lineWidth: number;
  points?: Point[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
}

const COLOR_SWATCHES = [
  { name: "สีแดง (ระบุจุดเสีย)", value: "#ef4444" },
  { name: "สีเหลือง (เตือน/เฝ้าระวัง)", value: "#eab308" },
  { name: "สีเขียว (ซ่อมแล้ว/ปกติ)", value: "#22c55e" },
  { name: "สีฟ้า (ตำแหน่งสำคัญ)", value: "#3b82f6" },
  { name: "สีขาว (พื้นหลังเข้ม)", value: "#ffffff" },
  { name: "สีดำ (พื้นหลังสว่าง)", value: "#0f172a" },
];

const STROKE_WIDTHS = [
  { label: "บาง", value: 3 },
  { label: "ปกติ", value: 6 },
  { label: "หนา", value: 10 },
  { label: "หนาพิเศษ", value: 16 },
];

export const ImageAnnotatorModal: React.FC<ImageAnnotatorModalProps> = ({
  imageSrc,
  fileName = "annotated_image.png",
  title = "วาดและทำเครื่องหมายบนรูปภาพ (Image Annotation & Markup)",
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState<string>("#ef4444"); // Red default
  const [lineWidth, setLineWidth] = useState<number>(6);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationItem | null>(null);

  // Text input state
  const [textInput, setTextInput] = useState<string>("");
  const [activeTextPos, setActiveTextPos] = useState<Point | null>(null);

  // Image load state
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Image element on mount or imageSrc change
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      if (isMounted) {
        setLoadedImg(img);
        setImgError(null);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setImgError("ไม่สามารถโหลดรูปภาพสำหรับวาดมาร์กได้");
      }
    };

    return () => {
      isMounted = false;
    };
  }, [imageSrc]);

  // Convert pointer event to canvas pixel coordinates
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Render all annotations onto canvas context
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to image natural size
    if (canvas.width !== loadedImg.naturalWidth || canvas.height !== loadedImg.naturalHeight) {
      canvas.width = loadedImg.naturalWidth;
      canvas.height = loadedImg.naturalHeight;
    }

    // Clear and draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);

    // Helper to draw a single item
    const drawItem = (item: AnnotationItem) => {
      ctx.save();
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (item.type === "pen" && item.points && item.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        ctx.stroke();
      } else if (item.type === "circle" && item.startX !== undefined && item.endX !== undefined) {
        const radius = Math.hypot(item.endX - item.startX, item.endY! - item.startY!);
        ctx.beginPath();
        ctx.arc(item.startX, item.startY!, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === "rect" && item.startX !== undefined && item.endX !== undefined) {
        ctx.strokeRect(
          item.startX,
          item.startY!,
          item.endX - item.startX,
          item.endY! - item.startY!
        );
      } else if (item.type === "arrow" && item.startX !== undefined && item.endX !== undefined) {
        const headLength = Math.max(16, item.lineWidth * 3);
        const dx = item.endX - item.startX;
        const dy = item.endY! - item.startY!;
        const angle = Math.atan2(dy, dx);

        // Main line
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY!);
        ctx.lineTo(item.endX, item.endY!);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(item.endX, item.endY!);
        ctx.lineTo(
          item.endX - headLength * Math.cos(angle - Math.PI / 6),
          item.endY! - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          item.endX - headLength * Math.cos(angle + Math.PI / 6),
          item.endY! - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (item.type === "text" && item.startX !== undefined && item.text) {
        const fontSize = Math.max(20, item.lineWidth * 4);
        ctx.font = `bold ${fontSize}px Prompt, sans-serif`;

        // Measure text for background pill
        const metrics = ctx.measureText(item.text);
        const padding = fontSize * 0.4;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = fontSize + padding * 1.2;

        // Dark pill background for maximum text contrast
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(
            item.startX - padding,
            item.startY! - fontSize,
            bgWidth,
            bgHeight,
            8
          );
        } else {
          ctx.rect(item.startX - padding, item.startY! - fontSize, bgWidth, bgHeight);
        }
        ctx.fill();

        // Border around text pill
        ctx.strokeStyle = item.color;
        ctx.lineWidth = Math.max(2, item.lineWidth / 2);
        ctx.stroke();

        // Text string
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.startX, item.startY!);
      }
      ctx.restore();
    };

    // Render historical annotations
    annotations.forEach(drawItem);

    // Render current active annotation
    if (currentAnnotation) {
      drawItem(currentAnnotation);
    }
  }, [loadedImg, annotations, currentAnnotation]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer Down (Mouse / Touch Start)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loadedImg) return;
    const coords = getCanvasCoords(e);

    if (tool === "text") {
      setActiveTextPos(coords);
      return;
    }

    setIsDrawing(true);

    const newAnno: AnnotationItem = {
      id: `anno_${Date.now()}`,
      type: tool,
      color: color,
      lineWidth: lineWidth,
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y,
      points: tool === "pen" ? [coords] : undefined,
    };

    setCurrentAnnotation(newAnno);
  };

  // Pointer Move (Mouse Drag / Touch Drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    const coords = getCanvasCoords(e);

    if (currentAnnotation.type === "pen") {
      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...(prev.points || []), coords],
        };
      });
    } else {
      setCurrentAnnotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          endX: coords.x,
          endY: coords.y,
        };
      });
    }
  };

  // Pointer Up / Leave
  const handlePointerUp = () => {
    if (!isDrawing || !currentAnnotation) return;
    setIsDrawing(false);

    setAnnotations((prev) => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
  };

  // Add text label annotation
  const handleConfirmText = () => {
    if (!activeTextPos || !textInput.trim()) {
      setActiveTextPos(null);
      setTextInput("");
      return;
    }

    const newAnno: AnnotationItem = {
      id: `text_${Date.now()}`,
      type: "text",
      color: color,
      lineWidth: lineWidth,
      startX: activeTextPos.x,
      startY: activeTextPos.y,
      text: textInput.trim(),
    };

    setAnnotations((prev) => [...prev, newAnno]);
    setActiveTextPos(null);
    setTextInput("");
  };

  // Undo last stroke
  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, prev.length - 1));
  };

  // Clear all annotations
  const handleClearAll = () => {
    if (annotations.length === 0) return;
    if (window.confirm("คุณต้องการลบเครื่องหมายที่วาดไว้ทั้งหมดใช่หรือไม่?")) {
      setAnnotations([]);
    }
  };

  // Export merged image to file
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg) return;

    setIsSaving(true);
    try {
      // Create offscreen canvas to render final merged output
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext("2d");

      if (!ctx) throw new Error("ไม่สามารถสร้าง 2D Context สำหรับส่งออกภาพ");

      // Draw canvas contents onto export canvas
      ctx.drawImage(canvas, 0, 0);

      exportCanvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("ไม่สามารถสร้างไฟล์ภาพได้");
            setIsSaving(false);
            return;
          }
          const cleanFileName = fileName.endsWith(".png") ? fileName : `${fileName.split(".")[0]}_annotated.png`;
          const file = new File([blob], cleanFileName, { type: "image/png" });
          const url = URL.createObjectURL(file);
          onSave(file, url);
          onClose();
        },
        "image/png",
        0.95
      );
    } catch (err: any) {
      console.error("Save annotated image error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพ: " + (err.message || err));
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex justify-center items-center p-3 sm:p-5 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 flex justify-between items-center text-white border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center space-x-2">
                <span>{title}</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md uppercase font-mono font-bold">
                  Annotator Pro
                </span>
              </h3>
              <p className="text-slate-400 text-xxs font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                ไฟล์: {fileName} | วาดเน้นจุดชำรุดด้วยสี/ลูกศร/วงกลมได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Tool Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setTool("pen")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                tool === "pen"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="ปากกาเขียนอิสระ"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>ปากกา</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("circle")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                tool === "circle"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="วงกลมเน้นจุดชำรุด"
            >
              <Circle className="w-3.5 h-3.5" />
              <span>วงกลม</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("rect")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                tool === "rect"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="กรอบสี่เหลี่ยมเน้นพื้นที่"
            >
              <Square className="w-3.5 h-3.5" />
              <span>สี่เหลี่ยม</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("arrow")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                tool === "arrow"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="ลูกศรชี้จุดปัญหา"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>ลูกศร</span>
            </button>
            <button
              type="button"
              onClick={() => setTool("text")}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                tool === "text"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="เพิ่มข้อความกำกับ"
            >
              <Type className="w-3.5 h-3.5" />
              <span>ข้อความ</span>
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pr-1">
              สี:
            </span>
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.value}
                type="button"
                onClick={() => setColor(swatch.value)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                  color === swatch.value
                    ? "scale-125 ring-2 ring-indigo-500 border-white shadow-sm"
                    : "hover:scale-110 border-slate-300"
                }`}
                style={{ backgroundColor: swatch.value }}
                title={swatch.name}
              />
            ))}
          </div>

          {/* Stroke Width Picker */}
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pr-1">
              เส้น:
            </span>
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setLineWidth(w.value)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                  lineWidth === w.value
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* History Actions: Undo & Clear */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={annotations.length === 0}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
              title="ย้อนกลับการวาดล่าสุด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ย้อนกลับ</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={annotations.length === 0}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 border border-rose-200 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
              title="ลบเครื่องหมายทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างภาพ</span>
            </button>
          </div>

        </div>

        {/* Canvas Workspace Area */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-slate-950/90 min-h-[320px] max-h-[58vh] flex items-center justify-center p-4 overflow-auto select-none touch-none"
        >
          {imgError ? (
            <div className="text-center p-6 text-rose-400">
              <p className="font-bold text-sm">{imgError}</p>
            </div>
          ) : !loadedImg ? (
            <div className="text-center p-6 text-slate-400 flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">กำลังโหลดรูปภาพเพื่อเปิดโหมดวาดมาร์ก...</p>
            </div>
          ) : (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="max-w-full max-h-[54vh] object-contain rounded-xl shadow-2xl cursor-crosshair border border-slate-800"
              />

              {/* Text Input Floating Popup when clicking Canvas in text mode */}
              {activeTextPos && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white p-3 rounded-2xl shadow-2xl flex items-center space-x-2 z-30 animate-scaleUp">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="พิมพ์ข้อความเน้น เช่น 'ท่อน้ำรั่ว', 'เปลี่ยนแล้ว'..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmText();
                      if (e.key === "Escape") setActiveTextPos(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmText}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    ใส่ข้อความ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTextPos(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="font-bold text-slate-700">คำแนะนำ:</span>
            <span>เลือกเครื่องหมาย (ปากกา / วงกลม / ลูกศร) ด้านบน แล้วลากบนรูปภาพได้เลย</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !loadedImg}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึกภาพมาร์ก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกรูปภาพพร้อมมาร์กจุด</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
