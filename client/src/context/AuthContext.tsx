import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { handleRedirectResult, signInWithGoogle } from "@/lib/auth";
import { User } from "@/types";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { userService, CreateUserInput } from "@/services/user";

// Extend the default User type to include Firebase-specific fields
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
    throw new Error("useAuth must be used within an AuthProvider");
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
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const signInWithGooglePopup = async () => {
    try {
      const result = await signInWithGoogle(true); // Use popup
      if (result.success && result.user) {
        console.log("Google Popup Result: User signed in", result.user.uid);
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

    // Firebase auth state observer
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
            if (error.status === 404) { // Check for 404 status code
              console.log("User not found in backend, attempting to create new user.");
              try {
                const userData: CreateUserInput = {
                  email: firebaseUser.email!,
                  firstName: firebaseUser.displayName?.split(' ')[0],
                  lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
                  fullName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                  avatar: firebaseUser.photoURL || undefined,
                  role: 'user',
                  isActive: true,
                  emailVerified: firebaseUser.emailVerified,
                  firebaseUid: firebaseUser.uid,
                };
                
                try {
                  const newUser = await userService.createUser(userData);
                  console.log("New user created successfully:", newUser);
                  setUser({
                    ...newUser,
                    firebaseUid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                  });
                  if (location !== "/Home") {
                    navigate("/Home");
                  }
                } catch (error: any) {
                  console.error("Error creating user:", error);
                  toast({
                    title: "Error Creating Account",
                    description: error.message || "Failed to create user account",
                    variant: "destructive",
                  });
                }
              } catch (createError: any) {
                toast({
                  title: "Profile Setup Complete",
                  description: "Your new user profile has been successfully created.",
                });
              }
            } else {
              toast({
                title: "Error Fetching User Data",
                description: `An unexpected error occurred while fetching your user data: ${error.message}`,
                variant: "destructive",
              });
            }
          }
        } catch (error: any) {
          console.error("Error fetching or creating user:", error);
          toast({
            title: "Error",
            description: error.message || "An error occurred while processing your request",
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

    return () => unsubscribe();
  }, [navigate, toast]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
      throw error; // Re-throw to allow error handling in components
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signOut,
        signInWithGooglePopup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
