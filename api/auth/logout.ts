// Simple logout endpoint
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      console.log('[Logout API] Logout request received');
      
      // Since we're using JWT tokens (stateless), logout is handled on the client side
      // by clearing the stored token. The server doesn't need to maintain session state.
      // We just return a success response to confirm the logout request was processed.
      
      console.log('[Logout API] Logout successful');
      return res.status(200).json({ message: 'Logged out successfully' });

    } catch (error) {
      console.error('[Logout API] Logout error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}