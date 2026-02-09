import {
  type User,
  type InsertUser,
  type Project,
  type LaborRequest,
  users,
  projects,
  laborRequests,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, or, lte, gte, ne, ilike, sql } from "drizzle-orm";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;

  createProject(project: { name: string; description?: string; supervisorId: string }): Promise<Project>;
  getProjectsBySupervisor(supervisorId: string): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;

  createLaborRequest(req: {
    projectId: string;
    laborId: string;
    supervisorId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<LaborRequest>;
  getLaborRequestsByStatus(status: string): Promise<LaborRequest[]>;
  getLaborRequestsBySupervisor(supervisorId: string): Promise<LaborRequest[]>;
  getLaborRequestsByLabor(laborId: string): Promise<LaborRequest[]>;
  updateLaborRequestStatus(id: string, status: string): Promise<LaborRequest | undefined>;
  checkLaborAvailability(laborId: string, startDate: Date, endDate: Date, excludeRequestId?: string): Promise<boolean>;
  searchLaborByUsername(query: string): Promise<User[]>;
  searchLaborBySkill(skill: string): Promise<User[]>;
  getNextAvailableDate(laborId: string, fromDate: Date): Promise<Date | null>;
  getLaborScheduledRanges(laborId: string): Promise<{ startDate: Date; endDate: Date }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async createProject(project: { name: string; description?: string; supervisorId: string }): Promise<Project> {
    const [p] = await db.insert(projects).values(project).returning();
    return p;
  }

  async getProjectsBySupervisor(supervisorId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.supervisorId, supervisorId));
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [p] = await db.select().from(projects).where(eq(projects.id, id));
    return p;
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async createLaborRequest(req: {
    projectId: string;
    laborId: string;
    supervisorId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<LaborRequest> {
    const [lr] = await db.insert(laborRequests).values(req).returning();
    return lr;
  }

  async getLaborRequestsByStatus(status: string): Promise<LaborRequest[]> {
    return db.select().from(laborRequests).where(eq(laborRequests.status, status as any));
  }

  async getLaborRequestsBySupervisor(supervisorId: string): Promise<LaborRequest[]> {
    return db.select().from(laborRequests).where(eq(laborRequests.supervisorId, supervisorId));
  }

  async getLaborRequestsByLabor(laborId: string): Promise<LaborRequest[]> {
    return db.select().from(laborRequests).where(eq(laborRequests.laborId, laborId));
  }

  async updateLaborRequestStatus(id: string, status: string): Promise<LaborRequest | undefined> {
    const [lr] = await db
      .update(laborRequests)
      .set({ status: status as any })
      .where(eq(laborRequests.id, id))
      .returning();
    return lr;
  }

  async checkLaborAvailability(
    laborId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(laborRequests.laborId, laborId),
      eq(laborRequests.status, "approved"),
      lte(laborRequests.startDate, endDate),
      gte(laborRequests.endDate, startDate),
    ];

    if (excludeRequestId) {
      conditions.push(ne(laborRequests.id, excludeRequestId));
    }

    const conflicts = await db
      .select()
      .from(laborRequests)
      .where(and(...conditions));

    return conflicts.length === 0;
  }

  async searchLaborByUsername(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "labor"),
          or(
            ilike(users.username, `%${query}%`),
            ilike(users.fullName, `%${query}%`)
          )
        )
      );
  }

  async searchLaborBySkill(skill: string): Promise<User[]> {
    const lowerSkill = skill.toLowerCase();
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "labor"),
          sql`EXISTS (SELECT 1 FROM unnest(${users.skills}) AS s WHERE lower(s) LIKE ${`%${lowerSkill}%`})`
        )
      );
  }

  async getLaborScheduledRanges(laborId: string): Promise<{ startDate: Date; endDate: Date }[]> {
    const approvedRequests = await db
      .select()
      .from(laborRequests)
      .where(and(eq(laborRequests.laborId, laborId), eq(laborRequests.status, "approved")));

    return approvedRequests.map((req) => ({
      startDate: req.startDate,
      endDate: req.endDate,
    }));
  }

  async getNextAvailableDate(laborId: string, fromDate: Date): Promise<Date | null> {
    const scheduledRanges = await this.getLaborScheduledRanges(laborId);

    if (scheduledRanges.length === 0) {
      return fromDate;
    }

    // Sort by start date
    scheduledRanges.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Check if from date is before the first scheduled range
    if (fromDate < scheduledRanges[0].startDate) {
      return fromDate;
    }

    // Find the first gap after fromDate
    for (let i = 0; i < scheduledRanges.length; i++) {
      const endDate = scheduledRanges[i].endDate;
      const nextStartDate = scheduledRanges[i + 1]?.startDate;

      if (fromDate <= endDate) {
        // fromDate is within or overlaps a scheduled range
        if (!nextStartDate) {
          // No more scheduled ranges after this one
          return new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // Next day
        }
        return nextStartDate;
      }

      // Check gap between this range and next
      if (!nextStartDate) {
        return endDate;
      }
    }

    return null;
  }
}

export const storage = new DatabaseStorage();

export async function seedDatabase() {
  const existingAdmin = await storage.getUserByUsername("admin");
  if (existingAdmin) return;

  console.log("Seeding database with demo accounts...");

  await storage.createUser({
    username: "admin",
    password: "admin123",
    fullName: "System Admin",
    role: "admin",
  });

  await storage.createUser({
    username: "supervisor1",
    password: "super123",
    fullName: "John Supervisor",
    role: "supervisor",
  });

  await storage.createUser({
    username: "supervisor2",
    password: "super123",
    fullName: "Sarah Manager",
    role: "supervisor",
  });

  await storage.createUser({
    username: "labor1",
    password: "labor123",
    fullName: "Mike Worker",
    role: "labor",
    skills: ["Carpentry", "Framing", "Drywall"],
  });

  await storage.createUser({
    username: "labor2",
    password: "labor123",
    fullName: "Jane Builder",
    role: "labor",
    skills: ["Plumbing", "Pipefitting", "Welding"],
  });

  await storage.createUser({
    username: "labor3",
    password: "labor123",
    fullName: "Tom Mason",
    role: "labor",
    skills: ["Masonry", "Concrete", "Tiling"],
  });

  console.log("Demo accounts seeded successfully!");
}
