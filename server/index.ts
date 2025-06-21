import { createServer } from "http";
 import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { setupVite, serveStatic, log } from "./vite";

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK
// Check if Firebase has already been initialized to prevent errors in hot-reloading environments

import serviceAccount from './me.json';
import { ServiceAccount } from 'firebase-admin';

if (!admin.apps.length) {
    // Method 1: Using service account key file
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'couture-control.appspot.com'
  });
  console.log('Firebase Admin SDK initialized successfully with service account credentials.');
}
/*
// Method 2: Using environment variable with JSON string
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
if (Object.keys(serviceAccount).length > 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn('Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing or empty.');
}
*/

// Import and setup routes AFTER creating the app
import { FirestoreStorage, FirebaseFileStorage } from "./storage";
import appRoutes from "./routes";

const firestore = admin.firestore();
const storage = admin.storage();

const firestoreStorage = new FirestoreStorage(firestore, storage, process.env.FIREBASE_STORAGE_BUCKET || 'couture-control.appspot.com');
const firebaseFileStorage = new FirebaseFileStorage(storage, process.env.FIREBASE_STORAGE_BUCKET || 'couture-control.appspot.com');

app.use('/', appRoutes(firestoreStorage, firebaseFileStorage));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: Record<string, any>) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error(err); // Log the error instead of throwing it
});

// Server initialization
(async () => {
  try {
    console.log('Starting server initialization...');
    
    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      console.log('Setting up Vite in development mode...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving...');
      serveStatic(app);
    }

    // Start the server
    const port = 5000;
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${port}`);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();