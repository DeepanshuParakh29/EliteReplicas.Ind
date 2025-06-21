const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

async function setCorsConfiguration() {
  // The name of your bucket
  const bucketName = 'couture-control.appspot.com';

  // The CORS configuration
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

  try {
    await storage.bucket(bucketName).setCorsConfiguration(cors);
    console.log(`CORS configuration set for ${bucketName}`);
  } catch (error) {
    console.error('Error setting CORS configuration:', error);
  }
}

setCorsConfiguration();
