import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'super_admin')[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  redirectTo = '/login',
}) => {
  const [location, setLocation] = useLocation();
  const [matches] = useRoute(redirectTo);
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db as Firestore, 'users', user.id));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (loading || isLoading) return;

    if (!user) {
      setLocation(`${redirectTo}?redirect=${encodeURIComponent(location)}`);
      return;
    }

    // Check if user has required role
    const userIsAdmin = userRole === 'admin' || userRole === 'super_admin';
    const userIsSuperAdmin = userRole === 'super_admin';
    
    const hasRequiredRole = roles.length === 0 || 
      (userRole && roles.includes(userRole as 'admin' | 'super_admin')) ||
      (userIsAdmin && roles.includes('admin')) ||
      (userIsSuperAdmin && roles.includes('super_admin'));

    if (!hasRequiredRole) {
      setLocation('/unauthorized');
    }
  }, [user, userRole, location, redirectTo, roles, matches, setLocation, loading, isLoading]);

  // Handle redirects and role checks in useEffect
  useEffect(() => {
    if (loading || isLoading) return;

    if (!user) {
      setLocation(`${redirectTo}?redirect=${encodeURIComponent(location)}`);
      return;
    }

    // Check if user has required role
    const userIsAdmin = userRole === 'admin' || userRole === 'super_admin';
    const userIsSuperAdmin = userRole === 'super_admin';
    
    const hasRequiredRole = roles.length === 0 || 
      (userRole && roles.includes(userRole as 'admin' | 'super_admin')) ||
      (userIsAdmin && roles.includes('admin')) ||
      (userIsSuperAdmin && roles.includes('super_admin'));

    if (!hasRequiredRole) {
      setLocation('/unauthorized');
    }
  }, [user, userRole, loading, isLoading, location, redirectTo, roles, setLocation]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we don't have a user or the user role is still loading, don't render anything
  if (!user || (roles.length > 0 && !userRole)) {
    return null;
  }

  // Check if user has required role
  const userIsAdmin = userRole === 'admin' || userRole === 'super_admin';
  const userIsSuperAdmin = userRole === 'super_admin';
  
  const hasRequiredRole = roles.length === 0 || 
    (userRole && roles.includes(userRole as 'admin' | 'super_admin')) ||
    (userIsAdmin && roles.includes('admin')) ||
    (userIsSuperAdmin && roles.includes('super_admin'));

  if (!hasRequiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
