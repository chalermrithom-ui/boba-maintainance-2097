import React, { useEffect, useState } from "react";
import { Bell, BellOff, X, CheckCircle2, Clock, Wrench, AlertCircle, Sparkles, Volume2, VolumeX } from "lucide-react";
import { JobStatus } from "../types";

export interface AppNotification {
  id: string;
  type: "new_job" | "status_change" | "system";
  title: string;
  message: string;
  timestamp: Date;
  jobId?: string;
  read?: boolean;
}

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onSelectJob?: (jobId: string) => void;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const playNotificationSound = (tone: "chime" | "ping" | "alert" = "chime") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    if (tone === "ping") {
      // Short crisp ping tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.50, now); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (tone === "alert") {
      // Two urgent beeps
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(783.99, now + delay); // G5
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    } else {
      // Standard pleasant two-tone chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Audio chime play error:", e);
  }
};

export const NotificationToastContainer: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onClearAll,
  onSelectJob,
  notificationPermission,
  onRequestPermission,
  soundEnabled,
  onToggleSound,
}) => {
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);

  // Auto-dismiss individual active toasts after 8 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const activeUnread = notifications[0];
      const timer = setTimeout(() => {
        onDismiss(activeUnread.id);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  const activeToasts = notifications.slice(0, 3); // show up to 3 floating toasts

  return (
    <>
      {/* Top/Header Control Bar for Notifications in App */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center space-x-2">
        {/* Toggle Notification Drawer & Permission Button */}
        <div className="relative">
          <button
            onClick={() => setIsOpenDrawer(!isOpenDrawer)}
            className={`relative p-2.5 rounded-full border shadow-lg transition-all cursor-pointer flex items-center justify-center ${
              notifications.length > 0
                ? "bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-blue-600/30 ring-2 ring-blue-400/30"
                : "bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 backdrop-blur-md"
            }`}
            title="แจ้งเตือนงานซ่อมบำรุง"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-bounce shadow-xs">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification History Popover Drawer */}
          {isOpenDrawer && (
            <div className="absolute bottom-12 left-0 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-white p-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight font-display">
                    ศูนย์การแจ้งเตือน (Notifications)
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={onToggleSound}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                  </button>
                  <button
                    onClick={() => setIsOpenDrawer(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Browser Permission Prompt & Test Sound Controls */}
              <div className="mb-3 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {notificationPermission === "granted" ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ) : (
                      <BellOff className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-[11px] font-medium text-slate-300">
                      {notificationPermission === "granted"
                        ? "การแจ้งเตือนเบราว์เซอร์: เปิดใช้งานแล้ว"
                        : "การแจ้งเตือนเบราว์เซอร์: ยังไม่ได้เปิด"}
                    </span>
                  </div>

                  {notificationPermission !== "granted" && (
                    <button
                      onClick={onRequestPermission}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xxs font-bold cursor-pointer transition-colors"
                    >
                      เปิดใช้งาน
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-xxs">
                  <span className="text-slate-400">ทดสอบเสียงสัญญาณ:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => playNotificationSound("chime")}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-blue-600 text-white rounded font-bold transition-colors cursor-pointer"
                    >
                      🔊 เสียงกระดิ่ง
                    </button>
                    <button
                      type="button"
                      onClick={() => playNotificationSound("alert")}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-rose-600 text-white rounded font-bold transition-colors cursor-pointer"
                    >
                      🚨 เสียงเตือนด่วน
                    </button>
                  </div>
                </div>
              </div>

              {/* List of past notifications */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium">
                    ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.jobId && onSelectJob) onSelectJob(n.jobId);
                      }}
                      className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-left transition-colors cursor-pointer relative group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-blue-300 flex items-center space-x-1">
                          {n.type === "new_job" ? (
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Wrench className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span>{n.title}</span>
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {n.timestamp.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-normal leading-snug">
                        {n.message}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(n.id);
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-800 pt-2.5 mt-3 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">ทั้งหมด {notifications.length} รายการ</span>
                  <button
                    onClick={onClearAll}
                    className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    ล้างการแจ้งเตือนทั้งหมด
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Active Toast Stack (Bottom-Right) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 border border-slate-700/90 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-5 fade-in duration-300 relative overflow-hidden"
          >
            {/* Left Accent Bar */}
            <div
              className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                toast.type === "new_job"
                  ? "bg-amber-400"
                  : "bg-blue-500"
              }`}
            ></div>

            <div className="flex items-start justify-between pl-1">
              <div className="flex items-start space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    toast.type === "new_job"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {toast.type === "new_job" ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Wrench className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5 text-left pr-4">
                  <h4 className="font-extrabold text-xs text-white tracking-tight font-display flex items-center space-x-1.5">
                    <span>{toast.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-snug font-normal">
                    {toast.message}
                  </p>
                  <span className="text-[9px] text-slate-400 block pt-1 font-mono">
                    {toast.timestamp.toLocaleTimeString("th-TH")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
