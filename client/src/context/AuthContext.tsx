import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  getRedirectResult, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  UserCredential,
  updateProfile as updateFirebaseUserProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc, serverTimestamp, DocumentData } from 'firebase/firestore';
import { ToastAction } from '@/components/ui/toast';

/**
 * Base user type that represents a user in our application.
 * Combines Firebase User properties with our custom fields.
 */
interface AppUser {
  // Firebase User properties
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  
  // Required custom properties
  id: string; // Same as uid for simplicity
  firebaseUid: string; // Alias for uid to match our data model
  name: string; // User's display name (same as displayName)
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Optional user details
  firstName?: string;
  lastName?: string;
  avatar?: string;
  
  // Add index signature to allow any string key with any value
  [key: string]: any;
}

// Helper function to convert Firestore timestamps to Date
const toDate = (date: Date | string | { toDate: () => Date } | undefined): Date | undefined => {
  if (!date) return undefined;
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (typeof date === 'object' && 'toDate' in date) return date.toDate();
  return new Date();
};

/**
 * AuthUser represents the user object used throughout our application.
 * It extends AppUser with specific type requirements for dates.
 */
type AuthUser = Omit<AppUser, 'createdAt' | 'updatedAt'> & {
  // Override with specific types for our application
  createdAt: Date;
  updatedAt: Date;
  // Add index signature to allow any string key with any value
  [key: string]: any;
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<void>;
  checkIsAdmin: (user: AuthUser | null) => boolean;
  checkIsSuperAdmin: (user: AuthUser | null) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Helper function to check if user has admin role
  const isAdmin = (user: AuthUser | null): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  };

  // Helper function to check if user has super admin role
  const isSuperAdmin = (user: AuthUser | null): boolean => {
    return user?.role === 'super_admin';
  };

  // Create or update user in Firestore
  const createOrUpdateUserInFirestore = useCallback(async (user: FirebaseUser): Promise<AuthUser> => {
    if (!db) {
      throw new Error('Database not available');
    }
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const existingUser = userSnap.exists() ? userSnap.data() as Omit<AuthUser, 'id'> : null;
    
    // Preserve existing role or default to 'user'
    const userRole = existingUser?.role || 'user';
    
    // Safely handle createdAt date
    const safeCreatedAt = (() => {
      try {
        if (!existingUser?.createdAt) return new Date();
        const date = existingUser.createdAt instanceof Date 
          ? existingUser.createdAt 
          : new Date(existingUser.createdAt);
        return isNaN(date.getTime()) ? new Date() : date;
      } catch (e) {
        return new Date();
      }
    })();
    
    // Create the user data object with proper typing
    const userData: Omit<AuthUser, 'id'> = {
      // Firebase User properties
      uid: user.uid,
      email: user.email || '',
      emailVerified: user.emailVerified || false,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || '',
      
      // Custom properties
      firebaseUid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      role: userRole,
      isActive: true,
      createdAt: safeCreatedAt,
      updatedAt: new Date(),
      
      // Optional properties
      ...(existingUser?.firstName && { firstName: existingUser.firstName }),
      ...(existingUser?.lastName && { lastName: existingUser.lastName }),
      ...(existingUser?.avatar && { avatar: existingUser.avatar })
    };
    
    // Create the full user object with all required properties
    const userWithId = {
      // Spread all userData first
      ...userData,
      
      // Ensure required properties are set
      id: user.uid,
      firebaseUid: user.uid,
      
      // Ensure dates are Date objects
      createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date(userData.createdAt),
      updatedAt: new Date()
    } as AuthUser;
    
    // Save to Firestore
    await setDoc(userRef, userWithId, { merge: true });
    return userWithId;
  }, []);

  // Handle email/password sign in
  const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) throw new Error('Authentication service not available');
    
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password sign up
  const signUpWithEmail = async (email: string, password: string, name: string): Promise<UserCredential> => {
    if (!auth) throw new Error('Authentication service not available');
    
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: name });
      }
      
      return result;
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign in
  const signInWithGoogle = async (): Promise<UserCredential> => {
    if (!auth) {
      const error = 'Firebase authentication is not configured';
      setError(error);
      throw new Error(error);
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Authentication service not available');
    
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for the password reset link.',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<AuthUser>): Promise<void> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    
    try {
      setLoading(true);
      
      // Update Firebase Auth profile
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (updates.name) authUpdates.displayName = updates.name;
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
      
      if (Object.keys(authUpdates).length > 0) {
        await updateFirebaseProfile(auth.currentUser, authUpdates);
      }
      
      // Update Firestore user document
      if (db) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, 
          { 
            ...updates, 
            updatedAt: serverTimestamp() 
          }, 
          { merge: true }
        );
      }
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    if (!auth) return;
    
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Handle auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in
          setFirebaseUser(user);
          
          try {
            // Get or create user in Firestore
            const userData = await createOrUpdateUserInFirestore(user);
            setUser(userData);
            
            // Set auth token for API requests
            const idToken = await user.getIdToken();
            // You can store this token in memory or in an HTTP-only cookie
            // For now, we'll just log it
            console.log('User authenticated with ID token:', idToken);
            
            // Redirect to home after successful authentication
            if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
              navigate('/');
            }
          } catch (error) {
            console.error('Error in user data handling:', error);
            setError('Failed to process user data');
          }
        } else {
          // User is signed out
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Failed to process authentication state');
      } finally {
        if (loading) setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, createOrUpdateUserInFirestore, loading, navigate]);

    // Handle Google OAuth redirect
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      if (!auth) return;
      
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Google sign-in successful:", result.user.uid);
          navigate("/");
        }
      } catch (error: any) {
        console.error("Error during Google redirect:", error);
        setError(error.message || "Failed to complete Google sign-in");
      }
    };

    handleGoogleRedirect();
  }, [auth, navigate]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = {
    firebaseUser,
    user,
    loading,
    error,
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    signInWithEmail,
    signUpWithEmail,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    checkIsAdmin: isAdmin,
    checkIsSuperAdmin: isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};
