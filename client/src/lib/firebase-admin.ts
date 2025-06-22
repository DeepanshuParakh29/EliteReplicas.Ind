import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Type definitions for our Firebase Admin instance
export interface FirebaseAdmin {
  app: App;
  db: Firestore;
  auth: Auth;
}

// Check if all required environment variables are set
function assertEnvVars() {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Initialize Firebase Admin with proper error handling
let firebaseAdmin: FirebaseAdmin | null = null;

export function getFirebaseAdmin(): FirebaseAdmin {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check environment variables
    assertEnvVars();

    // Initialize the Firebase Admin app if it doesn't exist
    const app = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\/g, '\\'),
          }),
          databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
        })
      : getApp();

    // Initialize services
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Set Firestore settings
    if (process.env.NODE_ENV !== 'production') {
      db.settings({
        ignoreUndefinedProperties: true,
      });
    }

    firebaseAdmin = { app, db, auth };
    return firebaseAdmin;
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

// Export initialized services
export const { db: adminDb, auth: adminAuth } = getFirebaseAdmin();

export default getFirebaseAdmin;
