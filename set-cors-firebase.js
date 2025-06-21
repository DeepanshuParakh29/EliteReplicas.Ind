import { getStorage } from 'firebase-admin/storage';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFile } from 'fs/promises';

async function setCorsConfig() {
  try {
    // Initialize Firebase Admin with application default credentials
    const app = initializeApp({
      credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)),
      storageBucket: 'couture-control.appspot.com'
    });

    const bucket = getStorage(app).bucket();

    // Set CORS configuration
    const cors = [
      {
        origin: ['http://localhost:3000', 'http://localhost:5000'],
        method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        responseHeader: [
          'Content-Type',
          'x-goog-meta-*',
          'x-goog-content-length-range'
        ],
        maxAgeSeconds: 3600
      }
    ];

    await bucket.setCorsConfiguration(cors);
    console.log('CORS configuration set successfully!');
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  } finally {
    process.exit(0);
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setCorsConfig();
}
