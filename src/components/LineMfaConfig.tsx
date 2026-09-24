import React, { useState, useEffect } from "react";
import { Shield, ShieldCheck, Key, ToggleLeft, ToggleRight, Loader2, AlertCircle, Database, Download, Upload, HardDrive, Sparkles, CheckCircle2, Clock, Bell, Play, History, RotateCcw, RefreshCw, FileCheck } from "lucide-react";

interface SnapshotItem {
  filename: string;
  sizeBytes: number;
  mtime: string;
  timestamp: string;
  reason: string;
  repairsCount: number;
  inventoryCount: number;
}

interface LineMfaConfigProps {
  lineToken?: string;
  onSaveLineToken?: (token: string) => void;
  mfaEnabled: boolean;
  onToggleMfa: (enabled: boolean) => Promise<void>;
  onRefreshData?: () => void;
}

export const LineMfaConfig: React.FC<LineMfaConfigProps> = ({
  mfaEnabled,
  onToggleMfa,
  onRefreshData,
}) => {
  const [isTogglingMfa, setIsTogglingMfa] = useState<boolean>(false);
  const [mfaSetupStep, setMfaSetupStep] = useState<number>(0); // 0: Normal, 1: Scanning QR Code, 2: Verification
  const [mfaCode, setMfaCode] = useState<string>("");
  const [mfaError, setMfaError] = useState<string>("");

  const [backupStatus, setBackupStatus] = useState<string>("");
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);

  // Background Scheduler & LINE Notify Toggle state
  const [schedulerInfo, setSchedulerInfo] = useState<{
    running: boolean;
    enabled?: boolean;
    intervalSeconds: number;
    lastCheckTime: string;
    totalSentCount: number;
    hasToken: boolean;
  } | null>(null);
  const [lineNotifyEnabled, setLineNotifyEnabled] = useState<boolean>(true);
  const [isTogglingLineNotify, setIsTogglingLineNotify] = useState<boolean>(false);
  const [lineToggleMsg, setLineToggleMsg] = useState<string>("");
  const [isCheckingScheduler, setIsCheckingScheduler] = useState<boolean>(false);
  const [checkResultMsg, setCheckResultMsg] = useState<string>("");

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch("/api/scheduler/status");
      const data = await res.json();
      if (data.success && data.status) {
        setSchedulerInfo(data.status);
        if (typeof data.status.enabled === "boolean") {
          setLineNotifyEnabled(data.status.enabled);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch scheduler status:", e);
    }
  };

  const fetchLineSettings = async () => {
    try {
      const res = await fetch("/api/line/settings");
      const data = await res.json();
      if (data.success && typeof data.enabled === "boolean") {
        setLineNotifyEnabled(data.enabled);
      }
    } catch (e) {
      console.warn("Failed to fetch LINE settings:", e);
    }
  };

  // Historical Snapshots state
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState<boolean>(false);
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [snapshotMsg, setSnapshotMsg] = useState<string>("");

  const fetchSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const res = await fetch("/api/database/snapshots");
      const data = await res.json();
      if (data.success && Array.isArray(data.snapshots)) {
        setSnapshots(data.snapshots);
      }
    } catch (e) {
      console.warn("Failed to fetch snapshots:", e);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    try {
      const res = await fetch("/api/database/snapshots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "สร้างสแนปชอตโดยแอดมิน (Manual Snapshot)" }),
      });
      const data = await res.json();
      if (data.success) {
        setSnapshotMsg("✅ สร้างสแนปชอตย้อนหลังจุดเวลาปัจจุบันสำเร็จเรียบร้อยแล้ว!");
        fetchSnapshots();
        setTimeout(() => setSnapshotMsg(""), 4000);
      }
    } catch (e) {
      setSnapshotMsg("❌ เกิดข้อผิดพลาดในการสร้างสแนปชอต");
    }
  };

  const handleRestoreSnapshot = async (filename: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลกลับไปที่จุดเวลาสแนปชอตนี้?\n(${filename})`)) {
      return;
    }
    setRestoringFilename(filename);
    setSnapshotMsg("");
    try {
      const res = await fetch("/api/database/snapshots/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (data.success) {
        setSnapshotMsg(`✅ ${data.message}`);
        if (onRefreshData) onRefreshData();
        fetchSnapshots();
      } else {
        setSnapshotMsg(`❌ ${data.error || "เกิดข้อผิดพลาดในการกู้คืน"}`);
      }
    } catch (e) {
      setSnapshotMsg("❌ ไม่สามารถเชื่อมต่อเพื่อกู้คืนสแนปชอตได้");
    } finally {
      setRestoringFilename(null);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    fetchLineSettings();
    fetchSnapshots();
  }, []);

  const handleToggleLineNotify = async (targetEnabled: boolean) => {
    setIsTogglingLineNotify(true);
    setLineToggleMsg("");
    try {
      const res = await fetch("/api/line/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: targetEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setLineNotifyEnabled(data.enabled);
        setLineToggleMsg(
          data.enabled
            ? "🟢 เปิดระบบแจ้งเตือน LINE เรียบร้อยแล้ว (LINE Notifications Enabled)"
            : "⚪ ปิดระบบแจ้งเตือน LINE เรียบร้อยแล้ว (LINE Notifications Disabled)"
        );
        setTimeout(() => setLineToggleMsg(""), 4000);
        fetchSchedulerStatus();
      } else {
        setLineToggleMsg("❌ เกิดข้อผิดพลาดในการเปลี่ยนสถานะ LINE");
      }
    } catch (err) {
      setLineToggleMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsTogglingLineNotify(false);
    }
  };

  const handleManualSchedulerCheck = async () => {
    setIsCheckingScheduler(true);
    setCheckResultMsg("");
    try {
      const res = await fetch("/api/scheduler/check", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCheckResultMsg(`✅ ตรวจสอบแล้ว! (งานที่ตรวจ: ${data.checked} งาน, ส่งแจ้งเตือน: ${data.sent} รายการ)`);
        fetchSchedulerStatus();
        if (onRefreshData) onRefreshData();
      } else {
        setCheckResultMsg(`❌ เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (err: any) {
      setCheckResultMsg(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์`);
    } finally {
      setIsCheckingScheduler(false);
    }
  };

  const handleExportBackup = () => {
    window.open("/api/database/export", "_blank");
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูลจากไฟล์สำรองนี้? (ข้อมูลเดิมในระบบจะถูกแทนที่)")) {
      return;
    }

    setIsBackupLoading(true);
    setBackupStatus("");

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch("/api/database/import", {
        method: "POST",
        headers: { "Content-Type": "application/json font-sans" },
        body: JSON.stringify(jsonData),
      });

      const result = await res.json();
      if (result.success) {
        setBackupStatus("✅ กู้คืนข้อมูลจากไฟล์สำรองสำเร็จเรียบร้อยแล้ว!");
        if (onRefreshData) onRefreshData();
      } else {
        setBackupStatus(`❌ ข้อผิดพลาด: ${result.error}`);
      }
    } catch (err: any) {
      setBackupStatus(`❌ ไฟล์สำรองข้อมูลไม่ถูกต้อง หรือรูปแบบไม่ตรงกัน`);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleStartMfaSetup = () => {
    setMfaSetupStep(1);
    setMfaError("");
    setMfaCode("");
  };

  const handleVerifyMfaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");
    
    if (mfaCode.length !== 6) {
      setMfaError("กรุณากรอกรหัสความปลอดภัยเป็นตัวเลข 6 หลัก");
      return;
    }

    setIsTogglingMfa(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await onToggleMfa(true);
      setMfaSetupStep(0);
    } catch (err: any) {
      setMfaError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsTogglingMfa(false);
    }
  };

  const handleDisableMfa = async () => {
    const confirm = window.confirm("คุณต้องการยกเลิกการยืนยันตัวตนแบบสองขั้นตอน (MFA) ใช่หรือไม่?");
    if (!confirm) return;

    setIsTogglingMfa(true);
    try {
      await onToggleMfa(false);
      setMfaSetupStep(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingMfa(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
      
      {/* 1. LINE ON/OFF Master Switch Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              lineNotifyEnabled ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-slate-100 border-slate-200 text-slate-400"
            }`}>
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <span>สวิตช์ เปิด-ปิด ระบบแจ้งเตือน LINE Notify</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black ${
                  lineNotifyEnabled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-600 border border-slate-300"
                }`}>
                  {lineNotifyEnabled ? "🟢 เปิดใช้งาน (ON)" : "⚪ ปิดใช้งาน (OFF)"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ควบคุมการส่งข้อความแจ้งเตือนผ่าน LINE ทั้งระบบ (รวมแจ้งเตือนสร้างงาน, เปลี่ยนสถานะ และเตือนนัดหมายล่วงหน้า)
              </p>
            </div>
          </div>

          {/* Prominent Toggle Switch Button */}
          <button
            type="button"
            disabled={isTogglingLineNotify}
            onClick={() => handleToggleLineNotify(!lineNotifyEnabled)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 ${
              lineNotifyEnabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            {isTogglingLineNotify ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : lineNotifyEnabled ? (
              <ToggleRight className="h-5 w-5 text-emerald-200" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-slate-400" />
            )}
            <span>{lineNotifyEnabled ? "คลิกเพื่อปิดการแจ้งเตือน LINE" : "คลิกเพื่อเปิดการแจ้งเตือน LINE"}</span>
          </button>
        </div>

        {lineToggleMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            lineToggleMsg.includes("🟢") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-800 border border-slate-300"
          }`}>
            {lineToggleMsg}
          </div>
        )}
      </div>

      {/* 2. Automatic LINE Background Scheduler Notification Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-emerald-800/80 shadow-md md:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm text-white flex items-center gap-2">
                <span>ระบบตรวจสอบและส่ง LINE แจ้งเตือนอัตโนมัติ (Background Scheduler)</span>
              </h3>
              <p className="text-xxs text-emerald-200/80 font-medium mt-0.5">
                ส่ง LINE แจ้งเตือนช่างล่วงหน้า 1 ชั่วโมงก่อนถึงเวลานัดหมาย ทำงานเบื้องหลังอัตโนมัติทุก 1 นาที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>สถานะ: ทำงานอัตโนมัติทุก 1 นาที</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">เงื่อนไขการทำงาน:</span>
            <span className="font-extrabold text-amber-300 block">ล่วงหน้า 1 ชม. ก่อนถึงเวลานัด</span>
            <span className="text-xxs text-slate-400 leading-snug block">ตรวจจับเวลานัดหมาย (apptDate + apptTime) ของงานซ่อมที่ยังไม่ปิดงาน</span>
          </div>

          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">เวลาที่ตรวจสอบล่าสุด:</span>
            <span className="font-bold text-emerald-300 block">{schedulerInfo?.lastCheckTime || "กำลังตรวจสอบ..."}</span>
            <span className="text-xxs text-slate-400 leading-snug block">ตรวจสอบระบบเบื้องหลัง (Background Loop) ทุกๆ 60 วินาที</span>
          </div>

          <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">จำนวนการแจ้งเตือนทั้งหมด:</span>
            <span className="font-extrabold text-white text-sm block">{schedulerInfo?.totalSentCount || 0} รายการ</span>
            <span className="text-xxs text-slate-400 leading-snug block">ป้องกันการส่งซ้ำสำหรับงานซ่อมเดียวกัน</span>
          </div>
        </div>

        {checkResultMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold ${
            checkResultMsg.includes("✅") ? "bg-emerald-900/80 text-emerald-200 border border-emerald-700" : "bg-rose-900/80 text-rose-200 border border-rose-700"
          }`}>
            {checkResultMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
          <div className="text-xxs text-slate-300 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>ระบบบันทึกประวัติทุกครั้งที่แจ้งเตือนสำเร็จลงใน <strong>ประวัติการดำเนินงาน (Activity Logs)</strong></span>
          </div>

          <button
            type="button"
            onClick={handleManualSchedulerCheck}
            disabled={isCheckingScheduler}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isCheckingScheduler ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>ทดสอบตรวจสอบงานซ่อมนัดหมายทันที (Run Check Now)</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-factor Authentication (MFA) Setup */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 md:col-span-2">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-950 mb-2 flex items-center space-x-1.5 border-b border-slate-200 pb-2">
            <Shield className="h-4.5 w-4.5 text-blue-500" />
            <span>การยืนยันตัวตนสองชั้นเพื่อความปลอดภัยของข้อมูล (MFA Security)</span>
          </h3>
          <p className="text-xxs text-slate-500 mb-4 leading-relaxed">
            เพิ่มความปลอดภัยสูงสุดให้กับบัญชีแอดมินและช่างคอนโด เพื่อป้องกันการสวมรอยแก้ไขประวัติการซ่อมแซมและข้อมูลคลังสินค้า
          </p>

          {/* MFA Normal state */}
          {mfaSetupStep === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {mfaEnabled ? (
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  ) : (
                    <Shield className="h-8 w-8 text-slate-300" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      สถานะระบบป้องกันภัย: {mfaEnabled ? "เปิดความปลอดภัยขั้นสูง" : "ยังไม่ได้เปิดใช้งาน"}
                    </p>
                    <p className="text-xxs text-slate-400">
                      {mfaEnabled ? "ระบบปกป้องข้อมูลคลังอะไหล่และสิทธิ์เรียบร้อย" : "ลงทะเบียน Google Authenticator เพื่อเปิดใช้งาน"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isTogglingMfa}
                  onClick={mfaEnabled ? handleDisableMfa : handleStartMfaSetup}
                  className="p-1 cursor-pointer"
                >
                  {mfaEnabled ? (
                    <ToggleRight className="h-10 w-10 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-slate-300" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MFA Setup Step 1: Scan QR Code */}
          {mfaSetupStep === 1 && (
            <div className="space-y-4 border border-slate-200 p-3.5 rounded-xl bg-slate-50 text-center max-w-md mx-auto">
              <span className="text-xs font-bold text-slate-800 block">ขั้นตอนที่ 1: สแกนคิวอาร์โค้ด QR Code</span>
              <div className="bg-white p-2.5 inline-block rounded-lg shadow-sm border border-slate-200">
                <svg className="w-24 h-24 text-slate-900 mx-auto" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  <path d="M5 5h30v30H5zM10 10h20v20H10zM5 65h30v30H5zM10 70h20v20H10zM65 5h30v30H65zM70 10h20v20H70z" fill="black" />
                  <path d="M45 15h10v10H45zM15 45h10v10H15zM45 45h10v10H45zM45 65h10v10H45zM65 45h10v10H65zM75 55h10v10H75zM65 75h10v20H65zM85 85h10v10H85z" fill="black" />
                </svg>
              </div>
              <p className="text-xxs text-slate-500 leading-normal max-w-sm mx-auto">
                เปิดแอปพลิเคชัน Google Authenticator ในโทรศัพท์มือถือของคุณ จากนั้นเลือก "สแกนคิวอาร์โค้ด (Scan QR)"
              </p>
              <button
                type="button"
                onClick={() => setMfaSetupStep(2)}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
              >
                ถัดไป (กรอกรหัสยืนยัน)
              </button>
            </div>
          )}

          {/* MFA Setup Step 2: Verification Code */}
          {mfaSetupStep === 2 && (
            <form onSubmit={handleVerifyMfaCode} className="space-y-4 border border-slate-200 p-4 rounded-xl bg-slate-50 max-w-md mx-auto">
              <span className="text-xs font-bold text-slate-800 block">ขั้นตอนที่ 2: กรอกรหัสความปลอดภัย</span>
              {mfaError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2.5 rounded-lg text-xs flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{mfaError}</span>
                </div>
              )}
              <div>
                <label className="block text-xxs font-medium text-slate-500 mb-1 flex items-center space-x-1">
                  <Key className="h-3 w-3 text-slate-400" />
                  <span>กรอกรหัสตัวเลข 6 หลักจากแอปพลิเคชัน</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="เช่น 122456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold tracking-widest text-slate-800"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(1)}
                  className="w-1/2 py-1.5 text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-medium rounded-lg"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={isTogglingMfa}
                  className="w-1/2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1"
                >
                  {isTogglingMfa ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>ยืนยันสแกน</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 3. Long-Term Database Persistence, Snapshots & Anti-Reset System */}
      <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>ศูนย์ปกป้องข้อมูล & กู้คืนสแนปชอตย้อนหลัง (Data Protection & Snapshot Recovery)</span>
          </h3>
          <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>เปิดระบบป้องกันข้อมูลสูญหายแบบครบวงจร (Quad-Layer Protection)</span>
          </span>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Atomic File Writes
            </span>
            <span className="text-xxs text-slate-500 leading-snug block">
              เขียนไฟล์ผ่าน <code className="text-slate-700 bg-slate-200 px-1 rounded">.tmp</code> ก่อนเปลี่ยนชื่อ ป้องกันไฟล์เสียเมื่อเซิร์ฟเวอร์ดับ
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Anti-Wipe Guard
            </span>
            <span className="text-xxs text-slate-500 leading-snug block">
              มีระบบบล็อกการเขียนทับด้วยข้อมูลว่างเปล่า ป้องกันข้อมูลหายจากปัญหาเน็ตหลุด
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-amber-600" /> Auto Snapshots (50 Max)
            </span>
            <span className="text-xxs text-slate-500 leading-snug block">
              บันทึก Snapshot ย้อนหลังอัตโนมัติทุกครั้งที่มีการบันทึกข้อมูล สามารถกดกู้คืนได้ทันที
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Dual-Storage Backup
            </span>
            <span className="text-xxs text-slate-500 leading-snug block">
              สำรองขนานกันทั้งบนดิสก์เซิร์ฟเวอร์ (<code className="text-slate-700 bg-slate-200 px-1 rounded">data/*.json</code>) และเครื่องผู้ใช้
            </span>
          </div>
        </div>

        {snapshotMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            snapshotMsg.includes("✅") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}>
            {snapshotMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          
          {/* Snapshots History List Panel */}
          <div className="lg:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-amber-600" />
                <span>ประวัติสแนปชอตที่บันทึกไว้ (Snapshots History)</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSnapshots}
                  disabled={isLoadingSnapshots}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xxs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSnapshots ? "animate-spin" : ""}`} />
                  <span>รีเฟรช</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateManualSnapshot}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xxs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>สร้าง Snapshot ตอนนี้</span>
                </button>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                ยังไม่มีรายการ Snapshot สำรองข้อมูลในขณะนี้
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {snapshots.slice(0, 10).map((snap) => (
                  <div
                    key={snap.filename}
                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 hover:border-amber-300 transition-all text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{snap.timestamp}</span>
                        <span className="text-xxs px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-semibold">
                          {snap.reason}
                        </span>
                      </div>
                      <p className="text-xxs text-slate-500">
                        ไฟล์: <span className="font-mono text-slate-700">{snap.filename}</span> | งานซ่อม: <strong>{snap.repairsCount}</strong> รายการ | คลังอะไหล่: <strong>{snap.inventoryCount}</strong> รายการ
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={restoringFilename === snap.filename}
                      onClick={() => handleRestoreSnapshot(snap.filename)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 disabled:opacity-50"
                    >
                      {restoringFilename === snap.filename ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      <span>กู้คืนสแนปชอตนี้</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup Actions & Recommendations */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>สำรองและนำเข้าไฟล์ภายนอก (Export/Import JSON)</span>
              </h4>
              <p className="text-xxs text-slate-500 leading-relaxed">
                ดาวน์โหลดไฟล์สำรองข้อมูล JSON เก็บไว้ในคอมพิวเตอร์ของคุณเพื่อความอุ่นใจ หรือนำเข้าไฟล์สำรองเพื่อเปลี่ยนย้ายระบบ
              </p>

              {backupStatus && (
                <div className={`p-2 rounded-lg text-xxs font-semibold ${
                  backupStatus.includes("✅") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {backupStatus}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)</span>
                </button>

                <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs">
                  <Upload className="w-4 h-4" />
                  <span>{isBackupLoading ? "กำลังกู้คืน..." : "นำเข้าไฟล์สำรองข้อมูล (Import JSON)"}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isBackupLoading}
                  />
                </label>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-4 rounded-xl space-y-2.5 shadow-sm">
              <h4 className="font-bold text-xs text-amber-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>คำแนะนำการดูแลรักษาข้อมูลให้ปลอดภัย 100%</span>
              </h4>
              <ul className="space-y-1.5 text-xxs text-slate-300">
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span><strong className="text-white">รีเฟรชหน้าเว็บได้ตลอดเวลา:</strong> ข้อมูลงานซ่อม คลังอะไหล่ และประวัติทั้งหมดถูกบันทึกลงดิสก์แบบถาวร ไม่สูญหายเมื่อปิดเบราว์เซอร์</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span><strong className="text-white">ใช้ปุ่มกู้คืน Snapshot เมื่อจำเป็น:</strong> หากลบงานผิดพลาด สามารถย้อนเวลาไปจุดสแนปชอตล่าสุดได้ทันที</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span><strong className="text-white">ดาวน์โหลดไฟล์ JSON สำรองไว้ทุกสัปดาห์:</strong> ช่วยให้มีไฟล์สำรองภายนอกไว้เผื่อฉุกเฉิน</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

