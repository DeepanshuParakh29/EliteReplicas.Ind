import { NextApiRequest, NextApiResponse } from 'next';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'degraded' | 'disconnected';
      responseTime?: number;
      error?: string;
    };
    // Add other services here as needed
  };
  version?: string;
  buildId?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      status: 'error',
      error: 'Method not allowed',
      allowedMethods: ['GET', 'OPTIONS']
    });
  }

  const startTime = process.hrtime();
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'disconnected' },
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  };

  try {
    // Check Firestore connection
    const { db } = getFirebaseAdmin();
    const dbStartTime = process.hrtime();
    
    try {
      await db.collection('health').doc('check').get();
      const dbEndTime = process.hrtime(dbStartTime);
      const dbResponseTime = Math.round((dbEndTime[0] * 1000) + (dbEndTime[1] / 1000000));
      
      response.services.database = {
        status: 'connected',
        responseTime: dbResponseTime,
      };
      
      // Consider the service degraded if response time is too high
      if (dbResponseTime > 500) { // 500ms threshold
        response.status = 'degraded';
        response.services.database.status = 'degraded';
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      response.status = 'unhealthy';
      response.services.database = {
        status: 'disconnected',
        error: dbError instanceof Error ? dbError.message : 'Database connection failed',
      };
    }

    // Add more service checks here as needed
    // Example: check external APIs, cache, etc.


    const endTime = process.hrtime(startTime);
    const totalResponseTime = Math.round((endTime[0] * 1000) + (endTime[1] / 1000000));

    // Add response time header
    res.setHeader('X-Response-Time', `${totalResponseTime}ms`);
    
    return res.status(response.status === 'unhealthy' ? 503 : 200).json(response);
  } catch (error: unknown) {
    console.error('Health check failed:', error);
    
    // Ensure we have a valid status code
    const statusCode = response.status === 'unhealthy' ? 503 : 500;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return res.status(statusCode).json({
      ...response,
      status: 'unhealthy',
      error: errorMessage,
    });
  }
}
