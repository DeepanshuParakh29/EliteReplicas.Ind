import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

async function setCorsConfig() {
  try {
    // Initialize Firebase Admin SDK with your service account
    const serviceAccount = JSON.parse(
      await readFile(new URL('./serviceAccountKey.json', import.meta.url))
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'couture-control.appspot.com'
    });

    const bucket = admin.storage().bucket();

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

    // Set the CORS configuration
    await bucket.setCorsConfiguration(cors);
    console.log('CORS configuration set successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
    process.exit(1);
  }
}

setCorsConfig();
