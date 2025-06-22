import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithPopup, GoogleAuthProvider, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/user';
import type { User, InsertUser } from '@shared/schema';

type AuthUser = User & {
  firebaseUid: string;
  name?: string;
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const provider = new GoogleAuthProvider();

  const handleRedirectResult = async () => {
    if (!auth) return null;
    
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        return { success: true, user: result.user };
      }
    } catch (error: any) {
      console.error('Error handling redirect result:', error);
      return { success: false, error: error.message };
    }
    return null;
  };

  const signInWithGooglePopup = async () => {
    if (!auth) {
      toast({
        title: "Authentication Unavailable",
        description: "Firebase authentication is not configured. Using demo mode.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        navigate("/Home");
      } else if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error during Google popup sign-in:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during Google sign-in",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.success && result.user) {
          console.log("Google Redirect Result: User signed in", result.user.uid);
          navigate("/");
        } else if (result?.error) {
          toast({
            title: "Authentication Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error during Google redirect result handling:", error);
        toast({
          title: "Authentication Error",
          description: error.message || "An error occurred during Google sign-in",
          variant: "destructive",
        });
      }
    };

    handleGoogleRedirect();

    // Firebase auth state observer - only if auth is available
    let unsubscribe: (() => void) | undefined;
    
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("onAuthStateChanged: Firebase user state changed - User UID:", firebaseUser ? firebaseUser.uid : "null");
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            console.log("Attempting to fetch user data from backend for UID:", firebaseUser.uid);
            try {
              const userData = await userService.getUserByFirebaseUid(firebaseUser.uid);
              console.log("User data fetched successfully:", userData);
              setUser({
                ...userData,
                firebaseUid: firebaseUser.uid,
                name: firebaseUser.displayName || userData.email.split('@')[0],
              });
              if (location !== "/Home") {
                navigate("/");
              }
            } catch (error: any) {
              if (error.status === 404) {
                console.log("User not found in backend, attempting to create new user.");
                try {
                  const userData: InsertUser = {
                    email: firebaseUser.email!,
                    firstName: firebaseUser.displayName?.split(' ')[0],
                    lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
                    firebaseUid: firebaseUser.uid,
                    role: 'customer',
                    avatar: firebaseUser.photoURL,
                  };

                  const newUser = await userService.createUser(userData);
                  console.log("New user created successfully:", newUser);
                  setUser({
                    ...newUser,
                    firebaseUid: firebaseUser.uid,
                    name: firebaseUser.displayName || newUser.email.split('@')[0],
                  });
                  navigate("/");
                } catch (createError: any) {
                  console.error("Error creating new user:", createError);
                  toast({
                    title: "Account Creation Error",
                    description: createError.message || "Failed to create user account",
                    variant: "destructive",
                  });
                }
              } else {
                console.error("Error fetching user data:", error);
                toast({
                  title: "Authentication Error",
                  description: error.message || "Failed to fetch user data",
                  variant: "destructive",
                });
              }
            }
          } catch (error: any) {
            console.error("Error during user authentication flow:", error);
            toast({
              title: "Authentication Error",
              description: error.message || "An error occurred during authentication",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      });
    } else {
      // If Firebase auth is not available, set loading to false
      setLoading(false);
      console.warn('Firebase authentication not available - using fallback mode');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate, toast]);

  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setFirebaseUser(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        title: "Sign Out Error",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user,
      loading,
      signOut,
      signInWithGooglePopup,
    }}>
      {children}
    </AuthContext.Provider>
  );
};