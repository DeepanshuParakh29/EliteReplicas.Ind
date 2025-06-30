import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";
import { auth } from "./firebase";

const googleProvider = new GoogleAuthProvider();

type AuthResponse = {
  success: boolean;
  user?: FirebaseUser | null;
  error?: string;
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  if (!auth) {
    return { success: false, error: 'Authentication service is not available' };
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    return { success: false, error: errorMessage };
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  if (!auth) {
    return { success: false, error: 'Authentication service is not available' };
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    return { success: false, error: errorMessage };
  }
};

export const signInWithGoogle = async (usePopup = false): Promise<AuthResponse> => {
  if (!auth) {
    return { success: false, error: 'Authentication service is not available' };
  }
  try {
    if (usePopup) {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } else {
      await signInWithRedirect(auth, googleProvider);
      return { success: true };
    }
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    return { success: false, error: errorMessage };
  }
};

export const handleRedirectResult = async (): Promise<AuthResponse> => {
  if (!auth) {
    return { success: false, error: 'Authentication service is not available' };
  }
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return { success: true, user: result.user };
    }
    // If result is null or result.user is null, it means no user was authenticated via redirect.
    // This is not necessarily an error, but rather a non-authentication event (e.g., user closed the popup).
    return { success: true, user: null };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    return { success: false, error: errorMessage };
  }
};

export const logOut = async (): Promise<AuthResponse> => {
  if (!auth) {
    return { success: false, error: 'Authentication service is not available' };
  }
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    const errorMessage = getAuthErrorMessage(authError.code);
    return { success: false, error: errorMessage };
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth?.currentUser || null;
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/wrong-password":
      return "Invalid password";
    case "auth/user-not-found":
      return "User not found";
    case "auth/email-already-in-use":
      return "Email already exists";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    default:
      return "An error occurred. Please try again";
  }
};
