import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin, adminAuth } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Initialize Firebase Admin if not already initialized
const admin = getFirebaseAdmin();
const bucket = admin.storage.bucket();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Helper to handle multer in API routes
const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Handle file upload using multer
    await runMiddleware(req, res, upload.single('file'));
    
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify the user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    // Verify the token
    try {
      await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    // Generate a unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `product-images/${fileName}`;

    // Upload the file to Firebase Storage
    const fileUpload = bucket.file(filePath);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Handle upload completion
    await new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Error uploading file:', error);
        reject(new Error('Error uploading file'));
      });

      stream.on('finish', resolve);
      
      // Write the file buffer to the stream
      stream.end(file.buffer);
    });

    // Make the file publicly accessible
    await fileUpload.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    return res.status(200).json({
      success: true,
      fileUrl: publicUrl,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ 
      success: false,
      message: errorMessage 
    });
  }
}
