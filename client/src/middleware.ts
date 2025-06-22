import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuthToken, hasRole, getUserRoleFromRequest } from '@/lib/auth-utils';

// Paths that are always accessible
const PUBLIC_PATHS = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/maintenance',
  '/api/health',
  '/_next/static',
  '/_next/image',
  '/images',
  '/fonts',
  '/login',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signin',
  '/api/auth/error',
  '/api/auth/verify-request',
  '/api/auth/signout',
  '/api/auth/callback',
];

// Admin paths that require admin or super_admin role
const ADMIN_PATHS = [
  '/admin',
  '/api/admin',
];

// Paths that should be excluded from middleware
const EXCLUDED_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/api/health',
  '/maintenance',
  '/_next/static',
  '/_next/image',
  '/images',
  '/fonts',
  '/api/auth',
];

/**
 * Middleware function to handle authentication and authorization
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Check if the path requires admin access
    const requiresAdmin = ADMIN_PATHS.some(path => pathname.startsWith(path));
    
    if (requiresAdmin) {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyAuthToken(idToken);
        
        // Check if user has admin or super_admin role
        if (!hasRole(decodedToken, 'admin')) {
          return new NextResponse(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        console.error('Authentication error:', error);
        return new NextResponse(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check maintenance mode for non-admin requests
    if (!requiresAdmin) {
      const settingsDoc = await adminDb.collection('settings').doc('admin').get();
      const settings = settingsDoc.data() as { maintenanceMode?: boolean };

      // If maintenance mode is enabled, redirect to maintenance page
      if (settings?.maintenanceMode) {
        if (!pathname.startsWith('/maintenance')) {
          const url = request.nextUrl.clone();
          url.pathname = '/maintenance';
          return NextResponse.redirect(url);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of error, return a 500 response for API routes
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // For non-API routes, redirect to error page
    const url = request.nextUrl.clone();
    url.pathname = '/500';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
