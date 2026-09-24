import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

let lastCheckTime: string | null = null;
let totalSentCount = 0;
let isSchedulerRunning = false;
let isLineNotifyEnabled = true;

/**
 * Enable or disable LINE notification alerts
 */
export function setLineNotifyEnabled(enabled: boolean) {
  isLineNotifyEnabled = enabled;
  console.log(`[LineScheduler] LINE Notify status updated to: ${enabled ? "ENABLED (เปิด)" : "DISABLED (ปิด)"}`);
}

/**
 * Get current LINE notification status
 */
export function getLineNotifyEnabled(): boolean {
  return isLineNotifyEnabled;
}

// Helper to safely read JSON
function safeReadJSON(filename: string, fallbackDefault: any) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.trim()) {
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn(`[LineScheduler] Could not read ${filename}:`, e);
    }
  }
  return fallbackDefault;
}

// Helper to safely write JSON
function safeWriteJSON(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  const bakPath = path.join(DATA_DIR, `${filename}.bak`);
  if (fs.existsSync(filePath)) {
    try {
      const currentContent = fs.readFileSync(filePath, "utf8");
      if (currentContent.trim()) {
        fs.writeFileSync(bakPath, currentContent, "utf8");
      }
    } catch (e) {
      // ignore backup error
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Send LINE Notify message using provided token or env variable
 */
export async function sendLineNotification(message: string, customToken?: string): Promise<{ success: boolean; error?: string }> {
  if (!isLineNotifyEnabled) {
    console.log(`[LineNotify Skipped - LINE is OFF]:\n${message}`);
    return { success: false, error: "การแจ้งเตือน LINE ถูกปิดใช้งานอยู่ในขณะนี้ (LINE is OFF)" };
  }

  const token = customToken || process.env.LINE_NOTIFY_TOKEN || process.env.LINE_TOKEN;
  
  if (!token || !token.trim()) {
    console.log(`[LineNotify Log - No Token Configured]:\n${message}`);
    return { success: true, error: "Token not configured (logged to system)" };
  }

  try {
    const params = new URLSearchParams();
    params.append("message", message);

    const response = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${token.trim()}`,
      },
      body: params.toString(),
    });

    const result = await response.json();
    if (response.ok && result.status === 200) {
      return { success: true };
    } else {
      console.error("[LineNotify Error]:", result);
      return { success: false, error: result.message || "Failed to send LINE notification" };
    }
  } catch (err: any) {
    console.error("[LineNotify Network Error]:", err);
    return { success: false, error: err.message || "Network error sending LINE notification" };
  }
}

/**
 * Parse apptDate (YYYY-MM-DD or DD/MM/YYYY) and apptTime (HH:MM) into a JavaScript Date object
 */
export function parseApptDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;

  let year: number, month: number, day: number;
  const cleanDate = dateStr.trim();

  if (cleanDate.includes("-")) {
    // YYYY-MM-DD
    const parts = cleanDate.split("-").map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;
    [year, month, day] = parts;
  } else if (cleanDate.includes("/")) {
    // DD/MM/YYYY
    const parts = cleanDate.split("/").map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;
    [day, month, year] = parts;
  } else {
    return null;
  }

  let hours = 9;
  let minutes = 0;
  if (timeStr && timeStr.trim()) {
    const timeParts = timeStr.trim().split(":").map(Number);
    if (timeParts.length >= 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
      hours = timeParts[0];
      minutes = timeParts[1];
    }
  }

  const resultDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (isNaN(resultDate.getTime())) return null;

  return resultDate;
}

/**
 * Check repair jobs and trigger 1-hour prior LINE appointment reminders
 */
export async function checkAndSendAppointmentReminders(): Promise<{ checked: number; sent: number; logs: string[] }> {
  lastCheckTime = new Date().toLocaleString("th-TH");
  const logsSummary: string[] = [];
  let sentInThisCheck = 0;

  const repairs = safeReadJSON("repairs.json", []);
  const logs = safeReadJSON("logs.json", []);

  if (!Array.isArray(repairs) || repairs.length === 0) {
    return { checked: 0, sent: 0, logs: ["No repair jobs found in database"] };
  }

  const now = new Date();
  let repairsUpdated = false;

  for (const job of repairs) {
    // Only process jobs that are pending or in progress
    if (job.status === "COMPLETED" || job.status === "CANCELLED") continue;
    if (job.notified1hBefore) continue; // Already notified for this appointment

    const apptDateStr = job.apptDate || job.workDate;
    const apptTimeStr = job.apptTime || "09:00";

    const targetDateTime = parseApptDateTime(apptDateStr, apptTimeStr);
    if (!targetDateTime) continue;

    // Difference in minutes between appointment time and current time
    const diffMs = targetDateTime.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Trigger if appointment is between 0 and 65 minutes away
    if (diffMinutes >= -10 && diffMinutes <= 65) {
      console.log(`[LineScheduler] ⏰ Job ${job.id} appointment (${apptDateStr} ${apptTimeStr}) is in ${Math.round(diffMinutes)} mins. Sending 1h reminder...`);

      const technicianName = job.technician || "ช่างผู้ดูแล";
      const roomInfo = job.roomNo ? `ห้อง ${job.roomNo}` : "";
      const condoInfo = job.condoName ? `(${job.condoName.split(" (")[0]})` : "";

      const lineMessage = `\n⏰ แจ้งเตือนใกล้นัดหมาย (ล่วงหน้า 1 ชั่วโมง)!`
        + `\n🏢 สถานที่: ${roomInfo} ${condoInfo}`
        + `\n📅 วันนัดหมาย: ${apptDateStr}`
        + `\n⏰ เวลานัด: ${apptTimeStr} น.`
        + `\n🛠️ อาการ: ${job.details || "ไม่ระบุรายละเอียด"}`
        + `\n👨‍🔧 ช่างผู้ปฏิบัติงาน: ${technicianName}`
        + `\n📌 กรุณาเตรียมอุปกรณ์และเข้าปฏิบัติงานให้ตรงตามเวลานัดหมาย`;

      // Send LINE notification
      const sendResult = await sendLineNotification(lineMessage);

      // Mark job as notified
      job.notified1hBefore = true;
      job.lastReminderSentAt = new Date().toLocaleString("th-TH");
      repairsUpdated = true;
      sentInThisCheck++;
      totalSentCount++;

      // Create system log
      const logEntry = {
        id: `LOG-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        repairId: job.id,
        timestamp: new Date().toLocaleString("th-TH"),
        type: "แจ้งเตือน LINE ล่วงหน้า 1 ชม.",
        description: `⏰ ระบบอัตโนมัติส่ง LINE แจ้งเตือนช่าง ${technicianName} ล่วงหน้า 1 ชม. สำหรับงานซ่อม ${job.id} (${roomInfo} เวลา ${apptTimeStr} น.)`,
        updatedBy: "Background Scheduler"
      };

      logs.unshift(logEntry);
      const logMsg = `[JOB ${job.id}] Sent 1h reminder to ${technicianName} for appt ${apptTimeStr}`;
      logsSummary.push(logMsg);
    }
  }

  if (repairsUpdated) {
    safeWriteJSON("repairs.json", repairs);
    safeWriteJSON("logs.json", logs);
  }

  return {
    checked: repairs.length,
    sent: sentInThisCheck,
    logs: logsSummary
  };
}

/**
 * Initialize background scheduler (runs check every 60 seconds)
 */
export function initLineScheduler(intervalMs = 60000) {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  console.log(`[LineScheduler] 🚀 Starting LINE Appointment Reminder Scheduler (Interval: ${intervalMs / 1000}s)`);

  // Run initial check after 5 seconds
  setTimeout(() => {
    checkAndSendAppointmentReminders().catch(err => {
      console.error("[LineScheduler] Error in initial check:", err);
    });
  }, 5000);

  // Set recurring timer
  setInterval(() => {
    checkAndSendAppointmentReminders().catch(err => {
      console.error("[LineScheduler] Error in recurring check:", err);
    });
  }, intervalMs);
}

/**
 * Get current background scheduler status
 */
export function getLineSchedulerStatus() {
  return {
    running: isSchedulerRunning,
    enabled: isLineNotifyEnabled,
    intervalSeconds: 60,
    lastCheckTime: lastCheckTime || "ยังไม่มีการตรวจสอบ",
    totalSentCount,
    hasToken: Boolean(process.env.LINE_NOTIFY_TOKEN || process.env.LINE_TOKEN)
  };
}
