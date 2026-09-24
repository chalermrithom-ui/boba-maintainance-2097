import React, { useState } from "react";
import { JobPriority, JobStatus, RepairJob, UserRole } from "../types";
import { X, Calendar, MapPin, Wrench, AlertCircle, Upload, CheckCircle2, Loader2, Clock, Crop, Camera, Tag } from "lucide-react";
import { ImageCropperModal } from "./ImageCropperModal";
import { addLabelToImageFile } from "../utils/imageUtils";

interface RepairFormProps {
  onClose: () => void;
  onSubmit: (jobData: Partial<RepairJob>, beforePhotoFiles: File[]) => Promise<void>;
  technicians: string[];
  initialApptDate?: string;
}

export const RepairForm: React.FC<RepairFormProps> = ({ onClose, onSubmit, technicians, initialApptDate }) => {
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [apptDate, setApptDate] = useState<string>(initialApptDate || "");
  const [apptTime, setApptTime] = useState<string>("");
  const [condoName, setCondoName] = useState<string>("");
  const [roomNo, setRoomNo] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [selectedTechs, setSelectedTechs] = useState<string[]>(["SKY"]);
  const [hasCustomTech, setHasCustomTech] = useState<boolean>(false);
  const [customTech, setCustomTech] = useState<string>("");
  const [priority, setPriority] = useState<string>(JobPriority.NORMAL);
  
  // File upload state (Multiple images)
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [beforePreviews, setBeforePreviews] = useState<string[]>([]);
  const [beforeLabels, setBeforeLabels] = useState<string[]>([]);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    if (croppingIndex !== null && croppingIndex >= 0 && croppingIndex < beforeFiles.length) {
      const updatedFiles = [...beforeFiles];
      const updatedPreviews = [...beforePreviews];
      updatedFiles[croppingIndex] = croppedFile;
      updatedPreviews[croppingIndex] = croppedPreviewUrl;
      setBeforeFiles(updatedFiles);
      setBeforePreviews(updatedPreviews);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      if (selectedFiles.length > 0) {
        const newFiles = [...beforeFiles, ...selectedFiles];
        setBeforeFiles(newFiles);

        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setBeforePreviews([...beforePreviews, ...newPreviews]);
        setBeforeLabels([...beforeLabels, ...selectedFiles.map(() => "")]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const selectedFiles = Array.from(e.dataTransfer.files) as File[];
      if (selectedFiles.length > 0) {
        const newFiles = [...beforeFiles, ...selectedFiles];
        setBeforeFiles(newFiles);

        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setBeforePreviews([...beforePreviews, ...newPreviews]);
        setBeforeLabels([...beforeLabels, ...selectedFiles.map(() => "")]);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!condoName.trim()) {
      setError("กรุณาระบุชื่ออาคารคอนโด");
      return;
    }
    if (!roomNo.trim()) {
      setError("กรุณาระบุเลขที่ห้อง");
      return;
    }
    if (!details.trim()) {
      setError("กรุณาระบุรายละเอียดอาการเสีย");
      return;
    }
    const finalTechList = [...selectedTechs];
    if (hasCustomTech && customTech.trim()) {
      finalTechList.push(`อื่นๆ: ${customTech.trim()}`);
    }
    const finalTechnicianStr = finalTechList.join(", ");

    if (!finalTechnicianStr.trim()) {
      setError("กรุณาเลือกหรือระบุช่างผู้รับผิดชอบอย่างน้อย 1 ท่าน");
      return;
    }
    if (!apptDate) {
      setError("กรุณาระบุวันที่นัดเข้าทำงานซ่อม");
      return;
    }
    if (!apptTime) {
      setError("กรุณาระบุเวลานัดเข้าทำงานซ่อม");
      return;
    }

    setIsSubmitting(true);
    try {
      // Process before files to burn custom text labels onto image canvas if provided
      const processedBeforeFiles = await Promise.all(
        beforeFiles.map((file, idx) => addLabelToImageFile(file, beforeLabels[idx] || ""))
      );

      // Collect label tags to include in details if available
      const labelTags = beforeLabels.map((lbl, idx) => lbl?.trim() ? `[รูปที่ ${idx + 1}: ${lbl.trim()}]` : "").filter(Boolean);
      const finalDetails = labelTags.length > 0
        ? `${details.trim()}\n📌 ป้ายกำกับรูปภาพ: ${labelTags.join(" ")}`
        : details.trim();

      const jobData: Partial<RepairJob> = {
        workDate,
        apptDate,
        apptTime,
        condoName: condoName.trim(),
        roomNo: roomNo.trim(),
        details: finalDetails,
        technician: finalTechnicianStr,
        status: JobStatus.PENDING,
        notes: "",
        parts: [],
        totalCost: 0,
        updatedAt: new Date().toLocaleString("th-TH"),
        priority,
      };

      await onSubmit(jobData, processedBeforeFiles);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการลงทะเบียนงานซ่อม");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            <h3 className="font-display font-semibold text-lg">เพิ่มบันทึกงานแจ้งซ่อมใหม่</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Work Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>วันที่สั่งงาน (วันที่แจ้ง)</span>
              </label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Appt Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-blue-700 font-semibold">วันที่นัดเข้าซ่อม *</span>
              </label>
              <input
                type="date"
                required
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Appt Time */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-blue-700 font-semibold">เวลานัดหมาย *</span>
              </label>
              <input
                type="time"
                required
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Condo Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>ชื่ออาคารคอนโด *</span>
              </label>
              <input
                type="text"
                required
                placeholder="พิมพ์ระบุชื่ออาคารคอนโด เช่น เดอะ พาร์ค เรสซิเดนท์, ตึก A"
                value={condoName}
                onChange={(e) => setCondoName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Room No */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เบอร์ห้อง *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น A-402, 122/45"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              รายละเอียดอาการเสีย / รายการอุปกรณ์ชำรุด *
            </label>
            <textarea
              required
              rows={3}
              placeholder="กรุณากรอกอาการเสียโดยละเอียด เช่น เครื่องปรับอากาศห้องนอนใหญ่เปิดไม่ติด มีน้ำรั่วหยด..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Assigned Technician */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>ช่างผู้รับผิดชอบงานซ่อมแซม (เลือกได้หลายคน) *</span>
              <span className="text-xxs text-blue-600 font-bold">เลือก SKY, Jay Jay, CHAINS หรือ ช่างอื่นๆ</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {["SKY", "Jay Jay", "CHAINS"].map((tech) => {
                const isSelected = selectedTechs.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTechs(selectedTechs.filter((t) => t !== tech));
                      } else {
                        setSelectedTechs([...selectedTechs, tech]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{tech}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setHasCustomTech(!hasCustomTech)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  hasCustomTech
                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{hasCustomTech ? "✓" : "+"}</span>
                <span>อื่นๆ...</span>
              </button>
            </div>

            {hasCustomTech && (
              <div className="mt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="พิมพ์ระบุชื่อช่างเพิ่มเติม เช่น ช่างภายนอก / ช่างเอก"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  className="w-full px-3.5 py-2 border border-purple-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-purple-50/30"
                />
              </div>
            )}
          </div>

          {/* Priority / Urgency Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>ระดับความสำคัญของงานซ่อม (Priority) *</span>
              <span className="text-xxs font-mono text-slate-500">Low / Normal / High / Critical</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: JobPriority.LOW, label: "Low", desc: "ปกติ / ต่ำ", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
                { value: JobPriority.NORMAL, label: "Normal", desc: "ปกติ", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                { value: JobPriority.HIGH, label: "High", desc: "สูง / ด่วน", color: "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100" },
                { value: JobPriority.CRITICAL, label: "Critical", desc: "วิกฤต / ด่วนที่สุด 🚨", color: "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100" },
              ].map((p) => {
                const isSelected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? p.value === JobPriority.CRITICAL
                          ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/30 font-bold"
                          : p.value === JobPriority.HIGH
                          ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30 font-bold"
                          : p.value === JobPriority.NORMAL
                          ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30 font-bold"
                          : "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/30 font-bold"
                        : p.color
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-wide">{p.label}</span>
                      {isSelected && <span className="text-xs">✓</span>}
                    </div>
                    <span className={`text-[10px] mt-1 ${isSelected ? "text-white/90 font-medium" : "text-slate-500"}`}>
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Before media upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                แนบไฟล์สื่อ/สภาพก่อนซ่อมแซม (รูปภาพ, คลิปวิดีโอ, เอกสาร) *
              </label>
              <button
                type="button"
                onClick={() => document.getElementById("camera-file-input")?.click()}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>เปิดกล้องถ่ายรูป</span>
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50"
                  : beforePreviews.length > 0
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                id="camera-file-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {beforePreviews.length > 0 ? (
                <div className="space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {beforePreviews.map((preview, idx) => {
                      const fileObj = beforeFiles[idx];
                      const isVideo = fileObj?.type?.startsWith("video/") || fileObj?.name?.match(/\.(mp4|mov|webm|avi|mkv)$/i);
                      return (
                        <div key={idx} className="relative border border-slate-200 rounded-lg p-1 bg-white shadow-sm flex flex-col items-center">
                          {isVideo ? (
                            <div className="relative h-20 w-28 bg-slate-900 rounded overflow-hidden flex items-center justify-center">
                              <video src={preview} className="h-full w-full object-cover" muted />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs">
                                🎬 VDO
                              </div>
                            </div>
                          ) : (
                            <div className="relative group">
                              <img
                                src={preview}
                                alt={`Before Preview ${idx + 1}`}
                                className="h-20 w-20 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCroppingIndex(idx);
                                }}
                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 cursor-pointer"
                                title="ครอบ/เน้นจุดชำรุด"
                              >
                                <Crop className="h-4 w-4 text-blue-300" />
                                <span>ครอบภาพ</span>
                              </button>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-[9px] font-mono text-slate-500 truncate max-w-[60px]" title={fileObj?.name}>
                              {fileObj?.name || `File ${idx + 1}`}
                            </span>
                            {!isVideo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCroppingIndex(idx);
                                }}
                                className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="ครอบภาพ"
                              >
                                <Crop className="h-2.5 w-2.5" />
                                <span>ครอบ</span>
                              </button>
                            )}
                          </div>
                          {/* Custom Text Label Input for each uploaded image */}
                          {!isVideo && (
                            <div className="w-full mt-1.5 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                              <div className="relative flex items-center">
                                <Tag className="h-2.5 w-2.5 text-blue-500 absolute left-1.5 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="ข้อความกำกับ เช่น จุดท่อแตก..."
                                  value={beforeLabels[idx] || ""}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const updated = [...beforeLabels];
                                    updated[idx] = e.target.value;
                                    setBeforeLabels(updated);
                                  }}
                                  className="w-full pl-5 pr-1.5 py-0.5 text-[10px] font-medium border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                                  title="พิมพ์ข้อความกำกับภาพที่จะฝังลงบนรูป"
                                />
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedFiles = [...beforeFiles];
                              const updatedPreviews = [...beforePreviews];
                              const updatedLabels = [...beforeLabels];
                              updatedFiles.splice(idx, 1);
                              updatedPreviews.splice(idx, 1);
                              updatedLabels.splice(idx, 1);
                              setBeforeFiles(updatedFiles);
                              setBeforePreviews(updatedPreviews);
                              setBeforeLabels(updatedLabels);
                            }}
                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => document.getElementById("camera-file-input")?.click()}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>เปิดกล้องถ่ายภาพ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("file-input")?.click()}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      เพิ่มไฟล์จากเครื่อง...
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-8 w-8 text-blue-500 mx-auto" />
                  <div>
                    <span className="text-sm font-bold text-slate-800">ลากและวางไฟล์ที่นี่</span>
                    <span className="text-sm text-slate-500"> หรือเลือกวิธีอัปโหลด</span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => document.getElementById("camera-file-input")?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                      <span>เปิดกล้องถ่ายรูป</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("file-input")?.click()}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="h-4 w-4 text-slate-500" />
                      <span>เลือกไฟล์จากเครื่อง</span>
                    </button>
                  </div>
                  <p className="text-xxs text-slate-500 font-medium">รองรับทุกไฟล์: รูปภาพ (JPG, PNG), คลิปวิดีโอ (MP4, MOV) และเอกสาร</p>
                  <p className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg inline-block shadow-2xs mt-1">
                    🛡️ ระบบจะบีบอัดภาพและบันทึกไฟล์ลงเซิร์ฟเวอร์หลัก (Server Storage) ถาวรอัตโนมัติ — ข้อมูลไม่สูญหายแม้ล้างแคชเบราว์เซอร์
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-3 border-t border-slate-100 justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:bg-blue-400 cursor-pointer shadow-md shadow-blue-600/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังอัปโหลดและบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>บันทึกงานแจ้งซ่อม</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {croppingIndex !== null && beforePreviews[croppingIndex] && (
        <ImageCropperModal
          imageSrc={beforePreviews[croppingIndex]}
          fileName={beforeFiles[croppingIndex]?.name || `damage_photo_${croppingIndex + 1}.jpg`}
          onClose={() => setCroppingIndex(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
