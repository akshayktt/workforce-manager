import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { projects, users } from "../shared/schema";
import { getAuthenticatedUser } from "./auth-helper";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Check authentication
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ message: 'Database not configured' });
      }

      const pool = new pg.Pool({ connectionString: databaseUrl });
      const db = drizzle(pool);
      
      let projectsList;
      
      if (user.role === 'supervisor') {
        // Supervisor: only their projects
        projectsList = await db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            supervisorId: projects.supervisorId,
            createdAt: projects.createdAt,
            supervisorName: users.fullName
          })
          .from(projects)
          .leftJoin(users, eq(projects.supervisorId, users.id))
          .where(eq(projects.supervisorId, user.id));
      } else {
        // Admin/Labor: all projects
        projectsList = await db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            supervisorId: projects.supervisorId,
            createdAt: projects.createdAt,
            supervisorName: users.fullName
          })
          .from(projects)
          .leftJoin(users, eq(projects.supervisorId, users.id));
      }

      await pool.end();

      const formattedProjects = projectsList.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        supervisorId: p.supervisorId,
        createdAt: p.createdAt,
        supervisorName: p.supervisorName || 'Unknown'
      }));

      return res.status(200).json(formattedProjects);

    } catch (error) {
      console.error('Projects API error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}