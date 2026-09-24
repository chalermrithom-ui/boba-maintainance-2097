import React, { useState, useEffect } from "react";
import { RepairJob, Part, JobStatus, PartUsed } from "../types";
import { X, Wrench, AlertCircle, Upload, CheckCircle2, Loader2, Crop, Pencil, Image as ImageIcon, Sparkles, Camera, Tag } from "lucide-react";
import { ImageCropperModal } from "./ImageCropperModal";
import { ImageAnnotatorModal } from "./ImageAnnotatorModal";
import { addLabelToImageFile } from "../utils/imageUtils";

interface TechnicianModalProps {
  job: RepairJob;
  inventory: Part[];
  onClose: () => void;
  onSubmit: (
    jobId: string,
    newStatus: JobStatus,
    notes: string,
    partsUsed: PartUsed[],
    afterPhotoFiles: File[],
    paymentData?: any,
    beforePhotoFiles?: File[]
  ) => Promise<void>;
  imageBlobCache?: Record<string, string>;
  loadImageWithBlob?: (fileId: string) => Promise<void>;
}

export const TechnicianModal: React.FC<TechnicianModalProps> = ({
  job,
  inventory,
  onClose,
  onSubmit,
  imageBlobCache,
  loadImageWithBlob,
}) => {
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [notes, setNotes] = useState<string>(job.notes || "");

  // After repair image state (Multiple images)
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [afterPreviews, setAfterPreviews] = useState<string[]>([]);
  const [afterLabels, setAfterLabels] = useState<string[]>([]);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);

  // Before repair image state (Newly added/annotated before photos)
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [beforePreviews, setBeforePreviews] = useState<string[]>([]);
  const [beforeLabels, setBeforeLabels] = useState<string[]>([]);

  // Annotator Modal state
  const [annotationTarget, setAnnotationTarget] = useState<{
    type: "newAfter" | "newBefore" | "existingBefore" | "existingAfter";
    index: number;
    src: string;
    fileName: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Trigger loading images from cache/server
  useEffect(() => {
    if (loadImageWithBlob) {
      if (job.beforeImg) {
        job.beforeImg.split(",").forEach((id) => {
          const trimmed = id.trim();
          if (trimmed) loadImageWithBlob(trimmed);
        });
      }
      if (job.afterImg) {
        job.afterImg.split(",").forEach((id) => {
          const trimmed = id.trim();
          if (trimmed) loadImageWithBlob(trimmed);
        });
      }
    }
  }, [job.beforeImg, job.afterImg, loadImageWithBlob]);

  const resolvePhotoUrl = (fileIdOrUrl: string): string => {
    if (!fileIdOrUrl) return "";
    if (
      fileIdOrUrl.startsWith("data:") ||
      fileIdOrUrl.startsWith("blob:") ||
      fileIdOrUrl.startsWith("http://") ||
      fileIdOrUrl.startsWith("https://")
    ) {
      return fileIdOrUrl;
    }
    if (imageBlobCache && imageBlobCache[fileIdOrUrl]) {
      return imageBlobCache[fileIdOrUrl];
    }
    return `/api/database/image/${encodeURIComponent(fileIdOrUrl)}`;
  };

  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    if (croppingIndex !== null && croppingIndex >= 0 && croppingIndex < afterFiles.length) {
      const updatedFiles = [...afterFiles];
      const updatedPreviews = [...afterPreviews];
      updatedFiles[croppingIndex] = croppedFile;
      updatedPreviews[croppingIndex] = croppedPreviewUrl;
      setAfterFiles(updatedFiles);
      setAfterPreviews(updatedPreviews);
    }
  };

  const handleAnnotationSave = (annotatedFile: File, annotatedPreviewUrl: string) => {
    if (!annotationTarget) return;
    const { type, index } = annotationTarget;

    if (type === "newAfter") {
      const updatedFiles = [...afterFiles];
      const updatedPreviews = [...afterPreviews];
      updatedFiles[index] = annotatedFile;
      updatedPreviews[index] = annotatedPreviewUrl;
      setAfterFiles(updatedFiles);
      setAfterPreviews(updatedPreviews);
    } else if (type === "newBefore") {
      const updatedFiles = [...beforeFiles];
      const updatedPreviews = [...beforePreviews];
      updatedFiles[index] = annotatedFile;
      updatedPreviews[index] = annotatedPreviewUrl;
      setBeforeFiles(updatedFiles);
      setBeforePreviews(updatedPreviews);
    } else if (type === "existingBefore" || type === "existingAfter") {
      // Add annotated image as new file upload for before or after
      if (type === "existingBefore") {
        setBeforeFiles((prev) => [...prev, annotatedFile]);
        setBeforePreviews((prev) => [...prev, annotatedPreviewUrl]);
        setBeforeLabels((prev) => [...prev, ""]);
      } else {
        setAfterFiles((prev) => [...prev, annotatedFile]);
        setAfterPreviews((prev) => [...prev, annotatedPreviewUrl]);
        setAfterLabels((prev) => [...prev, ""]);
      }
    }
    setAnnotationTarget(null);
  };

  const handleAfterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      if (selectedFiles.length > 0) {
        const newFiles = [...afterFiles, ...selectedFiles];
        setAfterFiles(newFiles);

        const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
        setAfterPreviews([...afterPreviews, ...newPreviews]);
        setAfterLabels([...afterLabels, ...selectedFiles.map(() => "")]);
      }
    }
  };

  const handleBeforeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      if (selectedFiles.length > 0) {
        const newFiles = [...beforeFiles, ...selectedFiles];
        setBeforeFiles(newFiles);

        const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
        setBeforePreviews([...beforePreviews, ...newPreviews]);
        setBeforeLabels([...beforeLabels, ...selectedFiles.map(() => "")]);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (status === JobStatus.COMPLETED && !notes.trim()) {
      setError("กรุณากรอกบันทึกรายละเอียดงานซ่อมแซมก่อนปรับสถานะเสร็จสิ้น");
      return;
    }

    setIsSubmitting(true);
    try {
      // Process before and after files to burn custom text labels onto image canvas if provided
      const processedBeforeFiles = await Promise.all(
        beforeFiles.map((file, idx) => addLabelToImageFile(file, beforeLabels[idx] || ""))
      );
      const processedAfterFiles = await Promise.all(
        afterFiles.map((file, idx) => addLabelToImageFile(file, afterLabels[idx] || ""))
      );

      // Collect label tags to append to notes if available
      const beforeTags = beforeLabels.map((lbl, idx) => lbl?.trim() ? `[รูปก่อนซ่อม ${idx + 1}: ${lbl.trim()}]` : "").filter(Boolean);
      const afterTags = afterLabels.map((lbl, idx) => lbl?.trim() ? `[รูปหลังซ่อม ${idx + 1}: ${lbl.trim()}]` : "").filter(Boolean);
      const allTags = [...beforeTags, ...afterTags];

      let finalNotes = notes.trim();
      if (allTags.length > 0) {
        finalNotes = finalNotes
          ? `${finalNotes}\n📌 ป้ายกำกับรูปภาพ: ${allTags.join(" ")}`
          : `📌 ป้ายกำกับรูปภาพ: ${allTags.join(" ")}`;
      }

      await onSubmit(job.id, status, finalNotes, [], processedAfterFiles, undefined, processedBeforeFiles);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการอัปเดตงานซ่อม");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract existing before & after image IDs
  const existingBeforeIds = job.beforeImg
    ? job.beforeImg.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const existingAfterIds = job.afterImg
    ? job.afterImg.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-display font-semibold text-base md:text-lg">อัปเดตและบันทึกรายงานงานซ่อม</h3>
              <p className="text-slate-400 text-xxs font-mono mt-0.5">งาน: {job.id} | ห้อง: {job.roomNo} ({job.condoName})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto text-left">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Details (ReadOnly) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xxs uppercase tracking-wider font-bold text-slate-500 block mb-1">
              อาการแจ้งซ่อม / ปัญหาที่ชำรุด
            </span>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {job.details}
            </p>
          </div>

          {/* SECTION 1: BEFORE REPAIR PHOTOS & ANNOTATIONS */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <label className="text-xs font-extrabold text-amber-950">
                  รูปภาพ/หลักฐานก่อนการซ่อมแซม (Before Repair Photos)
                </label>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => document.getElementById("before-camera-input")?.click()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>เปิดกล้องถ่ายรูป</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("before-file-input")?.click()}
                  className="px-3 py-1 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ เลือกไฟล์ภาพ</span>
                </button>
              </div>
              <input
                id="before-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleBeforeFileChange}
              />
              <input
                id="before-file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBeforeFileChange}
              />
            </div>

            {/* List of Existing & New Before Photos */}
            {existingBeforeIds.length === 0 && beforePreviews.length === 0 ? (
              <p className="text-xs text-amber-700/80 italic font-medium">ยังไม่มีภาพก่อนการซ่อมแซม</p>
            ) : (
              <div className="flex flex-wrap gap-3 pt-1">
                {/* Existing Before Photos from Database */}
                {existingBeforeIds.map((fileId, idx) => {
                  const url = resolvePhotoUrl(fileId);
                  return (
                    <div key={`exist_before_${idx}`} className="relative bg-white p-1 rounded-xl border border-amber-200 shadow-2xs group flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Existing Before ${idx + 1}`}
                        className="h-20 w-24 object-cover rounded-lg"
                      />
                      <div className="flex items-center space-x-1 mt-1.5 w-full justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setAnnotationTarget({
                              type: "existingBefore",
                              index: idx,
                              src: url,
                              fileName: `before_repair_${idx + 1}.png`,
                            })
                          }
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold flex items-center space-x-1 cursor-pointer shadow-2xs"
                          title="วาดและทำเครื่องหมายวงกลม/ลูกศรบนภาพก่อนซ่อม"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>วาดมาร์กจุด</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Newly Uploaded/Annotated Before Photos */}
                {beforePreviews.map((preview, idx) => (
                  <div key={`new_before_${idx}`} className="relative bg-white p-1 rounded-xl border border-amber-300 ring-2 ring-amber-400/40 shadow-2xs flex flex-col items-center">
                    <img
                      src={preview}
                      alt={`New Before ${idx + 1}`}
                      className="h-20 w-24 object-cover rounded-lg"
                    />
                    <div className="flex items-center space-x-1 mt-1.5 w-full justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setAnnotationTarget({
                            type: "newBefore",
                            index: idx,
                            src: preview,
                            fileName: beforeFiles[idx]?.name || `new_before_${idx + 1}.png`,
                          })
                        }
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold flex items-center space-x-1 cursor-pointer shadow-2xs"
                        title="วาด/แก้ไขมาร์ก"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>วาดมาร์ก</span>
                      </button>
                    </div>
                    {/* Custom Text Label Input */}
                    <div className="w-full mt-1.5 pt-1 border-t border-amber-100" onClick={(e) => e.stopPropagation()}>
                      <div className="relative flex items-center">
                        <Tag className="h-2.5 w-2.5 text-amber-600 absolute left-1.5 pointer-events-none" />
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
                          className="w-full pl-5 pr-1 py-0.5 text-[10px] font-medium border border-amber-200 rounded bg-amber-50/50 focus:bg-white focus:border-amber-500 focus:outline-none"
                          title="พิมพ์ข้อความกำกับภาพที่จะฝังลงบนรูป"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const files = [...beforeFiles];
                        const prevs = [...beforePreviews];
                        const labels = [...beforeLabels];
                        files.splice(idx, 1);
                        prevs.splice(idx, 1);
                        labels.splice(idx, 1);
                        setBeforeFiles(files);
                        setBeforePreviews(prevs);
                        setBeforeLabels(labels);
                      }}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Update */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ปรับสถานะการดำเนินงานปัจจุบัน *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value={JobStatus.PENDING}>{JobStatus.PENDING}</option>
                <option value={JobStatus.IN_PROGRESS}>{JobStatus.IN_PROGRESS}</option>
                <option value={JobStatus.UNDER_REVIEW}>{JobStatus.UNDER_REVIEW}</option>
                <option value={JobStatus.COMPLETED}>{JobStatus.COMPLETED}</option>
              </select>
            </div>

            {/* Upload After Image */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ไฟล์หลักฐานหลังการซ่อมแซมเสร็จสิ้น (รูปภาพ / คลิปวิดีโอ VDO / เอกสาร) - แนบได้หลายไฟล์
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById("after-camera-input")?.click()}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  <span>เปิดกล้องถ่ายรูป</span>
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("after-file-input")?.click()}
                  className="px-3.5 py-2 text-xs font-semibold text-indigo-700 border border-indigo-200 hover:bg-indigo-50 bg-white rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="h-4 w-4 text-indigo-600" />
                  <span>เลือกไฟล์จากเครื่อง</span>
                </button>
                <input
                  id="after-camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleAfterFileChange}
                />
                <input
                  id="after-file-input"
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={handleAfterFileChange}
                />
                <span className="text-xs text-slate-500 font-medium">
                  {afterFiles.length > 0 ? `เลือกไว้ ${afterFiles.length} ไฟล์` : "ยังไม่ได้เลือกไฟล์"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg inline-block shadow-2xs mt-1.5">
                🛡️ บันทึกลงดิสก์เซิร์ฟเวอร์หลัก (Server Storage) ถาวรอัตโนมัติ — ไม่สูญหายเมื่อล้างแคชหรือเปิดใน Incognito
              </p>
            </div>
          </div>

          {/* SECTION 2: AFTER REPAIR IMAGES & PREVIEWS WITH ANNOTATE & CROP */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ภาพหลักฐานหลังการซ่อม (After Photos)</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                รองรับ Crop ครอบภาพ & วาดมาร์กจุดซ่อม
              </span>
            </div>

            {existingAfterIds.length === 0 && afterPreviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic font-medium">ยังไม่มีการอัปโหลดภาพหลังซ่อม</p>
            ) : (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {/* Existing After Photos */}
                {existingAfterIds.map((fileId, idx) => {
                  const url = resolvePhotoUrl(fileId);
                  return (
                    <div key={`exist_after_${idx}`} className="relative border border-slate-200 rounded-xl p-1 bg-white shadow-2xs flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Existing After ${idx + 1}`}
                        className="h-20 w-24 object-cover rounded-lg"
                      />
                      <div className="flex items-center space-x-1 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setAnnotationTarget({
                              type: "existingAfter",
                              index: idx,
                              src: url,
                              fileName: `after_repair_${idx + 1}.png`,
                            })
                          }
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center space-x-0.5 cursor-pointer"
                          title="วาดมาร์กทำเครื่องหมายจุดซ่อม"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>มาร์ก</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Newly Uploaded After Photos */}
                {afterPreviews.map((preview, idx) => {
                  const fileObj = afterFiles[idx];
                  const isVideo = fileObj?.type?.startsWith("video/") || fileObj?.name?.match(/\.(mp4|mov|webm|avi|mkv)$/i);
                  return (
                    <div key={`new_after_${idx}`} className="relative border border-slate-200 rounded-xl p-1 bg-white shadow-2xs flex flex-col items-center">
                      {isVideo ? (
                        <div className="relative h-20 w-28 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                          <video src={preview} className="h-full w-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs">
                            🎬 VDO
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img
                            src={preview}
                            alt={`After Repair Preview ${idx + 1}`}
                            className="h-20 w-24 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-1 mt-1.5">
                        {!isVideo && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCroppingIndex(idx)}
                              className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[9px] font-bold flex items-center space-x-0.5 cursor-pointer"
                              title="ครอบตัดภาพ"
                            >
                              <Crop className="w-2.5 h-2.5" />
                              <span>ครอบ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAnnotationTarget({
                                  type: "newAfter",
                                  index: idx,
                                  src: preview,
                                  fileName: fileObj?.name || `after_repair_${idx + 1}.png`,
                                })
                              }
                              className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                              title="วาดวงกลม/ลูกศร/เน้นจุดซ่อม"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>วาดมาร์ก</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Custom Text Label Input */}
                      {!isVideo && (
                        <div className="w-full mt-1.5 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <div className="relative flex items-center">
                            <Tag className="h-2.5 w-2.5 text-indigo-500 absolute left-1.5 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="ข้อความกำกับ เช่น ซ่อมเสร็จแล้ว..."
                              value={afterLabels[idx] || ""}
                              onChange={(e) => {
                                e.stopPropagation();
                                const updated = [...afterLabels];
                                updated[idx] = e.target.value;
                                setAfterLabels(updated);
                              }}
                              className="w-full pl-5 pr-1 py-0.5 text-[10px] font-medium border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none"
                              title="พิมพ์ข้อความกำกับภาพที่จะฝังลงบนรูป"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const updatedFiles = [...afterFiles];
                          const updatedPreviews = [...afterPreviews];
                          const updatedLabels = [...afterLabels];
                          updatedFiles.splice(idx, 1);
                          updatedPreviews.splice(idx, 1);
                          updatedLabels.splice(idx, 1);
                          setAfterFiles(updatedFiles);
                          setAfterPreviews(updatedPreviews);
                          setAfterLabels(updatedLabels);
                        }}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>บันทึกรายละเอียดการซ่อมแซม / คำแนะนำการบำรุงรักษาเพิ่มเติม *</span>
              <span className={`text-xxs ${status === JobStatus.COMPLETED ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                {status === JobStatus.COMPLETED ? "จำเป็นสำหรับสถานะเสร็จสิ้น" : "มีประโยชน์มากสำหรับประวัติการซ่อม"}
              </span>
            </label>
            <textarea
              required={status === JobStatus.COMPLETED}
              rows={3}
              placeholder="กรอกวิธีแก้ไขซ่อมแซมและผลงานซ่อม เช่น ทำการปิดวาล์วน้ำแล้วเปลี่ยนอะไหล่สวมข้อต่อทองเหลืองตัวใหม่ ทาน้ำยากันซึม พันเทปหนา 15 รอบ ทดสอบแรงดันน้ำปกติดี..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100 justify-end">
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:bg-indigo-400 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูลและอัปโหลด...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ยืนยันการบันทึกงานซ่อม</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {croppingIndex !== null && afterPreviews[croppingIndex] && (
        <ImageCropperModal
          imageSrc={afterPreviews[croppingIndex]}
          fileName={afterFiles[croppingIndex]?.name || `after_repair_photo_${croppingIndex + 1}.jpg`}
          onClose={() => setCroppingIndex(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Image Annotator & Markup Modal */}
      {annotationTarget && (
        <ImageAnnotatorModal
          imageSrc={annotationTarget.src}
          fileName={annotationTarget.fileName}
          title={
            annotationTarget.type.toLowerCase().includes("before")
              ? "วาด/ทำเครื่องหมายจุดชำรุดบนรูปภาพก่อนซ่อม (Before Photo Markup)"
              : "วาด/ทำเครื่องหมายผลการแก้ไขบนรูปภาพหลังซ่อม (After Photo Markup)"
          }
          onClose={() => setAnnotationTarget(null)}
          onSave={handleAnnotationSave}
        />
      )}
    </div>
  );
};

