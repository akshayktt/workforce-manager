import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import bcrypt from "bcryptjs";
import { storage, seedDatabase } from "./storage";
import type { LaborRequest } from "@/shared/schema";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

/**
 * Deduplicate requests by removing entries with duplicate (projectId, laborId, supervisorId)
 * Keeps the first occurrence of each combination
 */
function deduplicateRequests(requests: LaborRequest[]): LaborRequest[] {
  const seen = new Set<string>();
  return requests.filter(request => {
    const key = `${request.projectId}|${request.laborId}|${request.supervisorId}`;
    if (seen.has(key)) {
      console.log(`[Dedup] Removing duplicate request: ${key}`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.session.role!)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "workforce-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  await seedDatabase();

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  });

  app.get("/api/users/labor", requireAuth, async (req: Request, res: Response) => {
    const { search, searchBy } = req.query;
    let laborers;

    if (search && typeof search === "string" && search.trim()) {
      if (searchBy === "skill") {
        laborers = await storage.searchLaborBySkill(search.trim());
      } else {
        laborers = await storage.searchLaborByUsername(search.trim());
      }
    } else {
      laborers = await storage.getUsersByRole("labor");
    }

    res.json(
      laborers.map((l) => ({
        id: l.id,
        username: l.username,
        fullName: l.fullName,
        role: l.role,
        skills: l.skills || [],
      }))
    );
  });

  app.get("/api/users/supervisors", requireAuth, async (_req: Request, res: Response) => {
    const supervisors = await storage.getUsersByRole("supervisor");
    res.json(
      supervisors.map((s) => ({
        id: s.id,
        username: s.username,
        fullName: s.fullName,
        role: s.role,
      }))
    );
  });

  app.post("/api/projects", requireRole("supervisor"), async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Project name required" });
      }

      const project = await storage.createProject({
        name,
        description: description || null,
        supervisorId: req.session.userId!,
      });

      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      let projectsList;
      if (req.session.role === "supervisor") {
        projectsList = await storage.getProjectsBySupervisor(req.session.userId!);
      } else {
        projectsList = await storage.getAllProjects();
      }
      res.json(projectsList);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    const project = await storage.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });

  app.post("/api/labor-requests", requireRole("supervisor"), async (req: Request, res: Response) => {
    try {
      const { projectId, laborId, startDate, endDate } = req.body;
      if (!projectId || !laborId || !startDate || !endDate) {
        return res.status(400).json({ message: "All fields required" });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      const isAvailable = await storage.checkLaborAvailability(laborId, start, end);
      if (!isAvailable) {
        return res.status(409).json({ message: "Labor is already scheduled during this period" });
      }

      const request = await storage.createLaborRequest({
        projectId,
        laborId,
        supervisorId: req.session.userId!,
        startDate: start,
        endDate: end,
      });

      res.json(request);
    } catch (error) {
      console.error("Create labor request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/labor-requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      let requests;

      if (req.session.role === "admin") {
        if (status) {
          requests = await storage.getLaborRequestsByStatus(status as string);
        } else {
          const pending = await storage.getLaborRequestsByStatus("pending");
          const approved = await storage.getLaborRequestsByStatus("approved");
          const rejected = await storage.getLaborRequestsByStatus("rejected");
          requests = [...pending, ...approved, ...rejected];
        }
      } else if (req.session.role === "supervisor") {
        let supervisorRequests = await storage.getLaborRequestsBySupervisor(req.session.userId!);
        // Deduplicate in case there are duplicate entries
        supervisorRequests = deduplicateRequests(supervisorRequests);
        requests = supervisorRequests;
      } else {
        requests = await storage.getLaborRequestsByLabor(req.session.userId!);
      }

      const enriched = await Promise.all(
        requests.map(async (r) => {
          const project = await storage.getProjectById(r.projectId);
          const labor = await storage.getUser(r.laborId);
          const supervisor = await storage.getUser(r.supervisorId);
          return {
            ...r,
            projectName: project?.name || "Unknown",
            laborName: labor?.fullName || "Unknown",
            laborSkills: labor?.skills || [],
            supervisorName: supervisor?.fullName || "Unknown",
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Get labor requests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/labor-requests/:id", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const updated = await storage.updateLaborRequestStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/labor-availability/:laborId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates required" });
      }

      const available = await storage.checkLaborAvailability(
        req.params.laborId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ available });
    } catch (error) {
      console.error("Check availability error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/labor-scheduled/:laborId", requireAuth, async (req: Request, res: Response) => {
    try {
      const scheduledRanges = await storage.getLaborScheduledRanges(req.params.laborId);
      res.json({ scheduledRanges });
    } catch (error) {
      console.error("Get scheduled ranges error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users/create", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { username, password, fullName, role, skills } = req.body;

      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ message: "Username, password, fullName, and role are required" });
      }

      if (!["supervisor", "labor"].includes(role)) {
        return res.status(400).json({ message: "Role must be 'supervisor' or 'labor'" });
      }

      // Check if user already exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create user
      const user = await storage.createUser({
        username,
        password,
        fullName,
        role,
        skills: role === "labor" ? (skills || []) : undefined,
      });

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        skills: user.skills,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
