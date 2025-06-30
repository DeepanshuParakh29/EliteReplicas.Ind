import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import path from 'path';
import { fileURLToPath } from 'url';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_DATABASE_URL?: string;
      FIREBASE_STORAGE_BUCKET_ADMIN?: string;
      FIREBASE_PROJECT_ID?: string;
    }
  }
}

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin if it hasn't been initialized already
let firebaseApp;

if (!getApps().length) {
  try {
    // Prefer SERVICE ACCOUNT from env to avoid bundling secrets in repo
    let credentialParam: any;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        credentialParam = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (err) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT – must be a valid JSON string');
        throw err;
      }
    } else {
      credentialParam = path.resolve(__dirname, '../../server/firebase-service-account.json');
    }

    const firebaseConfig = {
      credential: cert(credentialParam as any),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket:
        process.env.FIREBASE_STORAGE_BUCKET_ADMIN ||
        `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    };
    
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
  }
} else {
  firebaseApp = getApps()[0];
}

// Initialize services
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp).bucket();
export const auth = getAuth(firebaseApp);

export default firebaseApp;
