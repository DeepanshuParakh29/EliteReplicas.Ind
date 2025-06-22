import { createServer } from "http";
 import express, { Request, Response, NextFunction } from "express";
// Import the necessary Firebase Admin SDK modules
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase configuration from environment variables

import { setupVite, serveStatic, log } from "./vite";

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK
// Check if Firebase has already been initialized to prevent errors in hot-reloading environments

// Type assertion for service account
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Initialize Firebase Admin if not already initialized (optional for development)
let firebaseApp;
try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey && getApps().length === 0) {
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
  } else if (getApps().length > 0) {
    firebaseApp = getApp();
  }
} catch (error) {
  console.warn('Firebase initialization skipped:', error.message);
}

console.log('Firebase Admin SDK initialized successfully.');

// Import and setup routes AFTER creating the app
import { simpleStorage, simpleFileStorage } from "./simple-storage";
import appRoutes from "./routes";

// Setup routes with the simple storage service
app.use('/', appRoutes(simpleStorage, simpleFileStorage));

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