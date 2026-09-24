import React, { useState, useEffect } from "react";
import { HardDrive, CheckCircle2, AlertTriangle, RefreshCw, LogOut, CloudUpload, ShieldCheck, FolderCheck, ExternalLink, Sparkles } from "lucide-react";

interface DriveStatus {
  isConnected: boolean;
  userEmail?: string;
  lastBackupTime?: string | null;
  status?: string;
  lastFileName?: string;
  driveFolderId?: string;
  message?: string;
}

interface GoogleDriveBackupCardProps {
  onTriggerBackupComplete?: () => void;
}

export const GoogleDriveBackupCard: React.FC<GoogleDriveBackupCardProps> = ({ onTriggerBackupComplete }) => {
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ isConnected: false });
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDriveStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/drive/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDriveStatus(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Google Drive status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchDriveStatus();

    // Listen for OAuth completion message from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "GOOGLE_DRIVE_CONNECTED") {
        setActionMessage({ type: "success", text: "เชื่อมต่อ Google Drive และเริ่มต้น Auto-Backup สำเร็จเรียบร้อยแล้ว!" });
        fetchDriveStatus();
        if (onTriggerBackupComplete) onTriggerBackupComplete();
      }
    };

    window.addEventListener("message", handleMessage);

    // Check query params if redirected
    const params = new URLSearchParams(window.location.search);
    if (params.get("driveConnected") === "true") {
      setActionMessage({ type: "success", text: "เชื่อมต่อ Google Drive สำเร็จเรียบร้อยแล้ว!" });
      fetchDriveStatus();
      // Clean query string without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleConnectDrive = async () => {
    setActionMessage(null);
    try {
      const res = await fetch("/api/auth/google/url");
      if (!res.ok) throw new Error("Failed to get Google OAuth URL");
      const data = await res.json();
      if (data.success && data.url) {
        // Open OAuth popup window
        const width = 550;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(
          data.url,
          "GoogleDriveOAuth",
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
        );
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: `เกิดข้อผิดพลาด: ${err.message || err}` });
    }
  };

  const handleDisconnectDrive = async () => {
    if (!confirm("คุณต้องการยกเลิกการเชื่อมต่อ Google Drive หรือไม่? (การสำรองข้อมูลอัตโนมัติจะหยุดทำงานจนกว่าจะเชื่อมต่อใหม่)")) return;
    try {
      const res = await fetch("/api/drive/logout", { method: "POST" });
      if (res.ok) {
        setActionMessage({ type: "success", text: "ยกเลิกการเชื่อมต่อ Google Drive เรียบร้อยแล้ว" });
        fetchDriveStatus();
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: `ยกเลิกการเชื่อมต่อไม่สำเร็จ: ${err.message}` });
    }
  };

  const handleManualBackupNow = async () => {
    setIsBackingUp(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/drive/backup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: "success",
          text: `สำรองข้อมูลสำเร็จ! สร้างไฟล์ '${data.fileName}' ในโฟลเดอร์ 'Auto-Backup' บน Google Drive เรียบร้อย`
        });
        await fetchDriveStatus();
        if (onTriggerBackupComplete) onTriggerBackupComplete();
      } else {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสำรองข้อมูล");
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: `สำรองข้อมูลไม่สำเร็จ: ${err.message || err}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return "ยังไม่มีประวัติการสำรองข้อมูล";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " น.";
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-left font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display font-bold text-base md:text-lg">Google Drive Daily Auto-Backup</h3>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-400/30">
                AUTOMATED
              </span>
            </div>
            <p className="text-xs text-slate-300 font-normal">
              ระบบสำรองข้อมูลรายวันอัตโนมัติไปยังโฟลเดอร์ <strong>'Auto-Backup'</strong> ป้องกันข้อมูลสูญหาย 100%
            </p>
          </div>
        </div>

        {/* Refresh Status Button */}
        <button
          onClick={fetchDriveStatus}
          disabled={isLoadingStatus}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          title="อัปเดตสถานะการเชื่อมต่อล่าสุด"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingStatus ? "animate-spin text-indigo-400" : ""}`} />
          <span>รีเฟรชสถานะ</span>
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Connection Alert message */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-900 border-rose-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Card & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Account Connection Status */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider block">
                สถานะการเชื่อมต่อ
              </span>
              {driveStatus.isConnected ? (
                <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping mr-0.5" />
                  <span>เชื่อมต่อแล้ว (Active)</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                  <span>ยังไม่ได้เชื่อมต่อ</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">บัญชี Google Drive ที่ผูกกับระบบ:</span>
              <p className="text-sm font-bold text-slate-900 font-mono break-all">
                {driveStatus.userEmail || (driveStatus.isConnected ? "Google Account Connected" : "ยังไม่ได้ผูกบัญชี Google")}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              {driveStatus.isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectDrive}
                  className="text-xxs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>ยกเลิกการเชื่อมต่อบัญชี</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
                >
                  <HardDrive className="h-4 w-4" />
                  <span>กดเชื่อมต่อ Google Drive ตอนนี้</span>
                </button>
              )}
            </div>
          </div>

          {/* Box 2: Automated Daily Backup Metrics */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider block">
                ข้อมูลการสำรองล่าสุด (Daily Backup Log)
              </span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200 flex items-center space-x-1">
                <FolderCheck className="h-3 w-3 text-blue-600" />
                <span>โฟลเดอร์: Auto-Backup</span>
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 block">เวลาที่สำรองข้อมูลล่าสุด:</span>
              <p className="text-xs font-extrabold text-slate-800">
                {formatDateTime(driveStatus.lastBackupTime)}
              </p>
              {driveStatus.lastFileName && (
                <p className="text-[11px] text-slate-500 font-mono pt-0.5">
                  📄 ไฟล์ล่าสุด: <span className="font-bold text-slate-700">{driveStatus.lastFileName}</span>
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleManualBackupNow}
                disabled={!driveStatus.isConnected || isBackingUp}
                className={`w-full py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs ${
                  !driveStatus.isConnected
                    ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                    : isBackingUp
                    ? "bg-indigo-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>กำลังส่งไฟล์สำรองไปยัง Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-3.5 w-3.5" />
                    <span>สำรองข้อมูลไปยัง Google Drive ทันที (Manual Backup)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Explanation & Resilience Features */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-slate-700 space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-indigo-950">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>คำแนะนำและระบบความปลอดภัยของการสำรองข้อมูล (Data Resilience):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 leading-relaxed text-[11px]">
            <li>
              <strong>การทำงานแบบอัตโนมัติ (Automated Daily Schedule):</strong> ระบบจะรันคำสั่งสำรองข้อมูลให้อัตโนมัติทุกๆ 24 ชั่วโมง โดยจะจัดเก็บลงในโฟลเดอร์ <code>Auto-Backup</code> บน Google Drive ของคุณโดยตรง
            </li>
            <li>
              <strong>การสะสมข้อมูลแบบ Incremental:</strong> ในแต่ละวัน ระบบจะสร้างหรืออัปเดตไฟล์สำรองชื่อ <code>boba_repair_backup_YYYY-MM-DD.json</code> รวมทั้งประวัติการแจ้งซ่อม, คลังอะไหล่, สมาชิก และบันทึกประวัติการทำงาน
            </li>
            <li>
              <strong>การป้องกันข้อมูลสูญหาย Triple-Layer:</strong> ระบบจัดเก็บข้อมูลซ้อน 3 ชั้น ทั้งใน <strong>Cloud Firestore</strong>, <strong>Server Local Disk (.bak)</strong>, และ <strong>Google Drive Auto-Backup</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
