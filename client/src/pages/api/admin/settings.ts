import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin, adminDb } from '@/lib/firebase-admin';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Helper method to wait for a middleware to execute before continuing
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Extend the base type to include Firestore Timestamp methods
interface FirestoreTimestamp {
  toDate: () => Date;
  toMillis: () => number;
  isEqual: (other: any) => boolean;
  valueOf: () => string;
}

type AdminSettings = {
  maintenanceMode: boolean;
  userRegistration: boolean;
  lastUpdated?: string | Date | FirestoreTimestamp;
  updatedBy?: string;
};

const ADMIN_SETTINGS_DOC = 'settings/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Missing or invalid authorization header' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const { auth, db } = getFirebaseAdmin();
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return res.status(403).json({ 
        success: false,
        error: 'Forbidden - Insufficient permissions' 
      });
    }

    const docRef = db.collection('settings').doc('admin');

    // GET: Retrieve current settings
    if (req.method === 'GET') {
      try {
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = docSnap.data() as AdminSettings | undefined;
          
          // Ensure we have valid data
          if (!data) {
            return res.status(200).json({
              success: true,
              data: {
                maintenanceMode: false,
                userRegistration: true,
                lastUpdated: new Date().toISOString()
              }
            });
          }
          
          // Convert lastUpdated to ISO string if it's a Date or Firestore Timestamp
          let lastUpdated: string;
          if (data.lastUpdated) {
            if (typeof data.lastUpdated === 'string') {
              lastUpdated = data.lastUpdated;
            } else if ('toDate' in data.lastUpdated) {
              // Handle Firestore Timestamp
              lastUpdated = data.lastUpdated.toDate().toISOString();
            } else if (data.lastUpdated instanceof Date) {
              lastUpdated = data.lastUpdated.toISOString();
            } else {
              lastUpdated = new Date().toISOString();
            }
          } else {
            lastUpdated = new Date().toISOString();
          }
          
          const responseData: AdminSettings = {
            maintenanceMode: data.maintenanceMode ?? false,
            userRegistration: data.userRegistration ?? true,
            lastUpdated,
            updatedBy: data.updatedBy
          };
          
          return res.status(200).json({
            success: true,
            data: responseData
          });
        } else {
          // Initialize with default settings if not exists
          const now = new Date();
          const defaultSettings: AdminSettings = {
            maintenanceMode: false,
            userRegistration: true,
            lastUpdated: now,
            updatedBy: decodedToken.uid,
          };
          
          // Store the document with the current timestamp
          const updateData = {
            ...defaultSettings,
            lastUpdated: now
          };
          
          await docRef.set(updateData);
          
          // Create a properly typed response object with ISO string for lastUpdated
          const responseData = {
            ...updateData,
            lastUpdated: now.toISOString()
          };
          
          return res.status(200).json({
            success: true,
            data: responseData
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error while fetching settings'
        });
      }
    }

    // POST: Update settings
    if (req.method === 'POST') {
      try {
        const { maintenanceMode, userRegistration } = req.body;

        // Validate request body
        if (typeof maintenanceMode !== 'boolean' || typeof userRegistration !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'Invalid request body. maintenanceMode and userRegistration are required and must be booleans.'
          });
        }

        const now = new Date();
        const updateData: Partial<AdminSettings> = {
          maintenanceMode,
          userRegistration,
          lastUpdated: now,
          updatedBy: decodedToken.uid
        };

        await docRef.set(updateData, { merge: true });

        // Prepare the response with the same data we just set
        const responseData: AdminSettings = {
          maintenanceMode,
          userRegistration,
          lastUpdated: now.toISOString(),
          updatedBy: decodedToken.uid
        };

        return res.status(200).json({
          success: true,
          data: responseData
        });
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error while updating settings'
        });
      }
    }

    // PUT: Update settings (same as POST for this endpoint)
    if (req.method === 'PUT') {
      try {
        const { maintenanceMode, userRegistration } = req.body;

        // Validate request body
        if (typeof maintenanceMode !== 'boolean' || typeof userRegistration !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'Invalid request body. maintenanceMode and userRegistration are required and must be booleans.'
          });
        }

        const now = new Date();
        const updateData: Partial<AdminSettings> = {
          maintenanceMode,
          userRegistration,
          lastUpdated: now,
          updatedBy: decodedToken.uid
        };

        await docRef.set(updateData, { merge: true });

        // Prepare the response with the same data we just set
        const responseData: AdminSettings = {
          maintenanceMode,
          userRegistration,
          lastUpdated: now.toISOString(),
          updatedBy: decodedToken.uid
        };

        return res.status(200).json({
          success: true,
          data: responseData
        });
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error while updating settings'
        });
      }
    }

    // Method not allowed
    return res.status(405).json({ 
      success: false,
      error: `Method ${req.method} not allowed` 
    });
  } catch (error: unknown) {
    console.error('Error in admin settings API:', error);
    
    // Handle different types of errors
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      
      if (errorCode === 'auth/id-token-expired') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired',
          details: 'The provided token has expired. Please log in again.'
        });
      }
      
      if (errorCode === 'auth/argument-error') {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid token',
          details: 'The provided token is invalid.'
        });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: errorMessage
    });
  }
}
