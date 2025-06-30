import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import express, { Request, Response, NextFunction } from 'express';

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug log environment variables
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '***' : 'MISSING',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '***' : 'MISSING',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '***' : 'MISSING',
});
// Import the necessary Firebase Admin SDK modules
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase configuration from environment variables

import { setupVite, serveStatic, log } from "./vite";

// Create Express app and HTTP server
const app = express();
export default app;

// Only create HTTP server when running standalone (not in Cloud Functions)
const server = !process.env.K_SERVICE && !process.env.FUNCTIONS_EMULATOR ? createServer(app) : undefined;

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

// Firebase Admin is now initialized in firebase-admin.ts

// Import middleware and routes
import { authenticate } from './middleware/auth';
import { simpleStorage, simpleFileStorage } from "./simple-storage.js";
import appRoutes from "./routes";

// Apply authentication middleware to all API routes
app.use('/api', (req, res, next) => {
  // Skip auth for public routes
  const publicRoutes = ['/api/products', '/api/products/:id'];
  if (publicRoutes.some(route => {
    const regex = new RegExp(`^${route.replace(/:[^/]+/g, '([^/]+)')}$`);
    return regex.test(req.path);
  })) {
    return next();
  }
  return authenticate(req, res, next);
});

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

// Server initialization (only when running standalone, not in Cloud Functions)
if (server) {
  (async () => {
  try {
    console.log('Starting server initialization...');
    
    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      console.log('Setting up Vite in development mode...');
      await setupVite(app, server!);
    } else {
      console.log('Setting up static file serving...');
      serveStatic(app);
    }

    // Start the server
    const port = 5000;
    server!.on('error', (error: NodeJS.ErrnoException) => {
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

    server!.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on http://localhost:${port}`);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  })();
}