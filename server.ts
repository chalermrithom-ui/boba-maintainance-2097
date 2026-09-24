import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  getAuthUrl,
  handleCallback,
  getDriveConnectionStatus,
  logoutDrive,
  runGoogleDriveBackup,
  initDailyBackupScheduler
} from "./server/googleDrive";
import {
  initLineScheduler,
  getLineSchedulerStatus,
  checkAndSendAppointmentReminders,
  sendLineNotification,
  setLineNotifyEnabled,
  getLineNotifyEnabled
} from "./server/lineScheduler";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cookieParser());
// Set high body parser limits (500mb) to support uploading large videos and high-resolution images
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Initialize Gemini API client on the server side
// Secure: API key is held safely on the server
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API route: AI analysis & summary using Gemini
app.post("/api/generate-summary", async (req, res) => {
  const { repairs, inventory, month, year } = req.body;

  try {
    const ai = getGeminiClient();
    
    const systemPrompt = `You are an expert Facility Management AI advisor for a luxury condominium in Thailand. 
Analyze the repair records and spare parts inventory, then generate a comprehensive, highly professional summary and preventive maintenance guide in Thai.
Formulate clear, actionable insights in the following structure:
1. ภาพรวมสถิติการซ่อมในเดือนที่เลือก (Total repairs, completion rate, top issues).
2. การวิเคราะห์ปัญหาซ้ำซากและสาเหตุหลัก (Most frequent problems, e.g. plumbing, electrical, HVAC).
3. รายงานและคำแจ้งเตือนเกี่ยวกับคลังอะไหล่ (Critical spare parts running low, cost analysis).
4. คำแนะนำเพื่อการบำรุงรักษาเชิงป้องกัน (Preventive maintenance recommendations for next month to avoid repeats).

Format the output clearly using elegant markdown. Avoid technical jargon. Use Thai language.`;

    const contents = `ข้อมูลสำหรับการวิเคราะห์ประจำเดือน ${month}/${year}:
- รายการแจ้งซ่อม: ${JSON.stringify(repairs)}
- สถานะคลังอะไหล่ปัจจุบัน: ${JSON.stringify(inventory)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    res.json({ success: true, summary: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI summary" });
  }
});

// Ensure data, images, and snapshots directories exist
const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Default Seed Data (Empty by default so uncreated sample jobs do not auto-populate)
const DEFAULT_REPAIRS: any[] = [];

const DEFAULT_INVENTORY = [
  { id: "INV-101", name: "หลอดไฟ LED 9W", qty: 45, unit: "ดวง", price: 120, minQty: 10 },
  { id: "INV-102", name: "ก๊อกน้ำอ่างล้างหน้า Cotto", qty: 12, unit: "ชิ้น", price: 450, minQty: 5 },
  { id: "INV-103", name: "เทปพันเกลียวท่อน้ำ", qty: 25, unit: "ม้วน", price: 35, minQty: 5 },
  { id: "INV-104", name: "วาล์วน้ำซันวา 1/2 นิ้ว", qty: 8, unit: "ตัว", price: 180, minQty: 4 },
  { id: "INV-105", name: "สวิตช์ไฟ Panasonic", qty: 30, unit: "อัน", price: 85, minQty: 8 }
];

const DEFAULT_USERS = [
  { userId: "Admin", name: "ผู้ดูแลระบบหลัก (Admin)", role: "แอดมิน", password: "123", securityQuestion: "ชื่อระบบ", securityAnswer: "boba", email: "admin@boba-maintenance.com", mfaEnabled: false, createdAt: "21/07/2026 09:00:00" },
  { userId: "Admin2", name: "ผู้ดูแลระบบสำรอง (Admin 2)", role: "แอดมิน", password: "123", securityQuestion: "ชื่อระบบ", securityAnswer: "boba", email: "admin2@boba-maintenance.com", mfaEnabled: false, createdAt: "21/07/2026 09:00:00" },
  { userId: "Sky", name: "ช่างซ่อม SKY (ประปา/สุขภัณฑ์)", role: "ช่าง", password: "123", securityQuestion: "งานหลัก", securityAnswer: "ประปา", email: "sky@boba.com", mfaEnabled: false, createdAt: "21/07/2026 09:00:00" },
  { userId: "Jay", name: "ช่างซ่อม Jay Jay (แอร์/ระบบเย็น)", role: "ช่าง", password: "123", securityQuestion: "งานหลัก", securityAnswer: "แอร์", email: "jay@boba.com", mfaEnabled: false, createdAt: "21/07/2026 09:00:00" },
  { userId: "Chains", name: "ช่างซ่อม CHAINS (ไฟฟ้า/สัญญาณ)", role: "ช่าง", password: "123", securityQuestion: "งานหลัก", securityAnswer: "ไฟฟ้า", email: "chains@boba.com", mfaEnabled: false, createdAt: "21/07/2026 09:00:00" },
];

const DEFAULT_LOGS: any[] = [];

// Seed initial default images
const DEFAULT_IMAGES: { [key: string]: string } = {
  "img-before-1": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23F1F5F9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748B'>[รูปถ่ายก๊อกน้ำรั่วซึม - Before]</text></svg>",
  "img-before-2": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23F1F5F9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748B'>[รูปถ่ายแอร์มีเสียงดัง - Before]</text></svg>",
  "img-before-3": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23F1F5F9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748B'>[รูปโคมระย้าหลอดเสีย - Before]</text></svg>",
  "img-after-3": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%23ECFDF5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23047857'>[เปลี่ยนเป็นหลอดไฟ LED แล้ว - After]</text></svg>"
};

// Helper to safely read JSON with backup fallback
function safeReadJSON(filename: string, fallbackDefault: any) {
  const filePath = path.join(DATA_DIR, filename);
  const bakPath = path.join(DATA_DIR, `${filename}.bak`);

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.trim()) {
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn(`Warning: Could not parse ${filename}, attempting backup load...`);
    }
  }

  if (fs.existsSync(bakPath)) {
    try {
      const bakContent = fs.readFileSync(bakPath, "utf8");
      if (bakContent.trim()) {
        const parsed = JSON.parse(bakContent);
        // Restore main file from backup
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf8");
        return parsed;
      }
    } catch (e) {
      console.warn(`Warning: Could not parse backup ${filename}.bak`);
    }
  }

  // Fallback to default & write file
  fs.writeFileSync(filePath, JSON.stringify(fallbackDefault, null, 2), "utf8");
  return fallbackDefault;
}

// Helper to create automated historical database snapshot
function createDatabaseSnapshot(reason = "Auto Snapshot") {
  try {
    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, "-");
    const snapshotFilename = `snapshot_${timestampStr}.json`;
    const snapshotPath = path.join(SNAPSHOTS_DIR, snapshotFilename);

    const snapshot = {
      id: `SNAP-${Date.now()}`,
      timestamp: now.toLocaleString("th-TH"),
      isoDate: now.toISOString(),
      reason,
      repairs: safeReadJSON("repairs.json", DEFAULT_REPAIRS),
      inventory: safeReadJSON("inventory.json", DEFAULT_INVENTORY),
      users: safeReadJSON("users.json", DEFAULT_USERS),
      logs: safeReadJSON("logs.json", DEFAULT_LOGS),
    };

    const tmpPath = `${snapshotPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2), "utf8");
    fs.renameSync(tmpPath, snapshotPath);

    // Keep up to 50 latest snapshot files
    const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR)
      .filter(f => f.startsWith("snapshot_") && f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a)); // Descending order

    if (snapshotFiles.length > 50) {
      for (const oldFile of snapshotFiles.slice(50)) {
        try {
          fs.unlinkSync(path.join(SNAPSHOTS_DIR, oldFile));
        } catch (e) {
          // ignore cleanup error
        }
      }
    }
    return snapshotFilename;
  } catch (err) {
    console.warn("Failed to create database snapshot:", err);
    return null;
  }
}

// Helper to safely write JSON with atomic operation & anti-wipe protection
function safeWriteJSON(filename: string, data: any, options: { forceEmpty?: boolean } = {}) {
  const filePath = path.join(DATA_DIR, filename);
  const bakPath = path.join(DATA_DIR, `${filename}.bak`);
  const tmpPath = path.join(DATA_DIR, `${filename}.tmp`);

  // Anti-Data Wipe Protection Guard:
  // If file exists and contains valid items (>0), and incoming payload is empty array [] without explicit forceEmpty flag, reject write.
  if (fs.existsSync(filePath) && Array.isArray(data) && data.length === 0 && !options.forceEmpty) {
    try {
      const existingContent = fs.readFileSync(filePath, "utf8");
      if (existingContent.trim()) {
        const parsed = JSON.parse(existingContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.warn(`[Anti-Data Wipe Guard] Blocked overwrite of ${filename} (${parsed.length} existing items) with empty array!`);
          return false;
        }
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  // Save previous valid file content to .bak backup before writing
  if (fs.existsSync(filePath)) {
    try {
      const currentContent = fs.readFileSync(filePath, "utf8");
      if (currentContent.trim()) {
        fs.writeFileSync(bakPath, currentContent, "utf8");
      }
    } catch (e) {
      // Ignore
    }
  }

  // Atomic write: write to .tmp file first, then rename atomically to prevent file corruption
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
  return true;
}

// Seed helper
function ensureSeedData() {
  safeReadJSON("repairs.json", DEFAULT_REPAIRS);
  safeReadJSON("inventory.json", DEFAULT_INVENTORY);
  safeReadJSON("users.json", DEFAULT_USERS);
  safeReadJSON("logs.json", DEFAULT_LOGS);

  // Write default images
  for (const [imgId, base64] of Object.entries(DEFAULT_IMAGES)) {
    const imgPath = path.join(IMAGES_DIR, `${imgId}.txt`);
    if (!fs.existsSync(imgPath)) {
      fs.writeFileSync(imgPath, base64, "utf8");
    }
  }
}

// Run seeds
ensureSeedData();

// 3. API Route: Get complete open database
app.get("/api/database", (req, res) => {
  try {
    const repairs = safeReadJSON("repairs.json", DEFAULT_REPAIRS);
    const inventory = safeReadJSON("inventory.json", DEFAULT_INVENTORY);
    const users = safeReadJSON("users.json", DEFAULT_USERS);
    const logs = safeReadJSON("logs.json", DEFAULT_LOGS);
    
    res.json({ success: true, repairs, inventory, users, logs });
  } catch (err: any) {
    console.error("Failed to load open database:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. API Route: Save entire open database safely with .bak backup & atomic snapshot
app.post("/api/database/save", (req, res) => {
  const { repairs, inventory, users, logs, forceEmpty } = req.body;
  try {
    // Create snapshot prior to updating
    createDatabaseSnapshot("บันทึกข้อมูลอัตโนมัติ (Auto Save)");

    if (repairs) safeWriteJSON("repairs.json", repairs, { forceEmpty });
    if (inventory) safeWriteJSON("inventory.json", inventory, { forceEmpty });
    if (users) safeWriteJSON("users.json", users, { forceEmpty });
    if (logs) safeWriteJSON("logs.json", logs, { forceEmpty });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save open database:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.1 API Route: Export Full Database Snapshot for Backup
app.get("/api/database/export", (req, res) => {
  try {
    const repairs = safeReadJSON("repairs.json", DEFAULT_REPAIRS);
    const inventory = safeReadJSON("inventory.json", DEFAULT_INVENTORY);
    const users = safeReadJSON("users.json", DEFAULT_USERS);
    const logs = safeReadJSON("logs.json", DEFAULT_LOGS);

    const backupSnapshot = {
      system: "B.O.B.A. Maintenance System",
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      repairs,
      inventory,
      users,
      logs
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=boba_maintenance_backup_${new Date().toISOString().split("T")[0]}.json`);
    res.json(backupSnapshot);
  } catch (err: any) {
    console.error("Failed to export database snapshot:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.2 API Route: Import & Restore Database Snapshot
app.post("/api/database/import", (req, res) => {
  const { repairs, inventory, users, logs } = req.body;
  try {
    if (!Array.isArray(repairs)) {
      return res.status(400).json({ success: false, error: "ไฟล์สำรองข้อมูลไม่ถูกต้อง (ขาดข้อมูลรายการแจ้งซ่อม)" });
    }

    // Save snapshot before restoring
    createDatabaseSnapshot("ก่อนการนำเข้าไฟล์สำรอง (Pre-Import Snapshot)");

    if (repairs) safeWriteJSON("repairs.json", repairs, { forceEmpty: true });
    if (inventory && Array.isArray(inventory)) safeWriteJSON("inventory.json", inventory, { forceEmpty: true });
    if (users && Array.isArray(users)) safeWriteJSON("users.json", users, { forceEmpty: true });
    if (logs && Array.isArray(logs)) safeWriteJSON("logs.json", logs, { forceEmpty: true });

    res.json({ success: true, message: "กู้คืนข้อมูลจากไฟล์สำรองสำเร็จเรียบร้อยแล้ว!" });
  } catch (err: any) {
    console.error("Failed to import database snapshot:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.3 API Route: List Historical Snapshots
app.get("/api/database/snapshots", (req, res) => {
  try {
    const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR)
      .filter(f => f.startsWith("snapshot_") && f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a)); // Descending

    const snapshotsList = snapshotFiles.map(filename => {
      const filePath = path.join(SNAPSHOTS_DIR, filename);
      const stat = fs.statSync(filePath);
      let meta = { timestamp: "", reason: "", repairsCount: 0, inventoryCount: 0 };
      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        meta = {
          timestamp: content.timestamp || stat.mtime.toLocaleString("th-TH"),
          reason: content.reason || "Auto Snapshot",
          repairsCount: Array.isArray(content.repairs) ? content.repairs.length : 0,
          inventoryCount: Array.isArray(content.inventory) ? content.inventory.length : 0,
        };
      } catch (e) {
        // ignore
      }
      return {
        filename,
        sizeBytes: stat.size,
        mtime: stat.mtime,
        ...meta
      };
    });

    res.json({ success: true, snapshots: snapshotsList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.4 API Route: Create Manual Snapshot On-Demand
app.post("/api/database/snapshots/create", (req, res) => {
  try {
    const reason = req.body.reason || "บันทึกสแนปชอตโดยแอดมิน (Manual Snapshot)";
    const filename = createDatabaseSnapshot(reason);
    res.json({ success: true, filename, message: "สร้างสแนปชอตสำรองข้อมูลสำเร็จ!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.5 API Route: Restore Specific Snapshot
app.post("/api/database/snapshots/restore", (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ success: false, error: "ระบุชื่อไฟล์สแนปชอตไม่ถูกต้อง" });
    }
    const snapshotPath = path.join(SNAPSHOTS_DIR, path.basename(filename));
    if (!fs.existsSync(snapshotPath)) {
      return res.status(404).json({ success: false, error: "ไม่พบไฟล์สแนปชอตที่ต้องการกู้คืน" });
    }

    const content = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

    // Save pre-restore backup snapshot first
    createDatabaseSnapshot(`ก่อนย้อนคืนไปที่สแนปชอต ${filename}`);

    if (Array.isArray(content.repairs)) safeWriteJSON("repairs.json", content.repairs, { forceEmpty: true });
    if (Array.isArray(content.inventory)) safeWriteJSON("inventory.json", content.inventory, { forceEmpty: true });
    if (Array.isArray(content.users)) safeWriteJSON("users.json", content.users, { forceEmpty: true });
    if (Array.isArray(content.logs)) safeWriteJSON("logs.json", content.logs, { forceEmpty: true });

    res.json({
      success: true,
      message: `กู้คืนข้อมูลสำเร็จจากสแนปชอต (${content.timestamp || filename})`,
      counts: {
        repairs: content.repairs?.length || 0,
        inventory: content.inventory?.length || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. API Route: Upload base64 image
app.post("/api/database/upload-image", (req, res) => {
  const { fileId, base64 } = req.body;
  try {
    if (!fileId || !base64) {
      return res.status(400).json({ success: false, error: "Missing fileId or base64 data" });
    }
    fs.writeFileSync(path.join(IMAGES_DIR, `${fileId}.txt`), base64, "utf8");
    res.json({ success: true, fileId });
  } catch (err: any) {
    console.error("Failed to upload image to disk:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. API Route: Sync client database & images to local server for sharing (backward compatible)
app.post("/api/share-cache", (req, res) => {
  const { repairs, images } = req.body;
  try {
    if (Array.isArray(repairs)) {
      fs.writeFileSync(path.join(DATA_DIR, "repairs.json"), JSON.stringify(repairs, null, 2), "utf8");
    }
    if (images && typeof images === "object") {
      for (const [fileId, base64Data] of Object.entries(images)) {
        if (typeof base64Data === "string" && fileId) {
          fs.writeFileSync(path.join(IMAGES_DIR, `${fileId}.txt`), base64Data, "utf8");
        }
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to write share cache:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. API Route: Retrieve shared repair details for customer read-only view
app.get("/api/share-cache/repair/:id", (req, res) => {
  try {
    const rawId = req.params.id || "";
    const targetId = rawId.trim().toLowerCase();
    const repairsPath = path.join(DATA_DIR, "repairs.json");
    
    let repairs = DEFAULT_REPAIRS;
    if (fs.existsSync(repairsPath)) {
      try {
        repairs = JSON.parse(fs.readFileSync(repairsPath, "utf8"));
      } catch (e) {
        console.error("Failed to parse repairs.json, falling back to default:", e);
      }
    }
    
    const repair = repairs.find((r: any) => r.id && r.id.trim().toLowerCase() === targetId);
    if (repair) {
      return res.json({ success: true, repair });
    }
    
    res.status(404).json({ success: false, error: `ไม่พบข้อมูลงานซ่อมรหัส "${rawId}" บนเซิร์ฟเวอร์` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. API Route: Retrieve image file (supports both /api/database/image/:id and /api/share-cache/image/:id)
const handleGetImage = (req: express.Request, res: express.Response) => {
  try {
    const fileId = req.params.id;
    const imagePath = path.join(IMAGES_DIR, `${fileId}.txt`);
    if (fs.existsSync(imagePath)) {
      const base64Data = fs.readFileSync(imagePath, "utf8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.json({ success: true, image: base64Data });
    }
    res.status(404).json({ success: false, error: "Image not found on server disk" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.get("/api/share-cache/image/:id", handleGetImage);
app.get("/api/database/image/:id", handleGetImage);

// 9. API Routes: Google Drive OAuth & Incremental Auto-Backup
app.get("/api/auth/google/url", (req, res) => {
  try {
    const url = getAuthUrl(req);
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Missing authorization code");
    }
    await handleCallback(code, req);
    
    // Automatically run initial incremental backup upon successful OAuth connection
    runGoogleDriveBackup().catch(e => console.warn("Auto backup after OAuth callback error:", e));

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Drive Connected</title></head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background-color: #f8fafc; color: #0f172a;">
          <div style="max-width: 480px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h2 style="color: #16a34a; margin-top: 0;">เชื่อมต่อ Google Drive สำเร็จ!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">ระบบได้เปิดใช้การสำรองข้อมูลรายวันอัตโนมัติไปยังโฟลเดอร์ <strong>'Auto-Backup'</strong> ใน Google Drive เรียบร้อยแล้ว</p>
            <p style="color: #64748b; font-size: 13px; margin-top: 24px;">กำลังนำท่านกลับสู่หน้าหลักระบบ...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_DRIVE_CONNECTED' }, '*');
              setTimeout(() => { window.close(); }, 1200);
            } else {
              setTimeout(() => { window.location.href = '/?driveConnected=true'; }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("OAuth Callback error:", err);
    res.status(500).send(`เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive: ${err.message}`);
  }
});

app.get("/api/drive/status", (req, res) => {
  try {
    const status = getDriveConnectionStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/drive/logout", (req, res) => {
  try {
    logoutDrive();
    res.json({ success: true, message: "Disconnected from Google Drive" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/drive/backup", async (req, res) => {
  try {
    const result = await runGoogleDriveBackup(req.body.data);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. API Routes: LINE Notify & Background Scheduler Status
app.get("/api/line/settings", (req, res) => {
  try {
    res.json({ success: true, enabled: getLineNotifyEnabled() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/line/settings", (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled === "boolean") {
      setLineNotifyEnabled(enabled);
    }
    res.json({ success: true, enabled: getLineNotifyEnabled() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/line/notify", async (req, res) => {
  try {
    const { message, token } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "Missing message body" });
    }
    const result = await sendLineNotification(message, token);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/scheduler/status", (req, res) => {
  try {
    const status = getLineSchedulerStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/scheduler/check", async (req, res) => {
  try {
    const result = await checkAndSendAppointmentReminders();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite & Static file serving setup
async function startServer() {
  // Initialize daily incremental backup scheduler to Google Drive
  initDailyBackupScheduler();

  // Initialize LINE 1-hour prior appointment reminder background scheduler
  initLineScheduler();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
