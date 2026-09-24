import { google } from "googleapis";
import express from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TOKEN_PATH = path.join(DATA_DIR, "google_tokens.json");
const BACKUP_STATUS_PATH = path.join(DATA_DIR, "backup_status.json");

// Safe helper to read JSON
function readJSON(filePath: string, fallback: any) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.trim()) return JSON.parse(content);
    } catch (e) {
      console.warn(`Error reading JSON from ${filePath}:`, e);
    }
  }
  return fallback;
}

// Safe helper to write JSON
function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function getOAuth2Client(req?: express.Request) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";

  let redirectUri = process.env.REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || "";
  if (!redirectUri && req) {
    const host = req.get("host");
    const protocol = req.protocol || "http";
    redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(req: express.Request) {
  const oauth2Client = getOAuth2Client(req);
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes
  });
}

export async function handleCallback(code: string, req: express.Request) {
  const oauth2Client = getOAuth2Client(req);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  let userEmail = "";
  try {
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    userEmail = userInfo.data.email || "";
  } catch (e) {
    console.warn("Could not fetch user profile during OAuth callback:", e);
  }

  const existingTokens = readJSON(TOKEN_PATH, {});
  const mergedTokens = {
    ...existingTokens,
    ...tokens,
    userEmail: userEmail || existingTokens.userEmail || "Connected User"
  };

  writeJSON(TOKEN_PATH, mergedTokens);

  updateBackupStatus({
    isConnected: true,
    userEmail: mergedTokens.userEmail,
    message: "Google Drive เชื่อมต่อสำเร็จเรียบร้อยแล้ว"
  });

  return mergedTokens;
}

export function getDriveConnectionStatus() {
  const tokens = readJSON(TOKEN_PATH, null);
  const status = readJSON(BACKUP_STATUS_PATH, {
    isConnected: false,
    lastBackupTime: null,
    status: "IDLE",
    message: "ยังไม่ได้เชื่อมต่อ Google Drive"
  });

  const isConnected = !!(tokens && (tokens.access_token || tokens.refresh_token));

  return {
    userEmail: tokens?.userEmail || "",
    ...status,
    isConnected
  };
}

export function logoutDrive() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }
  updateBackupStatus({
    isConnected: false,
    status: "DISCONNECTED",
    lastBackupTime: null,
    message: "ยกเลิกการเชื่อมต่อ Google Drive แล้ว"
  });
}

export function updateBackupStatus(data: Partial<any>) {
  const current = readJSON(BACKUP_STATUS_PATH, {
    isConnected: false,
    lastBackupTime: null,
    status: "IDLE",
    lastFileName: "",
    driveFolderId: "",
    message: ""
  });
  const updated = { ...current, ...data };
  writeJSON(BACKUP_STATUS_PATH, updated);
  return updated;
}

export async function getAuthenticatedDriveClient() {
  const tokens = readJSON(TOKEN_PATH, null);
  if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
    throw new Error("Google Drive ยังไม่ได้เชื่อมต่อ กรุณากดเชื่อมต่อ Google Drive ก่อนใช้งาน");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Handle token refresh persistence
  oauth2Client.on("tokens", (newTokens) => {
    const currentTokens = readJSON(TOKEN_PATH, {});
    const updated = { ...currentTokens, ...newTokens };
    writeJSON(TOKEN_PATH, updated);
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

async function getOrCreateAutoBackupFolder(drive: any) {
  const folderName = "Auto-Backup";
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  
  const searchRes = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive"
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id;
  }

  // Create folder
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder"
  };

  const createRes = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id"
  });

  return createRes.data.id;
}

export async function runGoogleDriveBackup(customData?: any) {
  try {
    updateBackupStatus({ status: "IN_PROGRESS", message: "กำลังเตรียมไฟล์สำรองและเชื่อมต่อ Google Drive..." });

    const drive = await getAuthenticatedDriveClient();
    const folderId = await getOrCreateAutoBackupFolder(drive);

    // Read latest data from disk if customData is not passed
    let dataToBackup = customData;
    if (!dataToBackup) {
      const repairs = readJSON(path.join(DATA_DIR, "repairs.json"), []);
      const inventory = readJSON(path.join(DATA_DIR, "inventory.json"), []);
      const users = readJSON(path.join(DATA_DIR, "users.json"), []);
      const logs = readJSON(path.join(DATA_DIR, "logs.json"), []);

      dataToBackup = {
        system: "B.O.B.A. Condo Maintenance System",
        backupType: "Daily Incremental Auto-Backup",
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        totalRepairsCount: repairs.length,
        totalInventoryCount: inventory.length,
        repairs,
        inventory,
        users,
        logs
      };
    }

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `boba_repair_backup_${todayStr}.json`;
    const fileContent = JSON.stringify(dataToBackup, null, 2);

    // Search if today's file exists in the Auto-Backup folder
    const fileSearchRes = await drive.files.list({
      q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive"
    });

    let resultFileId = "";
    let actionDone = "";

    if (fileSearchRes.data.files && fileSearchRes.data.files.length > 0) {
      // Update existing file incrementally
      resultFileId = fileSearchRes.data.files[0].id;
      await drive.files.update({
        fileId: resultFileId,
        media: {
          mimeType: "application/json",
          body: fileContent
        }
      });
      actionDone = "updated";
    } else {
      // Create new daily incremental backup file
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };
      const createRes = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: "application/json",
          body: fileContent
        },
        fields: "id, webViewLink"
      });
      resultFileId = createRes.data.id;
      actionDone = "created";
    }

    const nowIso = new Date().toISOString();
    const statusResult = updateBackupStatus({
      isConnected: true,
      status: "SUCCESS",
      lastBackupTime: nowIso,
      lastFileName: fileName,
      driveFolderId: folderId,
      message: `สำรองข้อมูลประจำวัน (${fileName}) ไปยังโฟลเดอร์ 'Auto-Backup' ใน Google Drive สำเร็จ (${actionDone})`
    });

    return {
      success: true,
      fileId: resultFileId,
      fileName,
      action: actionDone,
      status: statusResult
    };
  } catch (error: any) {
    console.error("Google Drive Auto-Backup Error:", error);
    const nowIso = new Date().toISOString();
    updateBackupStatus({
      status: "ERROR",
      message: `เกิดข้อผิดพลาดในการสำรองข้อมูลไปยัง Google Drive: ${error.message || error}`
    });
    return {
      success: false,
      error: error.message || "Failed to backup to Google Drive"
    };
  }
}

// Background scheduler for Daily Incremental Auto-Backup
let backupIntervalId: NodeJS.Timeout | null = null;

export function initDailyBackupScheduler() {
  if (backupIntervalId) clearInterval(backupIntervalId);

  // Run initial backup check after 30 seconds of server boot, then every 24 hours
  setTimeout(() => {
    try {
      const status = getDriveConnectionStatus();
      if (status.isConnected) {
        console.log("🚀 Server boot check: Triggering daily incremental auto-backup to Google Drive...");
        runGoogleDriveBackup();
      }
    } catch (e) {
      console.warn("Scheduler initial run failed:", e);
    }
  }, 30000);

  // Repeat every 24 hours
  backupIntervalId = setInterval(() => {
    try {
      const status = getDriveConnectionStatus();
      if (status.isConnected) {
        console.log("⏰ Daily Scheduled Trigger: Running incremental auto-backup to Google Drive...");
        runGoogleDriveBackup();
      }
    } catch (e) {
      console.warn("Daily backup scheduler error:", e);
    }
  }, 24 * 60 * 60 * 1000);
}
