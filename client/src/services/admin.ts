import { doc, getDoc, setDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { db } from "../lib/firebase";

if (!db) {
  console.warn('Firestore is not initialized. Admin features will be limited.');
}

export interface AdminSettings {
  maintenanceMode: boolean;
  userRegistration: boolean;
  lastUpdated: any;
  updatedBy: string;
}

const ADMIN_SETTINGS_DOC = 'settings/admin';

export const getAdminSettings = async (): Promise<AdminSettings> => {
  if (!db) {
    // Return default settings if Firestore is not initialized
    return {
      maintenanceMode: false,
      userRegistration: true,
      lastUpdated: new Date(),
      updatedBy: 'system',
    };
  }

  try {
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
  } catch (error) {
    console.error('Error getting admin settings:', error);
    // Return default settings in case of error
    return {
      maintenanceMode: false,
      userRegistration: true,
      lastUpdated: new Date(),
      updatedBy: 'system',
    };
  }
};

export const updateAdminSettings = async (
  userId: string,
  updates: Partial<AdminSettings>
): Promise<void> => {
  if (!db) {
    console.warn('Firestore is not initialized. Cannot update admin settings.');
    return;
  }

  try {
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
  } catch (error) {
    console.error('Error updating admin settings:', error);
    throw error;
  }
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
