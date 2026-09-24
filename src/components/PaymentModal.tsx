import React, { useState, useEffect } from "react";
import { RepairJob } from "../types";
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  DollarSign,
  Image as ImageIcon,
  Eye,
  Copy,
  Check,
  Building2,
  Save,
  BookmarkCheck,
  Wallet,
} from "lucide-react";

interface TechBankDetail {
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
}

const DEFAULT_TECH_BANKS: Record<string, TechBankDetail> = {
  "SKY": {
    bankName: "ธนาคารกสิกรไทย (KBANK)",
    bankAccountNo: "123-2-89450-1",
    bankAccountName: "นายสมชาย (ช่าง SKY)",
  },
  "Jay Jay": {
    bankName: "ธนาคารไทยพาณิชย์ (SCB)",
    bankAccountNo: "408-1-55219-8",
    bankAccountName: "นายเจเจ (ช่าง Jay Jay)",
  },
  "CHAINS": {
    bankName: "พร้อมเพย์ (PromptPay)",
    bankAccountNo: "0812345678",
    bankAccountName: "นายเชนส์ (ช่าง CHAINS)",
  },
};

const COMMON_BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน (GSB)",
  "พร้อมเพย์ (PromptPay)",
  "อื่นๆ (ระบุเอง)",
];

interface PaymentModalProps {
  job: RepairJob;
  onClose: () => void;
  onSubmit: (
    jobId: string,
    method: string,
    amount: number,
    proofFile: File | null,
    notes: string
  ) => Promise<void>;
  imageBlobCache: { [key: string]: string };
  loadImageWithBlob: (id: string) => void;
  setSelectedMediaView: (view: { url: string; title?: string; type: "image" | "video" | "file" } | null) => void;
  techniciansList?: string[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  job,
  onClose,
  onSubmit,
  imageBlobCache,
  loadImageWithBlob,
  setSelectedMediaView,
  techniciansList = ["SKY", "Jay Jay", "CHAINS"],
}) => {
  const [method, setMethod] = useState<string>(job.paymentMethod || "ยังไม่ได้ชำระ");
  const [amount, setAmount] = useState<string>(job.paymentAmount ? String(job.paymentAmount) : "");
  const [notes, setNotes] = useState<string>(job.paymentNotes || "");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Technician selection for Bank account lookup
  const initialTech = job.technician ? job.technician.split(",")[0].trim() : (techniciansList[0] || "SKY");
  const [selectedTech, setSelectedTech] = useState<string>(initialTech || "SKY");
  const [bankName, setBankName] = useState<string>("");
  const [bankAccountNo, setBankAccountNo] = useState<string>("");
  const [bankAccountName, setBankAccountName] = useState<string>("");

  const [copiedBankNo, setCopiedBankNo] = useState<boolean>(false);
  const [copiedAllInfo, setCopiedAllInfo] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Load technician bank accounts from localStorage
  const getSavedTechBanksMap = (): Record<string, TechBankDetail> => {
    try {
      const stored = localStorage.getItem("boba_tech_bank_accounts_v2");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to read tech bank accounts from storage", e);
    }
    return DEFAULT_TECH_BANKS;
  };

  // Populate bank info whenever selectedTech changes
  useEffect(() => {
    if (!selectedTech) return;
    const map = getSavedTechBanksMap();
    const details = map[selectedTech] || DEFAULT_TECH_BANKS[selectedTech];
    if (details) {
      setBankName(details.bankName || "");
      setBankAccountNo(details.bankAccountNo || "");
      setBankAccountName(details.bankAccountName || "");
    } else {
      setBankName("ธนาคารกสิกรไทย (KBANK)");
      setBankAccountNo("");
      setBankAccountName(`ช่าง ${selectedTech}`);
    }
  }, [selectedTech]);

  // Save technician bank account info to localStorage
  const handleSaveTechBankInfo = () => {
    if (!selectedTech) return;
    try {
      const map = getSavedTechBanksMap();
      map[selectedTech] = {
        bankName,
        bankAccountNo,
        bankAccountName,
      };
      localStorage.setItem("boba_tech_bank_accounts_v2", JSON.stringify(map));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (e) {
      console.error("Failed to save tech bank account", e);
    }
  };

  // Copy Account Number with fallback
  const handleCopyAccountNo = async () => {
    if (!bankAccountNo) return;
    const cleanNo = bankAccountNo.trim();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanNo);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = cleanNo;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedBankNo(true);
      setTimeout(() => setCopiedBankNo(false), 2000);
    } catch (e) {
      console.error("Failed to copy account number:", e);
    }
  };

  // Copy all payment transfer info for pasting in banking apps
  const handleCopyAllInfo = async () => {
    const lines = [
      `👨‍🔧 ช่างรับเงิน: ${selectedTech}`,
      `🏦 ธนาคาร: ${bankName || "ไม่ระบุ"}`,
      `🔢 เลขบัญชี/พร้อมเพย์: ${bankAccountNo || "ไม่ระบุ"}`,
      `👤 ชื่อบัญชี: ${bankAccountName || "ไม่ระบุ"}`,
      `💰 ยอดที่ต้องโอน: ${amount ? `${amount} บาท` : "ไม่ระบุ"}`,
      `📋 งานซ่อม: ${job.id} (ห้อง ${job.roomNo})`,
    ];
    const fullText = lines.join("\n");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = fullText;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedAllInfo(true);
      setTimeout(() => setCopiedAllInfo(false), 2000);
    } catch (e) {
      console.error("Failed to copy all info:", e);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (method !== "ยังไม่ได้ชำระ" && (!amount || parseFloat(amount) <= 0)) {
      setError("กรุณาระบุจำนวนเงินค่าแรง/ค่าบริการจ่ายให้ช่างให้ถูกต้อง");
      return;
    }

    // Auto-save current technician bank account info to localStorage
    if (selectedTech) {
      handleSaveTechBankInfo();
    }

    // Append bank account details into notes if method is transfer or if bank info provided
    let finalNotes = notes;
    if (bankAccountNo && !notes.includes(bankAccountNo)) {
      const bankTag = `[โอนเข้า: ${selectedTech} | ${bankName || "ธนาคาร"} ${bankAccountNo} (${bankAccountName})]`;
      finalNotes = finalNotes ? `${finalNotes} ${bankTag}` : bankTag;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(job.id, method, parseFloat(amount) || 0, proofFile, finalNotes);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check existing attached payment slip
  const existingProofId = job.paymentProofImg;
  const existingProofUrl = existingProofId ? imageBlobCache[existingProofId] : null;
  if (existingProofId && !existingProofUrl) {
    loadImageWithBlob(existingProofId);
  }

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base md:text-lg text-white">บันทึกการจ่ายเงินให้ช่าง</h3>
              <p className="text-slate-400 text-xxs font-mono mt-0.5">งานซ่อม: {job.id} | ห้อง: {job.roomNo} ({job.condoName.split(" (")[0]})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-left max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Info Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
            <p className="font-bold text-slate-900">ช่างผู้ดูแล: <span className="text-blue-600 font-extrabold">{job.technician || "ไม่ระบุช่าง"}</span></p>
            <p><strong>รายละเอียดงาน:</strong> {job.details}</p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              เลือกรูปแบบการจ่ายเงิน *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("เงินสด")}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  method === "เงินสด"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">💵</span>
                <span>เงินสด (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("โอนเงิน")}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  method === "โอนเงิน"
                    ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">🏦</span>
                <span>โอนเงิน / สแกน</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("ยังไม่ได้ชำระ")}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  method === "ยังไม่ได้ชำระ"
                    ? "bg-slate-100 border-slate-400 text-slate-800 ring-2 ring-slate-400/20 shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">⏳</span>
                <span>ยังไม่ชำระ</span>
              </button>
            </div>
          </div>

          {/* Technician Bank Account Card Section (Especially prominent when transferring or paying) */}
          <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">ข้อมูลบัญชีธนาคารสำหรับจ่ายเงินช่าง</h4>
                  <p className="text-[10px] text-slate-500">เลือกช่างเพื่อดึงเลขบัญชีอัตโนมัติ หรือคัดลอกเข้าแอปธนาคาร</p>
                </div>
              </div>

              {savedNotice && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1 animate-in fade-in">
                  <BookmarkCheck className="h-3 w-3" />
                  <span>บันทึกแล้ว!</span>
                </span>
              )}
            </div>

            {/* Select Technician */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1">
                เลือกช่างที่จะโอนเงิน:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...techniciansList, ...(job.technician ? job.technician.split(",").map(t => t.trim()) : [])])).filter(Boolean).map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setSelectedTech(tech)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      selectedTech === tech
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    👨‍🔧 {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Name Dropdown/Input */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1">
                ชื่อธนาคาร / PromptPay:
              </label>
              <select
                value={COMMON_BANKS.includes(bankName) ? bankName : "อื่นๆ (ระบุเอง)"}
                onChange={(e) => {
                  if (e.target.value !== "อื่นๆ (ระบุเอง)") {
                    setBankName(e.target.value);
                  }
                }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {COMMON_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {(!COMMON_BANKS.includes(bankName) || bankName === "อื่นๆ (ระบุเอง)") && (
                <input
                  type="text"
                  placeholder="กรอกชื่อธนาคาร..."
                  value={bankName === "อื่นๆ (ระบุเอง)" ? "" : bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>

            {/* Account Number with Prominent COPY Button */}
            <div>
              <label className="block text-xxs font-bold text-slate-700 mb-1">
                เลขที่บัญชี / พร้อมเพย์:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="เช่น 123-4-56789-0 หรือ 0812345678"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCopyAccountNo}
                  disabled={!bankAccountNo}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                    copiedBankNo
                      ? "bg-emerald-600 text-white border border-emerald-600"
                      : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200"
                  }`}
                  title="กดคัดลอกเลขบัญชีเพื่อวางในแอปธนาคาร"
                >
                  {copiedBankNo ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>คัดลอกเลขบัญชี</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Name & Save Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-xxs font-bold text-slate-700 mb-1">
                  ชื่อบัญชี:
                </label>
                <input
                  type="text"
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-end space-x-1.5">
                <button
                  type="button"
                  onClick={handleSaveTechBankInfo}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                  title="บันทึกจำข้อมูลเลขบัญชีของช่างคนนี้ลงในเครื่อง"
                >
                  <Save className="h-3.5 w-3.5 text-blue-600" />
                  <span>บันทึกจำเลขบัญชี</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAllInfo}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                  title="คัดลอกรายละเอียดการโอนเงินทั้งหมด"
                >
                  {copiedAllInfo ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedAllInfo ? "คัดลอกแล้ว" : "คัดลอกทั้งหมด"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Amount Paid Field */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              จำนวนเงินค่าบริการ / ค่าแรงช่าง (บาท) {method !== "ยังไม่ได้ชำระ" && "*"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-extrabold text-sm">฿</span>
              <input
                type="number"
                min="0"
                required={method !== "ยังไม่ได้ชำระ"}
                placeholder="เช่น 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Upload Slip / Proof Image */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              แนบรูปภาพหลักฐานการจ่ายเงิน (สลิปโอน / ใบเสร็จรับเงินสด)
            </label>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("modal-proof-input")?.click()}
                  className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center space-x-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>แนบไฟล์รูปสลิปใหม่</span>
                </button>
                <input
                  id="modal-proof-input"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleProofChange}
                />
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {proofFile ? proofFile.name : "ยังไม่ได้เลือกไฟล์ใหม่"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg inline-block shadow-2xs mt-1">
                🛡️ บันทึกสลิปตรงลงดิสก์เซิร์ฟเวอร์หลัก (Server Storage) ถาวรอัตโนมัติ — ปลอดภัย ไม่ถูกลบเมื่อล้างแคช
              </p>

              {/* Display Proof Previews */}
              {proofPreview ? (
                <div className="p-2 border-2 border-emerald-300 rounded-xl bg-emerald-50/50 inline-block relative">
                  <span className="text-[10px] font-bold text-emerald-800 block mb-1">สลิปที่เลือกใหม่:</span>
                  <img src={proofPreview} alt="New Proof Preview" className="h-32 w-auto max-w-full object-contain rounded-lg border border-emerald-200 shadow-xs" />
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      setProofPreview(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 cursor-pointer shadow-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : existingProofId ? (
                <div className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <ImageIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">มีหลักฐานสลิปแนบไว้เดิมแล้ว</span>
                  </div>
                  {existingProofUrl ? (
                    <button
                      type="button"
                      onClick={() => setSelectedMediaView({
                        url: existingProofUrl,
                        title: `หลักฐานสลิปการจ่ายเงิน - งาน ${job.id}`,
                        type: "image"
                      })}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-800 flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>คลิกเพื่อดูสลิป</span>
                    </button>
                  ) : (
                    <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-bold text-emerald-700 flex items-center space-x-1.5 animate-pulse shadow-2xs">
                      <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                      <span className="text-[11px] font-extrabold tracking-tight">กำลังโหลดสลิป...</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              หมายเหตุเพิ่มเติมเกี่ยวกับการจ่ายเงิน ( optional )
            </label>
            <input
              type="text"
              placeholder="เช่น จ่ายผ่านบัญชี ธ.กสิกรไทย ช่างสมยศ หรือ ชำระสดหน้านิติบุคคล..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100 justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 disabled:bg-emerald-400 cursor-pointer shadow-md shadow-emerald-600/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึกสลิปและข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>บันทึกประวัติการจ่ายเงิน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

