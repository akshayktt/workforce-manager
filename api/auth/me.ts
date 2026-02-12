import { getAuthenticatedUser } from "../auth-helper";

// Auth me endpoint
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ 
          message: 'Not authenticated'
        });
      }

      return res.status(200).json({
        id: user.id,
        fullName: user.fullName,
        role: user.role
      });
    } catch (error) {
      console.error('[Auth/Me] Error:', error);
      return res.status(500).json({ 
        message: 'Server error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}