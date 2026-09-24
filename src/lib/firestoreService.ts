import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, onSnapshot, writeBatch } from "firebase/firestore";
import { RepairJob, Part, UserMember, MaintenanceLog } from "../types";

const REPAIRS_COLLECTION = "repairs";
const INVENTORY_COLLECTION = "inventory";
const USERS_COLLECTION = "users";
const LOGS_COLLECTION = "logs";

export const syncToFirestore = async (data: {
  repairs?: RepairJob[];
  inventory?: Part[];
  users?: UserMember[];
  logs?: MaintenanceLog[];
}) => {
  try {
    const batch = writeBatch(db);

    if (data.repairs && data.repairs.length > 0) {
      for (const repair of data.repairs) {
        if (repair.id) {
          const ref = doc(db, REPAIRS_COLLECTION, repair.id);
          batch.set(ref, repair, { merge: true });
        }
      }
    }

    if (data.inventory && data.inventory.length > 0) {
      for (const item of data.inventory) {
        if (item.id) {
          const ref = doc(db, INVENTORY_COLLECTION, item.id);
          batch.set(ref, item, { merge: true });
        }
      }
    }

    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        if (user.email) {
          const docId = user.email.replace(/\//g, "_");
          const ref = doc(db, USERS_COLLECTION, docId);
          batch.set(ref, user, { merge: true });
        }
      }
    }

    if (data.logs && data.logs.length > 0) {
      for (const log of data.logs) {
        if (log.id) {
          const ref = doc(db, LOGS_COLLECTION, log.id);
          batch.set(ref, log, { merge: true });
        }
      }
    }

    await batch.commit();
    console.log("Synced successfully with Firebase Cloud Firestore!");
  } catch (error) {
    console.warn("Firestore sync warning (falling back to local server disk):", error);
  }
};

export const fetchFromFirestore = async () => {
  try {
    const repairsSnap = await getDocs(collection(db, REPAIRS_COLLECTION));
    const repairs = repairsSnap.docs.map((doc) => doc.data() as RepairJob);

    const inventorySnap = await getDocs(collection(db, INVENTORY_COLLECTION));
    const inventory = inventorySnap.docs.map((doc) => doc.data() as Part);

    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const users = usersSnap.docs.map((doc) => doc.data() as UserMember);

    const logsSnap = await getDocs(collection(db, LOGS_COLLECTION));
    const logs = logsSnap.docs.map((doc) => doc.data() as MaintenanceLog);

    return { repairs, inventory, users, logs };
  } catch (error) {
    console.warn("Firestore fetch error:", error);
    return null;
  }
};
