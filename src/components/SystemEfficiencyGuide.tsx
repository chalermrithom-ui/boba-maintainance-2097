import React, { useState } from "react";
import { Bell, Volume2, ShieldCheck, Smartphone, Sparkles, CheckCircle2, Download, Printer, DollarSign, Clock, HelpCircle, HardDrive, Trash2, RefreshCw, Radio, Zap } from "lucide-react";
import { UserRole } from "../types";

interface SystemEfficiencyGuideProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRequestNotificationPermission: () => void;
  notificationPermission: string;
  onTestSoundAndNotif: () => void;
  onForceBackup?: () => void;
  onOpenCleanupModal?: () => void;
  userRole?: UserRole;
  pollingInterval?: number;
  onChangePollingInterval?: (intervalMs: number) => void;
}

export const SystemEfficiencyGuide: React.FC<SystemEfficiencyGuideProps> = ({
  soundEnabled,
  onToggleSound,
  onRequestNotificationPermission,
  notificationPermission,
  onTestSoundAndNotif,
  onForceBackup,
  onOpenCleanupModal,
  userRole,
  pollingInterval = 6000,
  onChangePollingInterval,
}) => {
  const [testResult, setTestResult] = useState<string>("");

  const handleTest = () => {
    onTestSoundAndNotif();
    setTestResult("ส่งเสียงแจ้งเตือนและข้อความทดสอบเรียบร้อยแล้ว!");
    setTimeout(() => setTestResult(""), 4000);
  };

  const isAdmin = userRole === UserRole.ADMIN;
  const currentIntervalSec = Math.round(pollingInterval / 1000);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6 text-left">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950 font-display flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>คำแนะนำการใช้งานระบบให้มีประสิทธิภาพสูงสุด & การตั้งค่าระบบ</span>
          </h2>
          <p className="text-xxs text-slate-500 mt-1">
            คู่มือแนะนำการรับแจ้งเตือนเมื่อสั่งงานหรือใช้เงินใน Web App พร้อมขั้นตอนรักษาข้อมูลให้ปลอดภัยไม่สูญหาย และการตั้งค่ารอบเวลาดึงข้อมูลเบื้องหลัง
          </p>
        </div>

        {/* Quick Test Alert Button */}
        <button
          onClick={handleTest}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer self-start md:self-auto flex-shrink-0"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>ทดสอบระบบแจ้งเตือน & เสียง</span>
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* SECTION 1: MOBILE NOTIFICATION, SOUND ALERT, & POLLING RATE CONFIG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Box A: Phone Browser Notification Permission */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Smartphone className="w-4.5 h-4.5 text-blue-600" />
                <span>1. การแจ้งเตือนบนหน้าจอ (Push)</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                notificationPermission === "granted"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {notificationPermission === "granted" ? "อนุญาตแล้ว ✓" : "ยังไม่อนุญาต"}
              </span>
            </div>

            <p className="text-xxs text-slate-600 leading-relaxed mb-3">
              เมื่อเปิด Web App บนโทรศัพท์มือถือ หรือคอมพิวเตอร์ ระบบสามารถส่งการแจ้งเตือนป๊อปอัปแจ้งเหตุการณ์สำคัญ เช่น มีงานซ่อมใหม่ หรือการเบิกจ่ายเงินสด
            </p>
          </div>

          <button
            onClick={onRequestNotificationPermission}
            disabled={notificationPermission === "granted"}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              notificationPermission === "granted"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {notificationPermission === "granted"
                ? "เปิดรับแจ้งเตือนบนอุปกรณ์นี้แล้ว"
                : "กดเปิดอนุญาตการแจ้งเตือน"}
            </span>
          </button>
        </div>

        {/* Box B: Sound Effect Alert Chime */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Volume2 className="w-4.5 h-4.5 text-indigo-600" />
                <span>2. เสียงกระดิ่งเตือนทันที (Audio)</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                soundEnabled
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-200 text-slate-600"
              }`}>
                {soundEnabled ? "เปิดเสียง" : "ปิดเสียง"}
              </span>
            </div>

            <p className="text-xxs text-slate-600 leading-relaxed mb-3">
              เมื่อมีการอัปเดตงานซ่อมแซม หรือมีการบันทึกเบิกจ่ายเงินสด/โอนเงินช่าง ระบบจะเล่นเสียงกระดิ่งเตือนให้รับทราบทันทีแบบ Real-time
            </p>
          </div>

          <button
            onClick={onToggleSound}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              soundEnabled
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{soundEnabled ? "ปิดเสียงสัญญาณเตือน" : "เปิดเสียงสัญญาณเตือน"}</span>
          </button>
        </div>

        {/* Box C: Background Data Polling Interval Settings (Admin Only) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <RefreshCw className="w-4.5 h-4.5 text-emerald-600 animate-spin" style={{ animationDuration: `${Math.max(currentIntervalSec, 2)}s` }} />
                <span>3. ความถี่การดึงข้อมูลเบื้องหลัง (Polling)</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-black flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span>{currentIntervalSec}s</span>
              </span>
            </div>

            <p className="text-xxs text-slate-600 leading-relaxed mb-2.5">
              กำหนดระยะเวลาดึงข้อมูลอัตโนมัติเบื้องหลัง
              {!isAdmin && <span className="text-rose-600 font-bold block mt-0.5">* สำหรับผู้ดูแลระบบ (Admin) เท่านั้นในการปรับแต่ง</span>}
            </p>

            {/* Interval Selection Buttons */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {[
                { label: "3s", value: 3000, title: "3 วินาที (เร็วสูงสุด)" },
                { label: "5s", value: 5000, title: "5 วินาที" },
                { label: "15s", value: 15000, title: "15 วินาที (สมดุล)" },
                { label: "30s", value: 30000, title: "30 วินาที (ประหยัด)" },
                { label: "60s", value: 60000, title: "1 นาที" },
              ].map((item) => {
                const isActive = pollingInterval === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => onChangePollingInterval && onChangePollingInterval(item.value)}
                    className={`py-1.5 px-1 rounded-lg text-xxs font-extrabold transition-all text-center border cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-2 ring-emerald-200"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    } ${!isAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={item.title}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>ความเร็วปัจจุบัน: <strong className="text-slate-800">ทุก {currentIntervalSec} วินาที</strong></span>
            </span>
            {isAdmin ? (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Admin Settings
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">
                ผู้ใช้งานทั่วไป
              </span>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 2: RECOMMENDATIONS FOR HIGH EFFICIENCY WORKFLOW */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2 border-b border-slate-700 pb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>คำแนะนำลำดับขั้นตอนการทำงานอย่างมีประสิทธิภาพ (Recommended Workflow)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xxs leading-relaxed text-slate-300">
          
          {/* Step 1 */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
            <span className="text-amber-400 font-bold block text-xs flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>1. ลงทะเบียน & นัดหมายล่วงหน้า</span>
            </span>
            <p>
              แอดมินลงทะเบียนงานใหม่ ระบุเลขห้อง อาคารคอนโด ช่างผู้ดูแล วันที่และเวลาเข้าซ่อม ระบบจะบันทึกลงปฏิทิน และส่งการแจ้งเตือนไปยังช่างรับผิดชอบ
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
            <span className="text-emerald-400 font-bold block text-xs flex items-center space-x-1">
              <Printer className="w-3.5 h-3.5" />
              <span>2. แนบรูปถ่าย & พิมพ์ PDF ใบงาน</span>
            </span>
            <p>
              ช่างกดรับงาน ถ่ายรูปก่อนซ่อม/หลังซ่อม และสามารถพิมพ์ใบสั่งซ่อมเป็น PDF เพื่อส่งมอบให้ลูกบ้านหรือนิติบุคคลคอนโดเซ็นชื่อรับรอง
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5">
            <span className="text-blue-400 font-bold block text-xs flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. บันทึกเงิน & สลิปหลักฐาน</span>
            </span>
            <p>
              เมื่อมีการชำระเงินค่าแรงหรือค่าอะไหล่ ให้กดปุ่ม <strong>"จ่ายเงินช่าง"</strong> ระบุยอดเงิน วิธีชำระเงิน และแนบสลิป ระบบจะแจ้งเตือนธุรกรรมทันที
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 3: DATA RETENTION & ANTI-RESET GUARANTEE */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            <span>ระบบจัดเก็บข้อมูลถาวร 3 ชั้น (Cloud Firestore + Server Disk + Local Backup)</span>
          </div>
          {onForceBackup && (
            <button
              onClick={onForceBackup}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto flex-shrink-0"
              title="ดาวน์โหลดไฟล์สำรองข้อมูล JSON เก็บไว้ในเครื่องเพื่อความปลอดภัยสูงสุด"
            >
              <Download className="w-3.5 h-3.5" />
              <span>สำรองข้อมูลทันที (Force Backup JSON)</span>
            </button>
          )}
        </div>
        <p className="text-xxs text-emerald-800 leading-relaxed">
          ข้อมูลงานซ่อม คลังอะไหล่ ประวัติการทำงาน และสลิปการเงินจะถูกบันทึกแบบ Real-time บน <strong>Firebase Cloud Firestore Database</strong> และไฟล์ดิสก์เซิร์ฟเวอร์ (<span className="font-mono text-emerald-900 font-bold">data/repairs.json</span>) นอกจากนี้ คุณสามารถกดปุ่ม <strong>Force Backup</strong> เพื่อดาวน์โหลดไฟล์สำรองข้อมูล JSON เก็บไว้ในอุปกรณ์ของคุณได้ตลอดเวลาเพื่อความสบายใจ 100%
        </p>
      </div>

      {/* SECTION 4: ADMIN STORAGE CLEANUP TOOL */}
      {userRole === UserRole.ADMIN && onOpenCleanupModal && (
        <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white rounded-2xl p-4.5 space-y-3 border border-rose-900/60 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white flex items-center space-x-2 font-display">
                  <span>เครื่องมือล้างข้อมูลขยะ & เพิ่มพื้นที่จัดเก็บ (Admin Storage Cleanup)</span>
                  <span className="bg-rose-500/30 text-rose-300 border border-rose-400/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    1-CLICK CLEAN
                  </span>
                </h3>
                <p className="text-xxs text-slate-300 mt-0.5">
                  ลบงานซ่อมสถานะ "ยกเลิก" หรือ "เก่ากว่า 6 เดือน" เพื่อคืนพื้นที่จัดเก็บ พร้อมสรุปความจุใน Log อัตโนมัติ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCleanupModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer flex-shrink-0 border border-rose-400/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>เปิดเครื่องมือล้างข้อมูลขยะ</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
