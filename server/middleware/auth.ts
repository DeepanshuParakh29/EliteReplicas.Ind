import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Attach user information to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user' // Default role is 'user' if not specified
    };
    
    next();
  } catch (error: unknown) {
    console.error('Error verifying token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(401).json({ 
      message: 'Unauthorized - Invalid token',
      error: errorMessage
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};
