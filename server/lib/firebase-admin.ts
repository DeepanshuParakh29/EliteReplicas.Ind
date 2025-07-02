import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      FIREBASE_DATABASE_URL?: string;
      FIREBASE_STORAGE_BUCKET_ADMIN?: string;
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_SERVICE_ACCOUNT?: string;
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
    // For development, use local file if it exists
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
    let credentialParam: any = serviceAccountPath;
    
    // Check if we should use environment variable or file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        credentialParam = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (!credentialParam.private_key) {
          console.warn('FIREBASE_SERVICE_ACCOUNT provided but missing private_key – falling back to individual env vars (if present)');
          credentialParam = undefined as any; // trigger next condition
        }
        console.log('Using Firebase service account from environment variable');
      } catch (err) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT – must be a valid JSON string');
        throw err;
      }
    }
    if (!credentialParam && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credentialParam = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      console.log('Using Firebase service account from individual env vars');
    } else if (existsSync(serviceAccountPath)) {
      try {
        credentialParam = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        console.log(`Using Firebase service account from file: ${serviceAccountPath}`);
      } catch (err) {
        console.error('Error reading Firebase service account file:', err);
        throw err;
      }
    } else {
      throw new Error('No Firebase service account found. Please set FIREBASE_SERVICE_ACCOUNT environment variable or provide firebase-service-account.json');
    }

    const firebaseConfig = {
      credential: cert(credentialParam),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${credentialParam.project_id}.firebaseio.com`,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET_ADMIN || `${credentialParam.project_id}.appspot.com`,
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
