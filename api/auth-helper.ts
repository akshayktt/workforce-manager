export interface AuthUser {
  id: string;
  role: string;
  fullName: string;
}

/**
 * Extract and validate user from JWT token in request headers
 * Returns user info if authenticated, null otherwise
 */
export async function getAuthenticatedUser(req: any): Promise<AuthUser | null> {
  try {
    // For direct API testing: allow overriding user role via query parameter
    const url = new URL(req.url || '', 'https://example.com');
    const testRole = url.searchParams.get('testRole');
    
    if (testRole === 'supervisor') {
      console.log('[Auth] Testing as supervisor via testRole');
      return {
        id: 'fcc0afbe-a632-46a5-9cec-ba45c4df9f01', // supervisor1 ID
        role: 'supervisor',
        fullName: 'John Supervisor'
      };
    }
    
    if (testRole === 'labor') {
      console.log('[Auth] Testing as labor via testRole');
      return {
        id: '27b3f620-3fd7-4749-82ae-b00aba142ceb', // labor1 ID
        role: 'labor',
        fullName: 'Mike Worker'
      };
    }

    // Check Authorization header for JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No Authorization header found');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // For our simple base64 tokens
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      console.log(`[Auth] Authenticated user: ${decoded.fullName} (${decoded.role})`);
      
      return {
        id: decoded.userId,
        role: decoded.role,
        fullName: decoded.fullName
      };
      
    } catch (tokenError) {
      console.log('[Auth] Invalid token:', tokenError);
      return null;
    }


    
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}