import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface AdminSettings {
  maintenanceMode: boolean;
  userRegistration: boolean;
  lastUpdated: any;
  updatedBy: string;
}

const ADMIN_SETTINGS_DOC = 'settings/admin';

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const docRef = doc(db, ADMIN_SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AdminSettings;
  } else {
    // Initialize with default settings if not exists
    const defaultSettings: AdminSettings = {
      maintenanceMode: false,
      userRegistration: true,
      lastUpdated: serverTimestamp(),
      updatedBy: 'system',
    };
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  }
};

export const updateAdminSettings = async (
  userId: string,
  updates: Partial<AdminSettings>
): Promise<void> => {
  const docRef = doc(db, ADMIN_SETTINGS_DOC);
  await setDoc(
    docRef,
    {
      ...updates,
      lastUpdated: serverTimestamp(),
      updatedBy: userId,
    },
    { merge: true }
  );
};

// Maintenance mode check for route protection
export const checkMaintenanceMode = async (): Promise<boolean> => {
  const settings = await getAdminSettings();
  return settings.maintenanceMode || false;
};

// User registration status check
export const isUserRegistrationEnabled = async (): Promise<boolean> => {
  const settings = await getAdminSettings();
  return settings.userRegistration !== false; // Default to true if not set
};
