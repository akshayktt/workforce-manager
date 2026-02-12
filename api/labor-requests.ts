import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import pg from "pg";
import { laborRequests, projects, users } from "../shared/schema";
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
      
      let requests;
      
      if (user.role === 'admin') {
        // Admin: get all requests
        requests = await db
          .select({
            id: laborRequests.id,
            projectId: laborRequests.projectId,
            laborId: laborRequests.laborId,
            supervisorId: laborRequests.supervisorId,
            startDate: laborRequests.startDate,
            endDate: laborRequests.endDate,
            status: laborRequests.status,
            createdAt: laborRequests.createdAt,
          })
          .from(laborRequests);
      } else if (user.role === 'supervisor') {
        // Supervisor: only requests for their projects
        requests = await db
          .select({
            id: laborRequests.id,
            projectId: laborRequests.projectId,
            laborId: laborRequests.laborId,
            supervisorId: laborRequests.supervisorId,
            startDate: laborRequests.startDate,
            endDate: laborRequests.endDate,
            status: laborRequests.status,
            createdAt: laborRequests.createdAt,
          })
          .from(laborRequests)
          .where(eq(laborRequests.supervisorId, user.id));
      } else if (user.role === 'labor') {
        // Labor: only requests assigned to them
        requests = await db
          .select({
            id: laborRequests.id,
            projectId: laborRequests.projectId,
            laborId: laborRequests.laborId,
            supervisorId: laborRequests.supervisorId,
            startDate: laborRequests.startDate,
            endDate: laborRequests.endDate,
            status: laborRequests.status,
            createdAt: laborRequests.createdAt,
          })
          .from(laborRequests)
          .where(eq(laborRequests.laborId, user.id));
      } else {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Enrich with related data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          // Get project info
          const [project] = await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, request.projectId));

          // Get labor info  
          const [labor] = await db
            .select({ fullName: users.fullName, skills: users.skills })
            .from(users)
            .where(eq(users.id, request.laborId));

          // Get supervisor info
          const [supervisor] = await db
            .select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, request.supervisorId));

          return {
            ...request,
            projectName: project?.name || 'Unknown Project',
            laborName: labor?.fullName || 'Unknown Labor',
            laborSkills: labor?.skills || [],
            supervisorName: supervisor?.fullName || 'Unknown Supervisor'
          };
        })
      );

      await pool.end();

      return res.status(200).json(enrichedRequests);

    } catch (error) {
      console.error('Labor requests API error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}