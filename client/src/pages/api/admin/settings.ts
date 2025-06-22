import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

type AdminSettings = {
  maintenanceMode: boolean;
  userRegistration: boolean;
  lastUpdated?: FirebaseFirestore.Timestamp | Date;
  updatedBy?: string;
};

const ADMIN_SETTINGS_DOC = 'settings/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
          return res.status(200).json({
            success: true,
            data: docSnap.data()
          });
        } else {
          // Initialize with default settings if not exists
          const defaultSettings: AdminSettings = {
            maintenanceMode: false,
            userRegistration: true,
            lastUpdated: new Date(),
            updatedBy: decodedToken.uid,
          };
          
          await docRef.set(defaultSettings);
          
          return res.status(200).json({
            success: true,
            data: defaultSettings
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        throw new Error('Failed to fetch settings');
      }
    }

    // POST/PUT: Update settings
    if (req.method === 'POST' || req.method === 'PUT') {
      const { maintenanceMode, userRegistration } = req.body;
      
      // Validate request body
      if (typeof maintenanceMode !== 'boolean' || typeof userRegistration !== 'boolean') {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid request body - maintenanceMode and userRegistration must be booleans' 
        });
      }

      try {
        const updates: Partial<AdminSettings> = {
          maintenanceMode,
          userRegistration,
          lastUpdated: new Date(),
          updatedBy: decodedToken.uid,
        };

        await docRef.set(updates, { merge: true });
        
        return res.status(200).json({
          success: true,
          message: 'Settings updated successfully',
          data: updates
        });
      } catch (error) {
        console.error('Error updating settings:', error);
        throw new Error('Failed to update settings');
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
