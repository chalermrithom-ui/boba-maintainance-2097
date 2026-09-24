import React, { useState, useEffect } from "react";
import { UserRole } from "../types";
import { Shield, Wrench, Wifi, WifiOff, RefreshCw, Bell, BellOff, QrCode, LogIn, LogOut, UserCheck, Printer } from "lucide-react";

interface NavbarProps {
  user: any;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onLogout: () => void;
  onLogin: () => void;
  isSyncing: boolean;
  isOnline?: boolean;
  spreadsheetId: string | null;
  notificationCount?: number;
  notificationPermission?: NotificationPermission;
  onRequestNotificationPermission?: () => void;
  onOpenTrackScanner?: () => void;
  onOpenRoomQrGenerator?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentRole,
  onChangeRole,
  onLogout,
  onLogin,
  isSyncing,
  isOnline: externalIsOnline,
  spreadsheetId,
  notificationCount = 0,
  notificationPermission = "default",
  onRequestNotificationPermission,
  onOpenTrackScanner,
  onOpenRoomQrGenerator,
}) => {
  const [internalIsOnline, setInternalIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setInternalIsOnline(true);
    const handleOffline = () => setInternalIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const online = externalIsOnline !== undefined ? externalIsOnline : internalIsOnline;

  return (
    <nav className="bg-[#0F172A] border-b border-slate-800 text-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-sm md:text-lg font-extrabold tracking-tight text-white font-display">
                B.O.B.A. Maintainance Request System
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Database Sync & Connection Status Indicator Badge */}
              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 shadow-2xs ${
                  !online
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    : isSyncing
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
                title={
                  !online
                    ? "ไม่ได้เชื่อมต่อเครือข่าย — ทำงานในโหมดแคชท้องถิ่น (Offline/Cached)"
                    : isSyncing
                    ? "กำลังซิงค์และบันทึกข้อมูลลงดิสก์เซิร์ฟเวอร์ (Syncing)"
                    : "เชื่อมต่อฐานข้อมูลเซิร์ฟเวอร์เรียบร้อยแล้ว (Online)"
                }
              >
                {/* Pulsing status dot */}
                <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                  {!online ? (
                    <>
                      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </>
                  ) : isSyncing ? (
                    <>
                      <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </>
                  ) : (
                    <>
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-pulse"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-xs shadow-emerald-400/80"></span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 truncate">
                  {!online ? (
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  ) : isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="font-extrabold tracking-tight">
                    {!online ? "Offline / Cached" : isSyncing ? "Syncing" : "Online"}
                  </span>
                  <span className="text-[10px] opacity-75 hidden lg:inline border-l border-current/20 pl-1.5 font-normal">
                    {!online ? "ออฟไลน์ (แคชท้องถิ่น)" : isSyncing ? "กำลังซิงค์..." : "เชื่อมต่อเซิร์ฟเวอร์ดิสก์"}
                  </span>
                </div>
              </div>

              {/* Quick Scan QR Code for Customer Job Tracking */}
              {onOpenTrackScanner && (
                <button
                  type="button"
                  onClick={onOpenTrackScanner}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="สแกน QR Code ติดตามสถานะงานซ่อมสำหรับลูกค้ารายห้อง"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">สแกน QR ติดตามงาน</span>
                </button>
              )}

              {/* Printable Room QR Code Generator Button for Admin */}
              {onOpenRoomQrGenerator && currentRole === UserRole.ADMIN && (
                <button
                  type="button"
                  onClick={onOpenRoomQrGenerator}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="พิมพ์ / สร้างแผ่น QR Code ประจำห้องพักคอนโด"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden md:inline">พิมพ์ QR ติดห้องพัก</span>
                </button>
              )}

              {/* Role Switcher for easy testing & authorization */}
              <div className="flex items-center bg-slate-800 p-1.5 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => onChangeRole(UserRole.ADMIN)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    currentRole === UserRole.ADMIN
                      ? "bg-blue-600 text-white font-medium shadow-sm shadow-blue-900/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  <span>แอดมิน</span>
                </button>
                <button
                  onClick={() => onChangeRole(UserRole.TECHNICIAN)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    currentRole === UserRole.TECHNICIAN
                      ? "bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-900/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Wrench className="h-3 w-3" />
                  <span>ช่างซ่อม</span>
                </button>
              </div>

              {/* Notification Permission Indicator Button */}
              {notificationPermission !== "granted" && onRequestNotificationPermission && (
                <button
                  onClick={onRequestNotificationPermission}
                  className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="คลิกเพื่อเปิดการแจ้งเตือนบนเบราว์เซอร์เมื่อมีงานซ่อมใหม่หรืออัปเดตสถานะ"
                >
                  <BellOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>เปิดการแจ้งเตือน</span>
                </button>
              )}

              {/* User Account / Login Button */}
              <div className="flex items-center space-x-2 border-l border-slate-700/80 pl-3">
                <button
                  type="button"
                  onClick={onLogin}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group"
                  title="คลิกเพื่อเข้าสู่ระบบ หรือเลือกสิทธิ์บัญชีแนะนำ"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 text-xs font-black uppercase shadow-inner">
                    {user?.userId ? user.userId.slice(0, 2).toUpperCase() : user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "OP"}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-white line-clamp-1">
                      {user?.userId ? `ID: ${user.userId}` : user?.displayName || "ผู้ใช้งานทั่วไป"}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold line-clamp-1">
                      {currentRole === UserRole.ADMIN ? "👑 สิทธิ์แอดมิน" : "🔧 สิทธิ์ช่างซ่อม"}
                    </span>
                  </div>
                  <LogIn className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform ml-1" />
                </button>

                {user && user.email !== "admin@boba-maintenance.com" && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
