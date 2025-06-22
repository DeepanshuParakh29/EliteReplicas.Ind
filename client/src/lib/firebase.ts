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

// Validate environment variables
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
};

// Get Firebase configuration from environment variables
const getFirebaseConfig = (): FirebaseConfig => {
  try {
    return {
      apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('VITE_FIREBASE_APP_ID'),
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw new Error('Firebase configuration is missing or invalid');
  }
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const analytics = getAnalytics(app);

// Log Firebase initialization (only in development)
if (import.meta.env.DEV) {
  console.log('Firebase initialized with config:', {
    ...firebaseConfig,
    apiKey: '***', // Don't log the full API key
  });
}

export { auth, db, storage, analytics };
export default app;
