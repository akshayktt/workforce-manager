// Simple API handler for Vercel
export default async function handler(req: any, res: any) {
  const { method, url } = req;
  const path = new URL(url || '/', 'http://localhost').pathname.replace('/api', '');

  // CORS headers for frontend access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // This proxy handler should only handle routes not covered by specific API files
    // Individual API files like /api/projects.ts, /api/auth/login.ts handle specific endpoints
    
    // Test endpoint
    if (path === '/test') {
      return res.status(200).json({ 
        message: 'API is working!', 
        timestamp: new Date().toISOString(),
        path,
        method,
        environment: process.env.NODE_ENV
      });
    }

    // Health check
    if (path === '/health') {
      return res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    }

    // Routes handled by individual API files:
    // - /auth/login -> /api/auth/login.ts
    // - /auth/me -> /api/auth/me.ts
    // - /projects -> /api/projects.ts
    // - /labor-requests -> /api/labor-requests.ts
    // - /users -> /api/users.ts

    // Default response for unhandled routes
    return res.status(404).json({ 
      message: `API route ${path} not found`,
      availableRoutes: ['/test', '/health'],
      note: 'Most routes are handled by individual API files'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}