import { RepairJob, Part, UserMember, MaintenanceLog, JobStatus, UserRole, PartUsed } from "../types";

export interface GDriveFolder {
  id: string;
  name: string;
}

export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
}

const DATABASE_FILE_NAME = "Condo Repair Database";
const PHOTOS_FOLDER_NAME = "Condo Repair Photos";

// Generic GDrive search for a file or folder
export const searchDriveItem = async (
  name: string,
  mimeType: string,
  accessToken: string
): Promise<string | null> => {
  const query = `name='${name}' and mimeType='${mimeType}' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("GDrive Search failed:", await res.text());
      return null;
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error("Search GDrive Error:", err);
    return null;
  }
};

// Create a new folder in Google Drive
export const createDriveFolder = async (
  name: string,
  accessToken: string
): Promise<string> => {
  const url = "https://www.googleapis.com/drive/v3/files";
  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Google Drive folder: ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
};

// Create the Condo Repair Database Spreadsheet with 4 sheets (tabs)
export const createDatabaseSpreadsheet = async (
  accessToken: string
): Promise<string> => {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";
  const body = {
    properties: {
      title: DATABASE_FILE_NAME,
    },
    sheets: [
      { properties: { title: "Repairs" } },
      { properties: { title: "Inventory" } },
      { properties: { title: "Users" } },
      { properties: { title: "Logs" } },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Google Sheets database: ${await res.text()}`);
  }
  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Now, initialize headers in all 4 sheets
  await initializeSpreadsheetHeaders(spreadsheetId, accessToken);
  
  return spreadsheetId;
};

// Set Column Headers in Spreadsheet
const initializeSpreadsheetHeaders = async (
  spreadsheetId: string,
  accessToken: string
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  
  const repairsHeaders = [
    "ID", "WorkDate", "ApptDate", "CondoName", "RoomNo", "Details", "Technician", 
    "Status", "BeforeImg", "AfterImg", "Notes", "Parts", "TotalCost", "UpdatedAt", "ApptTime", "Priority"
  ];
  const inventoryHeaders = ["ID", "Name", "Qty", "Unit", "Price", "MinQty"];
  const usersHeaders = ["Email", "Name", "Role", "MFAEnabled", "CreatedAt"];
  const logsHeaders = ["ID", "RepairId", "Timestamp", "Type", "Description", "UpdatedBy"];

  const body = {
    valueInputOption: "USER_ENTERED",
    data: [
      { range: "Repairs!A1:P1", values: [repairsHeaders] },
      { range: "Inventory!A1:F1", values: [inventoryHeaders] },
      { range: "Users!A1:E1", values: [usersHeaders] },
      { range: "Logs!A1:F1", values: [logsHeaders] },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to initialize Sheet headers: ${await res.text()}`);
  }

  // Pre-populate Inventory with standard spare parts for condo repairs
  await seedDefaultInventory(spreadsheetId, accessToken);
};

// Seed default items in Inventory sheet
const seedDefaultInventory = async (spreadsheetId: string, accessToken: string): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventory!A2:F7:append?valueInputOption=USER_ENTERED`;
  
  const defaultParts = [
    ["INV-101", "วาล์วน้ำทองเหลือง 1/2 นิ้ว", "25", "ตัว", "180", "5"],
    ["INV-102", "หลอดไฟ LED 12W (แสงขาว)", "40", "หลอด", "120", "8"],
    ["INV-103", "สายน้ำดีอเนกประสงค์ 16 นิ้ว", "30", "เส้น", "95", "6"],
    ["INV-104", "ลูกบิดประตูห้องน้ำ (แสตนเลส)", "15", "ชุด", "290", "3"],
    ["INV-105", "ก๊อกน้ำอ่างล้างจาน (คอห่าน)", "10", "ตัว", "450", "3"],
    ["INV-106", "ซิลิโคนยาแนว กันเชื้อรา (ขาว)", "20", "หลอด", "135", "4"]
  ];

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: defaultParts }),
  });
};

// Retrieve sheet rows
export const fetchSheetRows = async (
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<any[][]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet range ${range}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.values || [];
};

// Get Full Database: Repairs, Inventory, Users, Logs
export const getFullDatabase = async (
  spreadsheetId: string,
  accessToken: string
): Promise<{
  repairs: RepairJob[];
  inventory: Part[];
  users: UserMember[];
  logs: MaintenanceLog[];
}> => {
  const [repairsRows, inventoryRows, usersRows, logsRows] = await Promise.all([
    fetchSheetRows(spreadsheetId, "Repairs!A2:O1000", accessToken),
    fetchSheetRows(spreadsheetId, "Inventory!A2:F1000", accessToken),
    fetchSheetRows(spreadsheetId, "Users!A2:E1000", accessToken),
    fetchSheetRows(spreadsheetId, "Logs!A2:F1000", accessToken),
  ]);

    // Parse Repairs
    const repairs: RepairJob[] = repairsRows.map((row) => {
      let partsParsed: PartUsed[] = [];
      try {
        partsParsed = row[11] ? JSON.parse(row[11]) : [];
      } catch (e) {
        console.warn("Failed to parse repair parts JSON:", row[11]);
      }

      return {
        id: row[0] || "",
        workDate: row[1] || "",
        apptDate: row[2] || "",
        condoName: row[3] || "",
        roomNo: row[4] || "",
        details: row[5] || "",
        technician: row[6] || "",
        status: (row[7] as JobStatus) || JobStatus.PENDING,
        beforeImg: row[8] || "",
        afterImg: row[9] || "",
        notes: row[10] || "",
        parts: partsParsed,
        totalCost: Number(row[12] || 0),
        updatedAt: row[13] || "",
        apptTime: row[14] || "",
        priority: row[15] || "งานปกติ",
      };
    });

  // Parse Inventory
  const inventory: Part[] = inventoryRows.map((row) => ({
    id: row[0] || "",
    name: row[1] || "",
    qty: Number(row[2] || 0),
    unit: row[3] || "",
    price: Number(row[4] || 0),
    minQty: Number(row[5] || 0),
  }));

  // Parse Users
  const users: UserMember[] = usersRows.map((row) => ({
    userId: row[0] || row[1] || "Admin",
    email: row[0] || "",
    name: row[1] || row[0] || "Member",
    role: (row[2] as UserRole) || UserRole.TECHNICIAN,
    mfaEnabled: row[3] === "true",
    createdAt: row[4] || "",
  }));

  // Parse Logs
  const logs: MaintenanceLog[] = logsRows.map((row) => ({
    id: row[0] || "",
    repairId: row[1] || "",
    timestamp: row[2] || "",
    type: row[3] || "",
    description: row[4] || "",
    updatedBy: row[5] || "",
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { repairs, inventory, users, logs };
};

// Write a row to a sheet (Append)
export const appendSheetRow = async (
  spreadsheetId: string,
  sheetName: string,
  values: any[],
  accessToken: string
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:A:append?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!res.ok) {
    throw new Error(`Failed to append row to ${sheetName}: ${await res.text()}`);
  }
};

// Update a row in a sheet by matching an ID in column A
export const updateSheetRowById = async (
  spreadsheetId: string,
  sheetName: string,
  id: string,
  newValues: any[],
  accessToken: string
): Promise<void> => {
  // First, find the row index of the matching ID
  const rows = await fetchSheetRows(spreadsheetId, `${sheetName}!A1:A1000`, accessToken);
  const rowIndex = rows.findIndex((row) => row[0] === id);
  
  if (rowIndex === -1) {
    throw new Error(`ID ${id} not found in sheet ${sheetName}`);
  }

  // Row numbers are 1-indexed, and we match the index directly
  const actualRowNumber = rowIndex + 1;
  const range = `${sheetName}!A${actualRowNumber}:${getExcelColumnLabel(newValues.length)}${actualRowNumber}`;
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [newValues] }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update row ${actualRowNumber} in ${sheetName}: ${await res.text()}`);
  }
};

// Map column index to Excel column label (A, B, C... Z, AA etc.)
const getExcelColumnLabel = (index: number): string => {
  let temp = index;
  let label = "";
  while (temp > 0) {
    let remainder = (temp - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    temp = Math.floor((temp - remainder) / 26);
  }
  return label || "A";
};

// Clear a specific range in Google Sheets
export const clearSheetRange = async (
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to clear range ${range}: ${await res.text()}`);
  }
};

// Overwrite a range in Google Sheets with fresh values
export const writeSheetRows = async (
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
): Promise<void> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    throw new Error(`Failed to write rows to ${range}: ${await res.text()}`);
  }
};

// Upload Photo (File) to Google Drive Folder
export const uploadFileToDrive = async (
  file: File,
  folderId: string,
  accessToken: string
): Promise<string> => {
  const metadata = {
    name: `${Date.now()}_${file.name}`,
    parents: [folderId],
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", file);

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload photo to GDrive: ${await res.text()}`);
  }
  const data = await res.json();
  return data.id;
};

// Download Photo blob secure link from GDrive
export const getDriveFileBlobUrl = async (
  fileId: string,
  accessToken: string
): Promise<string> => {
  if (!fileId) return "";
  
  // If it's already a standard URL (unlikely but safe), return it
  if (fileId.startsWith("http")) return fileId;

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to download file: ${res.statusText}`);
    }
    
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to load Google Drive secure image blob:", error);
    return "";
  }
};
