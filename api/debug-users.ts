import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../shared/schema";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ 
          message: 'DATABASE_URL not configured',
          env: process.env.NODE_ENV 
        });
      }

      console.log('[Debug] Connecting to database...');
      const pool = new pg.Pool({ connectionString: databaseUrl });
      const db = drizzle(pool);
      
      // Get all users (without passwords)
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role
      }).from(users);
      
      await pool.end();
      console.log('[Debug] Found users:', allUsers.length);

      return res.status(200).json({
        message: 'Database connection successful',
        userCount: allUsers.length,
        users: allUsers,
        databaseConfigured: !!databaseUrl,
        environment: process.env.NODE_ENV
      });

    } catch (error) {
      console.error('[Debug] Database error:', error);
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        databaseConfigured: !!process.env.DATABASE_URL
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}