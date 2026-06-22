import {
  type User, type InsertUser,
  type Course, type InsertCourse,
  type UserProgress, type InsertUserProgress,
  type AiIdea, type InsertAiIdea,
  type InventionProject, type InsertInventionProject,
  type BusinessCanvas, type InsertBusinessCanvas,
  type DiagnosticResult, type InsertDiagnosticResult,
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type Badge, type InsertBadge,
  type UserBadge, type InsertUserBadge,
  type GuestAiUsage,
  type FranchiseInquiry, type InsertFranchiseInquiry,
  type GalleryPost, type InsertGalleryPost, type GalleryLike,
  type AiUsageLog, type InsertAiUsageLog,
  type Plan, type InsertPlan, type Subscription, type Order, type Payment, type Share,
  users, courses, userProgress, aiIdeas,
  inventionProjects, businessCanvases, diagnosticResults,
  organizations, userOrganizations, badges, userBadges, guestAiUsage,
  franchiseInquiries, galleryPosts, galleryLikes, aiUsageLogs,
  plans, subscriptions, orders, payments, shares,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, gte, ilike, or, type SQL } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: number, role: 'superadmin' | 'admin' | 'group_admin' | 'member'): Promise<User | undefined>;
  updateUserLevel(id: number, level: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getCourses(): Promise<Course[]>;
  getCoursesByTrack(track: string): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getUserProgress(userId: number): Promise<UserProgress[]>;
  getUserCourseProgress(userId: number, courseId: number): Promise<UserProgress | undefined>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getAiIdeas(userId: number): Promise<AiIdea[]>;
  createAiIdea(idea: InsertAiIdea): Promise<AiIdea>;
  getInventionProjects(userId: number): Promise<InventionProject[]>;
  getInventionProject(id: number, userId?: number): Promise<InventionProject | undefined>;
  createInventionProject(project: InsertInventionProject): Promise<InventionProject>;
  updateInventionProject(id: number, userId: number, data: Partial<InsertInventionProject>): Promise<InventionProject>;
  getBusinessCanvases(userId: number): Promise<BusinessCanvas[]>;
  getBusinessCanvas(id: number, userId?: number): Promise<BusinessCanvas | undefined>;
  createBusinessCanvas(canvas: InsertBusinessCanvas): Promise<BusinessCanvas>;
  updateBusinessCanvas(id: number, userId: number, data: Partial<InsertBusinessCanvas>): Promise<BusinessCanvas>;
  getDiagnosticResults(userId: number): Promise<DiagnosticResult[]>;
  createDiagnosticResult(result: InsertDiagnosticResult): Promise<DiagnosticResult>;

  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByInviteCode(code: string): Promise<Organization | undefined>;
  getOrganizationsByCreator(userId: number): Promise<Organization[]>;
  getAllOrganizations(): Promise<Organization[]>;
  joinOrganization(userId: number, organizationId: number): Promise<UserOrganization>;
  getOrganizationMembers(organizationId: number): Promise<UserOrganization[]>;
  getUserOrganizations(userId: number): Promise<UserOrganization[]>;
  isUserInOrganization(userId: number, organizationId: number): Promise<boolean>;

  getBadges(): Promise<Badge[]>;
  getBadgeByKey(key: string): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: number, badgeId: number): Promise<UserBadge>;
  hasUserBadge(userId: number, badgeId: number): Promise<boolean>;

  getGuestAiUsage(sessionId: string): Promise<GuestAiUsage | undefined>;
  getMaxGuestAiUsageByIpUa(ipHash: string, uaHash: string): Promise<number>;
  incrementGuestAiUsage(sessionId: string, ipHash?: string | null, uaHash?: string | null, atLeast?: number): Promise<GuestAiUsage>;

  createFranchiseInquiry(inquiry: InsertFranchiseInquiry): Promise<FranchiseInquiry>;
  getFranchiseInquiries(): Promise<FranchiseInquiry[]>;
  updateFranchiseStatus(id: number, status: string): Promise<FranchiseInquiry | undefined>;

  getGalleryPosts(type?: string, q?: string, tags?: string[]): Promise<(GalleryPost & { user: { displayName: string | null; username: string } })[]>;
  getGalleryPost(id: number): Promise<GalleryPost | undefined>;
  createGalleryPost(post: InsertGalleryPost): Promise<GalleryPost>;
  deleteGalleryPost(id: number, userId: number): Promise<boolean>;
  likeGalleryPost(userId: number, postId: number): Promise<void>;
  unlikeGalleryPost(userId: number, postId: number): Promise<void>;
  hasUserLikedPost(userId: number, postId: number): Promise<boolean>;
  getUserGalleryLikes(userId: number): Promise<number[]>;

  getPublicStats(): Promise<{ totalUsers: number; totalProjects: number; totalAnalyses: number }>;
  getOrganizationDetailedStats(orgId: number): Promise<any>;

  getDashboardStats(userId: number): Promise<{ inventionCount: number; canvasCount: number; diagnosticCount: number }>;
  getAdminStats(): Promise<{ totalUsers: number; newThisMonth: number; orgCount: number }>;
  updateUserBlocked(id: number, blocked: boolean): Promise<User | undefined>;
  getUserProgressSummary(userId: number): Promise<{ completedCourses: number; inProgress: number }>;

  createAiUsageLog(log: InsertAiUsageLog): Promise<AiUsageLog>;
  getAiUsageStats(days: number): Promise<{ daily: { date: string; count: number }[]; byEndpoint: { endpoint: string; count: number }[]; total: number }>;
  getAnalyticsOverview(days: number, tool?: string): Promise<{
    days: number;
    tool: string | null;
    signupsDaily: { date: string; count: number }[];
    aiDaily: { date: string; guest: number; member: number }[];
    byTool: { tool: string; count: number }[];
    conversion: { guestSessions: number; signups: number; rate: number };
    totals: { signups: number; guestCalls: number; memberCalls: number };
  }>;
  getMemberWorks(memberId: number): Promise<{
    inventions: { id: number; title: string; createdAt: Date }[];
    canvases: { id: number; title: string; createdAt: Date }[];
    diagnostics: { id: number; type: string; createdAt: Date }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserRole(id: number, role: 'superadmin' | 'admin' | 'group_admin' | 'member'): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user || undefined;
  }
  async updateUserLevel(id: number, level: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ level }).where(eq(users.id, id)).returning();
    return user || undefined;
  }
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async getUserCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(users);
    return result.value;
  }
  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(courses.order);
  }
  async getCoursesByTrack(track: string): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.track, track)).orderBy(courses.order);
  }
  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }
  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  async getUserCourseProgress(userId: number, courseId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
    return progress || undefined;
  }
  async upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const existing = await this.getUserCourseProgress(progress.userId, progress.courseId);
    if (existing) {
      const [updated] = await db.update(userProgress)
        .set({ completedSteps: progress.completedSteps, isCompleted: progress.isCompleted })
        .where(eq(userProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(userProgress).values(progress).returning();
    return created;
  }
  async getAiIdeas(userId: number): Promise<AiIdea[]> {
    return db.select().from(aiIdeas).where(eq(aiIdeas.userId, userId)).orderBy(desc(aiIdeas.createdAt));
  }
  async createAiIdea(idea: InsertAiIdea): Promise<AiIdea> {
    const [created] = await db.insert(aiIdeas).values(idea).returning();
    return created;
  }
  async getInventionProjects(userId: number): Promise<InventionProject[]> {
    return db.select().from(inventionProjects).where(eq(inventionProjects.userId, userId)).orderBy(desc(inventionProjects.createdAt));
  }
  async getInventionProject(id: number, userId?: number): Promise<InventionProject | undefined> {
    const conditions = userId
      ? and(eq(inventionProjects.id, id), eq(inventionProjects.userId, userId))
      : eq(inventionProjects.id, id);
    const [project] = await db.select().from(inventionProjects).where(conditions);
    return project || undefined;
  }
  async createInventionProject(project: InsertInventionProject): Promise<InventionProject> {
    const [created] = await db.insert(inventionProjects).values(project).returning();
    return created;
  }
  async updateInventionProject(id: number, userId: number, data: Partial<InsertInventionProject>): Promise<InventionProject> {
    const [updated] = await db.update(inventionProjects).set(data).where(and(eq(inventionProjects.id, id), eq(inventionProjects.userId, userId))).returning();
    return updated;
  }
  async getBusinessCanvases(userId: number): Promise<BusinessCanvas[]> {
    return db.select().from(businessCanvases).where(eq(businessCanvases.userId, userId)).orderBy(desc(businessCanvases.createdAt));
  }
  async getBusinessCanvas(id: number, userId?: number): Promise<BusinessCanvas | undefined> {
    const conditions = userId
      ? and(eq(businessCanvases.id, id), eq(businessCanvases.userId, userId))
      : eq(businessCanvases.id, id);
    const [canvas] = await db.select().from(businessCanvases).where(conditions);
    return canvas || undefined;
  }
  async createBusinessCanvas(canvas: InsertBusinessCanvas): Promise<BusinessCanvas> {
    const [created] = await db.insert(businessCanvases).values(canvas).returning();
    return created;
  }
  async updateBusinessCanvas(id: number, userId: number, data: Partial<InsertBusinessCanvas>): Promise<BusinessCanvas> {
    const [updated] = await db.update(businessCanvases).set(data).where(and(eq(businessCanvases.id, id), eq(businessCanvases.userId, userId))).returning();
    return updated;
  }
  async getDiagnosticResults(userId: number): Promise<DiagnosticResult[]> {
    return db.select().from(diagnosticResults).where(eq(diagnosticResults.userId, userId)).orderBy(desc(diagnosticResults.createdAt));
  }
  async createDiagnosticResult(result: InsertDiagnosticResult): Promise<DiagnosticResult> {
    const [created] = await db.insert(diagnosticResults).values(result).returning();
    return created;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }
  async getOrganizationByInviteCode(code: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.inviteCode, code));
    return org || undefined;
  }
  async getOrganizationsByCreator(userId: number): Promise<Organization[]> {
    return db.select().from(organizations).where(eq(organizations.createdBy, userId));
  }
  async getAllOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }
  async joinOrganization(userId: number, organizationId: number): Promise<UserOrganization> {
    const existing = await this.isUserInOrganization(userId, organizationId);
    if (existing) {
      const [uo] = await db.select().from(userOrganizations)
        .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId)));
      return uo;
    }
    const [uo] = await db.insert(userOrganizations).values({ userId, organizationId }).returning();
    return uo;
  }
  async getOrganizationMembers(organizationId: number): Promise<UserOrganization[]> {
    return db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, organizationId));
  }
  async getUserOrganizations(userId: number): Promise<UserOrganization[]> {
    return db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }
  async isUserInOrganization(userId: number, organizationId: number): Promise<boolean> {
    const [uo] = await db.select().from(userOrganizations)
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId)));
    return !!uo;
  }

  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }
  async getBadgeByKey(key: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.key, key));
    return badge || undefined;
  }
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }
  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        awardedAt: userBadges.awardedAt,
        badge: badges,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt));
    return results.map(r => ({
      id: r.id,
      userId: r.userId,
      badgeId: r.badgeId,
      awardedAt: r.awardedAt,
      badge: r.badge,
    }));
  }
  async awardBadge(userId: number, badgeId: number): Promise<UserBadge> {
    const alreadyHas = await this.hasUserBadge(userId, badgeId);
    if (alreadyHas) {
      const [existing] = await db.select().from(userBadges)
        .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
      return existing;
    }
    const [created] = await db.insert(userBadges).values({ userId, badgeId }).returning();
    return created;
  }
  async hasUserBadge(userId: number, badgeId: number): Promise<boolean> {
    const [ub] = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    return !!ub;
  }

  async getGuestAiUsage(sessionId: string): Promise<GuestAiUsage | undefined> {
    const [usage] = await db.select().from(guestAiUsage).where(eq(guestAiUsage.sessionId, sessionId));
    return usage || undefined;
  }
  async getMaxGuestAiUsageByIpUa(ipHash: string, uaHash: string): Promise<number> {
    if (!ipHash || !uaHash) return 0;
    const [row] = await db
      .select({ value: sql<number>`COALESCE(MAX(${guestAiUsage.usageCount}), 0)::int` })
      .from(guestAiUsage)
      .where(and(eq(guestAiUsage.ipHash, ipHash), eq(guestAiUsage.uaHash, uaHash)));
    return Number(row?.value || 0);
  }
  async incrementGuestAiUsage(
    sessionId: string,
    ipHash?: string | null,
    uaHash?: string | null,
    atLeast: number = 0,
  ): Promise<GuestAiUsage> {
    const startValue = Math.max(1, atLeast + 1);
    const [result] = await db
      .insert(guestAiUsage)
      .values({ sessionId, usageCount: startValue, ipHash: ipHash ?? null, uaHash: uaHash ?? null })
      .onConflictDoUpdate({
        target: guestAiUsage.sessionId,
        set: {
          usageCount: sql`GREATEST(${guestAiUsage.usageCount} + 1, ${startValue})`,
          ipHash: sql`COALESCE(EXCLUDED.ip_hash, ${guestAiUsage.ipHash})`,
          uaHash: sql`COALESCE(EXCLUDED.ua_hash, ${guestAiUsage.uaHash})`,
          lastUsedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    return result;
  }

  async createFranchiseInquiry(inquiry: InsertFranchiseInquiry): Promise<FranchiseInquiry> {
    const [created] = await db.insert(franchiseInquiries).values(inquiry).returning();
    return created;
  }
  async getFranchiseInquiries(): Promise<FranchiseInquiry[]> {
    return db.select().from(franchiseInquiries).orderBy(desc(franchiseInquiries.createdAt));
  }
  async updateFranchiseStatus(id: number, status: string): Promise<FranchiseInquiry | undefined> {
    const [updated] = await db.update(franchiseInquiries).set({ status }).where(eq(franchiseInquiries.id, id)).returning();
    return updated || undefined;
  }

  async getDashboardStats(userId: number): Promise<{ inventionCount: number; canvasCount: number; diagnosticCount: number }> {
    const [inv] = await db.select({ value: count() }).from(inventionProjects).where(eq(inventionProjects.userId, userId));
    const [bmc] = await db.select({ value: count() }).from(businessCanvases).where(eq(businessCanvases.userId, userId));
    const [diag] = await db.select({ value: count() }).from(diagnosticResults).where(eq(diagnosticResults.userId, userId));
    return {
      inventionCount: inv.value,
      canvasCount: bmc.value,
      diagnosticCount: diag.value,
    };
  }

  async getAdminStats(): Promise<{ totalUsers: number; newThisMonth: number; orgCount: number }> {
    const [total] = await db.select({ value: count() }).from(users);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [newUsers] = await db.select({ value: count() }).from(users)
      .where(sql`${users.createdAt} >= ${startOfMonth.toISOString()}`);
    const [orgs] = await db.select({ value: count() }).from(organizations);
    return {
      totalUsers: total.value,
      newThisMonth: newUsers.value,
      orgCount: orgs.value,
    };
  }

  async updateUserBlocked(id: number, blocked: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ blocked }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUserProgressSummary(userId: number): Promise<{ completedCourses: number; inProgress: number }> {
    const progress = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    const completedCourses = progress.filter(p => p.isCompleted).length;
    const inProgress = progress.filter(p => !p.isCompleted && (p.completedSteps || 0) > 0).length;
    return { completedCourses, inProgress };
  }

  async getGalleryPosts(type?: string, q?: string, tags?: string[]): Promise<(GalleryPost & { user: { displayName: string | null; username: string } })[]> {
    const whereParts: SQL[] = [];
    if (type) whereParts.push(eq(galleryPosts.type, type));
    if (q && q.trim()) {
      const like = `%${q.trim()}%`;
      const searchExpr = or(
        ilike(galleryPosts.title, like),
        ilike(galleryPosts.description, like),
        ilike(users.displayName, like),
        ilike(users.username, like),
      );
      if (searchExpr) whereParts.push(searchExpr);
    }
    if (tags && tags.length > 0) {
      whereParts.push(sql`${galleryPosts.tags} && ARRAY[${sql.join(tags.map(t => sql`${t}`), sql`, `)}]::text[]`);
    }
    const conditions = whereParts.length === 0
      ? undefined
      : whereParts.length === 1 ? whereParts[0] : and(...whereParts);
    const results = await db
      .select({
        id: galleryPosts.id,
        userId: galleryPosts.userId,
        type: galleryPosts.type,
        projectId: galleryPosts.projectId,
        title: galleryPosts.title,
        description: galleryPosts.description,
        tags: galleryPosts.tags,
        likesCount: galleryPosts.likesCount,
        createdAt: galleryPosts.createdAt,
        userDisplayName: users.displayName,
        userUsername: users.username,
      })
      .from(galleryPosts)
      .innerJoin(users, eq(galleryPosts.userId, users.id))
      .where(conditions)
      .orderBy(desc(galleryPosts.createdAt));
    return results.map(r => ({
      id: r.id, userId: r.userId, type: r.type, projectId: r.projectId,
      title: r.title, description: r.description, tags: r.tags,
      likesCount: r.likesCount, createdAt: r.createdAt,
      user: { displayName: r.userDisplayName, username: r.userUsername },
    }));
  }

  async getGalleryPost(id: number): Promise<GalleryPost | undefined> {
    const [post] = await db.select().from(galleryPosts).where(eq(galleryPosts.id, id));
    return post || undefined;
  }

  async createGalleryPost(post: InsertGalleryPost): Promise<GalleryPost> {
    const [created] = await db.insert(galleryPosts).values(post).returning();
    return created;
  }

  async deleteGalleryPost(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(galleryPosts).where(and(eq(galleryPosts.id, id), eq(galleryPosts.userId, userId))).returning();
    return result.length > 0;
  }

  async likeGalleryPost(userId: number, postId: number): Promise<void> {
    await db.insert(galleryLikes).values({ userId, postId }).onConflictDoNothing();
    await db.update(galleryPosts).set({ likesCount: sql`(SELECT COUNT(*) FROM gallery_likes WHERE post_id = ${postId})` }).where(eq(galleryPosts.id, postId));
  }

  async unlikeGalleryPost(userId: number, postId: number): Promise<void> {
    await db.delete(galleryLikes).where(and(eq(galleryLikes.userId, userId), eq(galleryLikes.postId, postId)));
    await db.update(galleryPosts).set({ likesCount: sql`(SELECT COUNT(*) FROM gallery_likes WHERE post_id = ${postId})` }).where(eq(galleryPosts.id, postId));
  }

  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const [like] = await db.select().from(galleryLikes).where(and(eq(galleryLikes.userId, userId), eq(galleryLikes.postId, postId)));
    return !!like;
  }

  async getUserGalleryLikes(userId: number): Promise<number[]> {
    const likes = await db.select({ postId: galleryLikes.postId }).from(galleryLikes).where(eq(galleryLikes.userId, userId));
    return likes.map(l => l.postId);
  }

  async getPublicStats(): Promise<{ totalUsers: number; totalProjects: number; totalAnalyses: number }> {
    const [u] = await db.select({ value: count() }).from(users);
    const [inv] = await db.select({ value: count() }).from(inventionProjects);
    const [bmc] = await db.select({ value: count() }).from(businessCanvases);
    const [ideas] = await db.select({ value: count() }).from(aiIdeas);
    const [diag] = await db.select({ value: count() }).from(diagnosticResults);
    return {
      totalUsers: u.value,
      totalProjects: inv.value + bmc.value,
      totalAnalyses: ideas.value + diag.value,
    };
  }

  async createAiUsageLog(log: InsertAiUsageLog): Promise<AiUsageLog> {
    const [created] = await db.insert(aiUsageLogs).values(log).returning();
    return created;
  }

  async getAiUsageStats(days: number): Promise<{ daily: { date: string; count: number }[]; byEndpoint: { endpoint: string; count: number }[]; total: number }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const dailyRows = await db.execute(sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
      FROM ai_usage_logs WHERE created_at >= ${since.toISOString()}
      GROUP BY 1 ORDER BY 1 ASC
    `);
    const endpointRows = await db.execute(sql`
      SELECT endpoint, COUNT(*)::int AS count
      FROM ai_usage_logs WHERE created_at >= ${since.toISOString()}
      GROUP BY endpoint ORDER BY count DESC
    `);
    const [tot] = await db.select({ value: count() }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, since));
    return {
      daily: (dailyRows.rows as any[]).map(r => ({ date: String(r.date), count: Number(r.count) })),
      byEndpoint: (endpointRows.rows as any[]).map(r => ({ endpoint: String(r.endpoint), count: Number(r.count) })),
      total: tot.value,
    };
  }

  async getAnalyticsOverview(days: number, tool?: string): Promise<{
    days: number;
    tool: string | null;
    signupsDaily: { date: string; count: number }[];
    aiDaily: { date: string; guest: number; member: number }[];
    byTool: { tool: string; count: number }[];
    conversion: { guestSessions: number; signups: number; rate: number };
    totals: { signups: number; guestCalls: number; memberCalls: number };
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const toolEndpointMap: Record<string, string[]> = {
      scamper: ["/api/ai/scamper"],
      triz: ["/api/ai/triz"],
      patent: ["/api/ai/patent-draft"],
      bmc: ["/api/ai/bmc-assist"],
      pitch: ["/api/ai/pitch-deck"],
      diagnosis: ["/api/ai/diagnostic-analysis"],
    };
    const endpointFilter = tool && toolEndpointMap[tool] ? toolEndpointMap[tool] : null;

    const signupsRows = await db.execute(sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
      FROM users WHERE created_at >= ${sinceIso}
      GROUP BY 1 ORDER BY 1 ASC
    `);

    const aiDailyRows = endpointFilter
      ? await db.execute(sql`
          SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
            COUNT(*) FILTER (WHERE user_id IS NULL)::int AS guest,
            COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS member
          FROM ai_usage_logs
          WHERE created_at >= ${sinceIso} AND endpoint = ANY(${endpointFilter})
          GROUP BY 1 ORDER BY 1 ASC
        `)
      : await db.execute(sql`
          SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
            COUNT(*) FILTER (WHERE user_id IS NULL)::int AS guest,
            COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS member
          FROM ai_usage_logs WHERE created_at >= ${sinceIso}
          GROUP BY 1 ORDER BY 1 ASC
        `);

    // byTool은 도구별 분포를 보여주는 차트라, 도구 필터가 걸려 있어도 전체 엔드포인트를
    // 보여줘야 의미가 있다. 다만 도구 필터가 있을 때는 해당 도구만 하이라이트되어 보이도록
    // 동일 row 셋을 반환하되, UI에서 선택 도구를 표시한다. 여기서는 전체 집계를 반환.
    const byToolRows = await db.execute(sql`
      SELECT endpoint, COUNT(*)::int AS count
      FROM ai_usage_logs WHERE created_at >= ${sinceIso}
      GROUP BY endpoint ORDER BY count DESC
    `);

    // 게스트 식별자 집합: ip_ua_hash 기준(우선) + 보조로 guest_ai_usage 세션 카운트.
    // 게스트→회원 전환은 "기간 내 ai_usage_logs(user_id IS NULL) ip_ua_hash 중,
    // 해당 hash가 들어있는 사용자가 가입한 시각이 그 게스트 호출 시각 이후 N시간 이내인 비율"
    const N_HOURS = 72;
    const guestHashRows = await db.execute(sql`
      SELECT ip_ua_hash, MIN(created_at) AS first_seen
      FROM ai_usage_logs
      WHERE created_at >= ${sinceIso} AND user_id IS NULL AND ip_ua_hash IS NOT NULL
      GROUP BY ip_ua_hash
    `);
    const guestHashList = (guestHashRows.rows as any[]).map(r => ({
      hash: String(r.ip_ua_hash),
      firstSeen: new Date(r.first_seen as string),
    }));
    const guestHashes = guestHashList.length;

    // 추가 보조 지표: guest_ai_usage 테이블의 distinct session도 함께 카운트(가시성용)
    const guestUsageRows = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM guest_ai_usage WHERE last_used_at >= ${sinceIso}
    `);
    const guestUsageSessions = Number((guestUsageRows.rows as any[])[0]?.count || 0);

    let convertedCount = 0;
    if (guestHashList.length > 0) {
      const hashes = guestHashList.map(g => g.hash);
      const matched = await db.execute(sql`
        SELECT signup_ip_ua_hash AS hash, created_at AS signed_up_at
        FROM users
        WHERE signup_ip_ua_hash = ANY(${hashes}) AND created_at >= ${sinceIso}
      `);
      const userByHash = new Map<string, Date[]>();
      for (const row of matched.rows as any[]) {
        const h = String(row.hash);
        const list = userByHash.get(h) || [];
        list.push(new Date(row.signed_up_at as string));
        userByHash.set(h, list);
      }
      for (const g of guestHashList) {
        const signups = userByHash.get(g.hash) || [];
        const ok = signups.some(s => {
          const diffMs = s.getTime() - g.firstSeen.getTime();
          return diffMs >= 0 && diffMs <= N_HOURS * 3600 * 1000;
        });
        if (ok) convertedCount += 1;
      }
    }
    // 분모는 hash 기반 게스트 수 우선, 없으면 guest_ai_usage로 폴백
    const guestSessions = guestHashes > 0 ? guestHashes : guestUsageSessions;

    const signupsDaily = (signupsRows.rows as any[]).map(r => ({ date: String(r.date), count: Number(r.count) }));
    const totalSignups = signupsDaily.reduce((a, b) => a + b.count, 0);

    const aiDaily = (aiDailyRows.rows as any[]).map(r => ({
      date: String(r.date),
      guest: Number(r.guest),
      member: Number(r.member),
    }));
    const totalGuest = aiDaily.reduce((a, b) => a + b.guest, 0);
    const totalMember = aiDaily.reduce((a, b) => a + b.member, 0);

    const labelMap: Record<string, string> = {
      "/api/ai/scamper": "SCAMPER",
      "/api/ai/triz": "TRIZ",
      "/api/ai/patent-draft": "특허초안",
      "/api/ai/bmc-assist": "BMC",
      "/api/ai/pitch-deck": "피칭덱",
      "/api/ai/diagnostic-analysis": "진단",
      "/api/ai/followup": "후속질문",
      "/api/ai/quick-trial": "퀵트라이얼",
    };
    const byTool = (byToolRows.rows as any[]).map(r => ({
      tool: labelMap[String(r.endpoint)] || String(r.endpoint).replace("/api/ai/", ""),
      count: Number(r.count),
    }));

    const rate = guestSessions > 0 ? Math.min(1, convertedCount / guestSessions) : 0;

    return {
      days,
      tool: tool || null,
      signupsDaily,
      aiDaily,
      byTool,
      conversion: { guestSessions, signups: convertedCount, rate },
      totals: { signups: totalSignups, guestCalls: totalGuest, memberCalls: totalMember },
    };
  }

  async getMemberWorks(memberId: number): Promise<{
    inventions: { id: number; title: string; createdAt: Date }[];
    canvases: { id: number; title: string; createdAt: Date }[];
    diagnostics: { id: number; type: string; createdAt: Date }[];
  }> {
    const inventions = await db
      .select({ id: inventionProjects.id, title: inventionProjects.title, createdAt: inventionProjects.createdAt })
      .from(inventionProjects)
      .where(eq(inventionProjects.userId, memberId))
      .orderBy(desc(inventionProjects.createdAt));
    const canvases = await db
      .select({ id: businessCanvases.id, title: businessCanvases.title, createdAt: businessCanvases.createdAt })
      .from(businessCanvases)
      .where(eq(businessCanvases.userId, memberId))
      .orderBy(desc(businessCanvases.createdAt));
    const diagnostics = await db
      .select({ id: diagnosticResults.id, type: diagnosticResults.type, createdAt: diagnosticResults.createdAt })
      .from(diagnosticResults)
      .where(eq(diagnosticResults.userId, memberId))
      .orderBy(desc(diagnosticResults.createdAt));
    return { inventions, canvases, diagnostics };
  }

  async getOrganizationDetailedStats(orgId: number): Promise<any> {
    const members = await db.select().from(userOrganizations).where(eq(userOrganizations.organizationId, orgId));
    const memberIds = members.map(m => m.userId);
    if (memberIds.length === 0) return { memberCount: 0, stats: [] };

    const stats = await Promise.all(memberIds.map(async (uid) => {
      const u = await this.getUser(uid);
      if (!u) return null;
      const { password: _, ...safeUser } = u;
      const progress = await this.getUserProgressSummary(uid);
      const [invCount] = await db.select({ value: count() }).from(inventionProjects).where(eq(inventionProjects.userId, uid));
      const [bmcCount] = await db.select({ value: count() }).from(businessCanvases).where(eq(businessCanvases.userId, uid));
      const [diagCount] = await db.select({ value: count() }).from(diagnosticResults).where(eq(diagnosticResults.userId, uid));
      const [ideaCount] = await db.select({ value: count() }).from(aiIdeas).where(eq(aiIdeas.userId, uid));
      const badgeCount = (await this.getUserBadges(uid)).length;
      return {
        user: safeUser,
        progress,
        inventionCount: invCount.value,
        bmcCount: bmcCount.value,
        diagnosticCount: diagCount.value,
        aiUsageCount: ideaCount.value,
        badgeCount,
      };
    }));
    return { memberCount: memberIds.length, stats: stats.filter(Boolean) };
  }

  // ===== Billing / 수익화 =====
  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).where(eq(plans.active, true)).orderBy(plans.sortOrder);
  }
  async getPlanByCode(code: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.code, code));
    return plan;
  }
  async upsertPlan(plan: InsertPlan): Promise<Plan> {
    const existing = await this.getPlanByCode(plan.code);
    if (existing) {
      const [updated] = await db.update(plans).set(plan).where(eq(plans.code, plan.code)).returning();
      return updated;
    }
    const [created] = await db.insert(plans).values(plan).returning();
    return created;
  }
  async createOrder(o: { orderId: string; userId?: number | null; planCode: string; orderName: string; amount: number; customerName?: string | null; }): Promise<Order> {
    const [created] = await db.insert(orders).values({
      orderId: o.orderId, userId: o.userId ?? null, planCode: o.planCode,
      orderName: o.orderName, amount: o.amount, customerName: o.customerName ?? null,
    }).returning();
    return created;
  }
  async getOrder(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    return order;
  }
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db.update(orders).set({ status }).where(eq(orders.orderId, orderId));
  }
  async createPayment(p: { orderId: string; paymentKey: string; method?: string | null; amount: number; status: string; approvedAt?: Date | null; raw?: Record<string, any> | null; }): Promise<Payment> {
    const [created] = await db.insert(payments).values({
      orderId: p.orderId, paymentKey: p.paymentKey, method: p.method ?? null,
      amount: p.amount, status: p.status, approvedAt: p.approvedAt ?? null, raw: p.raw ?? null,
    }).returning();
    return created;
  }
  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.startedAt));
    return sub;
  }
  async activateSubscription(userId: number, planCode: string, currentPeriodEnd: Date | null): Promise<Subscription> {
    await db.update(subscriptions).set({ status: "expired" })
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
    const [created] = await db.insert(subscriptions).values({
      userId, planCode, status: "active", currentPeriodEnd,
    }).returning();
    return created;
  }

  // ===== 결과물 공유 =====
  async createShare(s: { token: string; userId?: number | null; authorName?: string | null; type: string; refId?: number | null; title: string; summary?: string | null; payload?: Record<string, any> | null; }): Promise<Share> {
    const [created] = await db.insert(shares).values({
      token: s.token, userId: s.userId ?? null, authorName: s.authorName ?? null,
      type: s.type, refId: s.refId ?? null, title: s.title,
      summary: s.summary ?? null, payload: s.payload ?? null,
    }).returning();
    return created;
  }
  async getShareByToken(token: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(eq(shares.token, token));
    return share;
  }
  async incrementShareViews(token: string): Promise<void> {
    await db.update(shares).set({ viewCount: sql`${shares.viewCount} + 1` }).where(eq(shares.token, token));
  }
}

export const storage = new DatabaseStorage();
