import { initializeApp, type FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Type for Firebase configuration
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

// Get Firebase configuration from environment variables
const getFirebaseConfig = (): FirebaseConfig | null => {
  try {
    // Check if Firebase environment variables are available
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      console.warn('Firebase credentials not configured. Authentication features will be limited.');
      return null;
    }

    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
  } catch (error) {
    console.warn('Firebase configuration incomplete:', error);
    return null;
  }
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app only if configuration is available
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: any = null;

if (firebaseConfig) {
  try {
    // Initialize Firebase app if not already initialized
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    if (app) {
      // Initialize Firebase services
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      
      // Initialize analytics only in browser environment
      if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
        try {
          analytics = getAnalytics(app);
        } catch (error) {
          console.warn('Failed to initialize Firebase Analytics:', error);
        }
      }
      
      console.log('Firebase initialized successfully');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase not initialized - missing configuration');
}

// Export Firebase services (can be null if not configured)
export { auth, db, storage, app };
export type { FirebaseConfig };