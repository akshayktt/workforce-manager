// server/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { createServer } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg2 from "pg";
import bcrypt2 from "bcryptjs";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("user_role", ["admin", "supervisor", "labor"]);
var requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull().default("labor"),
  skills: text("skills").array()
});
var projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var laborRequests = pgTable("labor_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  laborId: varchar("labor_id").notNull().references(() => users.id),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  skills: true
});
var insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true
});
var insertLaborRequestSchema = z.object({
  projectId: z.string(),
  laborId: z.string(),
  startDate: z.string(),
  endDate: z.string()
});

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, or, lte, gte, ne, ilike, sql as sql2 } from "drizzle-orm";
import pg from "pg";
import bcrypt from "bcryptjs";

// server/config.ts
var config = {
  development: {
    port: 4e3,
    databaseUrl: "postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
    sessionSecret: "workforce-secret-dev",
    allowedOrigins: [
      "http://localhost:8081",
      "http://localhost:4000",
      "http://localhost:3000",
      "http://localhost:19006",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:8081"
    ]
  },
  production: {
    port: parseInt(process.env.PORT || "5000", 10),
    databaseUrl: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full",
    sessionSecret: process.env.SESSION_SECRET || "workforce-secret-prod-change-me",
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || []
  }
};
function getConfig() {
  const env = process.env.NODE_ENV || "development";
  return config[env] || config.development;
}

// server/storage.ts
var config2 = getConfig();
var pool = new pg.Pool({
  connectionString: config2.databaseUrl
});
var db = drizzle(pool);
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
    return user;
  }
  async getUsersByRole(role) {
    return db.select().from(users).where(eq(users.role, role));
  }
  async createProject(project) {
    const [p] = await db.insert(projects).values(project).returning();
    return p;
  }
  async getProjectsBySupervisor(supervisorId) {
    return db.select().from(projects).where(eq(projects.supervisorId, supervisorId));
  }
  async getProjectById(id) {
    const [p] = await db.select().from(projects).where(eq(projects.id, id));
    return p;
  }
  async getAllProjects() {
    return db.select().from(projects);
  }
  async createLaborRequest(req) {
    const [lr] = await db.insert(laborRequests).values(req).returning();
    return lr;
  }
  async getLaborRequestsByStatus(status) {
    return db.select().from(laborRequests).where(eq(laborRequests.status, status));
  }
  async getLaborRequestsBySupervisor(supervisorId) {
    return db.select().from(laborRequests).where(eq(laborRequests.supervisorId, supervisorId));
  }
  async getLaborRequestsByLabor(laborId) {
    return db.select().from(laborRequests).where(eq(laborRequests.laborId, laborId));
  }
  async updateLaborRequestStatus(id, status) {
    const [lr] = await db.update(laborRequests).set({ status }).where(eq(laborRequests.id, id)).returning();
    return lr;
  }
  async checkLaborAvailability(laborId, startDate, endDate, excludeRequestId) {
    const conditions = [
      eq(laborRequests.laborId, laborId),
      eq(laborRequests.status, "approved"),
      lte(laborRequests.startDate, endDate),
      gte(laborRequests.endDate, startDate)
    ];
    if (excludeRequestId) {
      conditions.push(ne(laborRequests.id, excludeRequestId));
    }
    const conflicts = await db.select().from(laborRequests).where(and(...conditions));
    return conflicts.length === 0;
  }
  async searchLaborByUsername(query) {
    return db.select().from(users).where(
      and(
        eq(users.role, "labor"),
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.fullName, `%${query}%`)
        )
      )
    );
  }
  async searchLaborBySkill(skill) {
    const lowerSkill = skill.toLowerCase();
    return db.select().from(users).where(
      and(
        eq(users.role, "labor"),
        sql2`EXISTS (SELECT 1 FROM unnest(${users.skills}) AS s WHERE lower(s) LIKE ${`%${lowerSkill}%`})`
      )
    );
  }
  async getLaborScheduledRanges(laborId) {
    const approvedRequests = await db.select().from(laborRequests).where(and(eq(laborRequests.laborId, laborId), eq(laborRequests.status, "approved")));
    return approvedRequests.map((req) => ({
      startDate: req.startDate,
      endDate: req.endDate
    }));
  }
  async getNextAvailableDate(laborId, fromDate) {
    const scheduledRanges = await this.getLaborScheduledRanges(laborId);
    if (scheduledRanges.length === 0) {
      return fromDate;
    }
    scheduledRanges.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    if (fromDate < scheduledRanges[0].startDate) {
      return fromDate;
    }
    for (let i = 0; i < scheduledRanges.length; i++) {
      const endDate = scheduledRanges[i].endDate;
      const nextStartDate = scheduledRanges[i + 1]?.startDate;
      if (fromDate <= endDate) {
        if (!nextStartDate) {
          return new Date(endDate.getTime() + 24 * 60 * 60 * 1e3);
        }
        return nextStartDate;
      }
      if (!nextStartDate) {
        return endDate;
      }
    }
    return null;
  }
};
var storage = new DatabaseStorage();
async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (existingAdmin) return;
  console.log("Seeding database with demo accounts...");
  await storage.createUser({
    username: "admin",
    password: "admin123",
    fullName: "System Admin",
    role: "admin"
  });
  await storage.createUser({
    username: "supervisor1",
    password: "super123",
    fullName: "John Supervisor",
    role: "supervisor"
  });
  await storage.createUser({
    username: "supervisor2",
    password: "super123",
    fullName: "Sarah Manager",
    role: "supervisor"
  });
  await storage.createUser({
    username: "labor1",
    password: "labor123",
    fullName: "Mike Worker",
    role: "labor",
    skills: ["Carpentry", "Framing", "Drywall"]
  });
  await storage.createUser({
    username: "labor2",
    password: "labor123",
    fullName: "Jane Builder",
    role: "labor",
    skills: ["Plumbing", "Pipefitting", "Welding"]
  });
  await storage.createUser({
    username: "labor3",
    password: "labor123",
    fullName: "Tom Mason",
    role: "labor",
    skills: ["Masonry", "Concrete", "Tiling"]
  });
  console.log("Demo accounts seeded successfully!");
}

// server/routes.ts
var PgSession = connectPgSimple(session);
var config3 = getConfig();
function deduplicateRequests(requests) {
  const seen = /* @__PURE__ */ new Set();
  return requests.filter((request) => {
    const key = `${request.projectId}|${request.laborId}|${request.supervisorId}`;
    if (seen.has(key)) {
      console.log(`[Dedup] Removing duplicate request: ${key}`);
      return false;
    }
    seen.add(key);
    return true;
  });
}
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
async function registerRoutes(app2) {
  const pool2 = new pg2.Pool({
    connectionString: config3.databaseUrl
  });
  app2.use(
    session({
      store: new PgSession({
        pool: pool2,
        createTableIfMissing: true
      }),
      secret: config3.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1e3,
        sameSite: "lax"
      }
    })
  );
  await seedDatabase();
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt2.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });
  app2.get("/api/auth/me", async (req, res) => {
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
      role: user.role
    });
  });
  app2.get("/api/users/labor", requireAuth, async (req, res) => {
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
        skills: l.skills || []
      }))
    );
  });
  app2.get("/api/users/supervisors", requireAuth, async (_req, res) => {
    const supervisors = await storage.getUsersByRole("supervisor");
    res.json(
      supervisors.map((s) => ({
        id: s.id,
        username: s.username,
        fullName: s.fullName,
        role: s.role
      }))
    );
  });
  app2.post("/api/projects", requireRole("supervisor"), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Project name required" });
      }
      const project = await storage.createProject({
        name,
        description: description || null,
        supervisorId: req.session.userId
      });
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/projects", requireAuth, async (req, res) => {
    try {
      let projectsList;
      if (req.session.role === "supervisor") {
        projectsList = await storage.getProjectsBySupervisor(req.session.userId);
      } else {
        projectsList = await storage.getAllProjects();
      }
      res.json(projectsList);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/projects/:id", requireAuth, async (req, res) => {
    const project = await storage.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });
  app2.post("/api/labor-requests", requireRole("supervisor"), async (req, res) => {
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
        supervisorId: req.session.userId,
        startDate: start,
        endDate: end
      });
      res.json(request);
    } catch (error) {
      console.error("Create labor request error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/labor-requests", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      let requests;
      if (req.session.role === "admin") {
        if (status) {
          requests = await storage.getLaborRequestsByStatus(status);
        } else {
          const pending = await storage.getLaborRequestsByStatus("pending");
          const approved = await storage.getLaborRequestsByStatus("approved");
          const rejected = await storage.getLaborRequestsByStatus("rejected");
          requests = [...pending, ...approved, ...rejected];
        }
      } else if (req.session.role === "supervisor") {
        let supervisorRequests = await storage.getLaborRequestsBySupervisor(req.session.userId);
        supervisorRequests = deduplicateRequests(supervisorRequests);
        requests = supervisorRequests;
      } else {
        requests = await storage.getLaborRequestsByLabor(req.session.userId);
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
            supervisorName: supervisor?.fullName || "Unknown"
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Get labor requests error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.patch("/api/labor-requests/:id", requireRole("admin"), async (req, res) => {
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
  app2.get("/api/labor-availability/:laborId", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates required" });
      }
      const available = await storage.checkLaborAvailability(
        req.params.laborId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json({ available });
    } catch (error) {
      console.error("Check availability error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.get("/api/labor-scheduled/:laborId", requireAuth, async (req, res) => {
    try {
      const scheduledRanges = await storage.getLaborScheduledRanges(req.params.laborId);
      res.json({ scheduledRanges });
    } catch (error) {
      console.error("Get scheduled ranges error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.post("/api/users/create", requireRole("admin"), async (req, res) => {
    try {
      const { username, password, fullName, role, skills } = req.body;
      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ message: "Username, password, fullName, and role are required" });
      }
      if (!["supervisor", "labor"].includes(role)) {
        return res.status(400).json({ message: "Role must be 'supervisor' or 'labor'" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        username,
        password,
        fullName,
        role,
        skills: role === "labor" ? skills || [] : void 0
      });
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        skills: user.skills
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
var config4 = getConfig();
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    config4.allowedOrigins.forEach((origin2) => origins.add(origin2));
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").map((d) => d.trim()).filter(Boolean).forEach((d) => origins.add(d));
    }
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").map((d) => d.trim()).filter(Boolean).forEach((d) => origins.add(`https://${d}`));
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isExpoHosted = origin?.endsWith(".expo.app") ?? false;
    if (origin && (origins.has(origin) || isLocalhost || isExpoHosted)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Cookie, Authorization, X-Requested-With"
      );
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    try {
      if (req.path.startsWith("/api")) {
        return next();
      }
      if (req.path !== "/" && req.path !== "/manifest") {
        return next();
      }
      const platform = req.header("expo-platform");
      if (platform && (platform === "ios" || platform === "android")) {
        return serveExpoManifest(platform, res);
      }
      if (req.path === "/") {
        return serveLandingPage({
          req,
          res,
          landingPageTemplate,
          appName
        });
      }
      next();
    } catch (error) {
      console.error("Error in Expo/Landing middleware:", error);
      next(error);
    }
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  try {
    setupCors(app);
    setupBodyParsing(app);
    setupRequestLogging(app);
    configureExpoAndLanding(app);
    console.log("Registering routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");
    setupErrorHandler(app);
    const port = config4.port;
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
    server.listen(port, "0.0.0.0", () => {
      log(`express server serving on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
    });
  } catch (err) {
    console.error("Fatal error starting server:", err);
    process.exit(1);
  }
})().catch((err) => {
  console.error("Top-level async error:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
