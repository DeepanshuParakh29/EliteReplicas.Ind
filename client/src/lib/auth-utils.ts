import { adminAuth } from './firebase-admin';

type UserRole = 'user' | 'admin' | 'super_admin';

export interface DecodedToken {
  uid: string;
  email?: string;
  role?: UserRole;
  [key: string]: any;
}

/**
 * Verify the Firebase ID token and return the decoded token
 */
export async function verifyAuthToken(idToken: string): Promise<DecodedToken> {
  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get the user's role from Firestore
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};
    
    return {
      ...decodedToken,
      role: customClaims.role || 'user',
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Check if a user has the required role
 */
export function hasRole(user: DecodedToken, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    admin: 1,
    super_admin: 2,
  };

  const userRoleLevel = roleHierarchy[user.role || 'user'];
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Check if a user has any of the required roles
 */
export function hasAnyRole(user: DecodedToken, ...roles: UserRole[]): boolean {
  return roles.some(role => hasRole(user, role));
}

/**
 * Get the user's role from the request
 */
export async function getUserRoleFromRequest(req: Request): Promise<UserRole | null> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyAuthToken(idToken);
    
    return (decodedToken.role as UserRole) || 'user';
  } catch (error) {
    console.error('Error getting user role from request:', error);
    return null;
  }
}
