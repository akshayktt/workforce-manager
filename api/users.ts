// Import database components
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { users } from "../shared/schema";

// Users endpoint
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ message: 'Database not configured' });
      }

      const pool = new pg.Pool({ connectionString: databaseUrl });
      const db = drizzle(pool);
      
      // Get all users (excluding passwords)
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        skills: users.skills
      }).from(users);
      
      await pool.end();

      return res.status(200).json(allUsers);

    } catch (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}