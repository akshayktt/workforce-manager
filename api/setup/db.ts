import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users } from "@/shared/schema";

// Database connection for serverless
const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});
const db = drizzle(sql);

// Database setup/seeding endpoint
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      console.log('[DB Setup] Starting database setup');
      
      // Check if admin user already exists
      const [existingAdmin] = await db.select().from(users).where(eq(users.username, 'admintest'));
      if (existingAdmin) {
        console.log('[DB Setup] Database already seeded');
        return res.status(200).json({ 
          message: 'Database already seeded',
          users: ['admintest', 'supervisor1', 'labor1']
        });
      }

      console.log('[DB Setup] Seeding database with demo accounts');
      
      // Hash passwords
      const adminPassword = await bcrypt.hash('password123', 10);
      const supervisorPassword = await bcrypt.hash('password123', 10);
      const laborPassword = await bcrypt.hash('password123', 10);

      // Create users
      await db.insert(users).values([
        {
          username: 'admintest',
          password: adminPassword,
          fullName: 'System Admin',
          role: 'admin',
        },
        {
          username: 'supervisor1',
          password: supervisorPassword,
          fullName: 'John Supervisor',
          role: 'supervisor',
        },
        {
          username: 'labor1',
          password: laborPassword,
          fullName: 'Mike Worker',
          role: 'labor',
          skills: ['Carpentry', 'Framing', 'Drywall'],
        }
      ]);

      console.log('[DB Setup] Demo accounts seeded successfully');
      
      return res.status(200).json({ 
        message: 'Database seeded successfully',
        users: ['admintest', 'supervisor1', 'labor1']
      });

    } catch (error) {
      console.error('[DB Setup] Setup error:', error);
      return res.status(500).json({ 
        message: 'Database setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}