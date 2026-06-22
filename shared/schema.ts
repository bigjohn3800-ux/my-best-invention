import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, timestamp, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/chat";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  level: text("level").default("beginner").notNull(),
  role: text("role").default("member").notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  schoolName: text("school_name"),
  gradeLevel: text("grade_level"),
  parentEmail: text("parent_email"),
  parentalConsent: boolean("parental_consent").default(false).notNull(),
  consentedAt: timestamp("consented_at"),
  signupIpUaHash: text("signup_ip_ua_hash"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  ipUaHash: text("ip_ua_hash"),
  endpoint: text("endpoint").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  condition: text("condition").notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  awardedAt: timestamp("awarded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("user_badges_user_badge_unique").on(table.userId, table.badgeId),
]);

export const guestAiUsage = pgTable("guest_ai_usage", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  usageCount: integer("usage_count").default(0).notNull(),
  ipHash: text("ip_hash"),
  uaHash: text("ua_hash"),
  lastUsedAt: timestamp("last_used_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("guest_ai_usage_ip_ua_idx").on(table.ipHash, table.uaHash),
]);

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  track: text("track").notNull(),
  level: text("level").notNull(),
  icon: text("icon"),
  color: text("color"),
  steps: jsonb("steps").$type<CourseStep[]>().default([]),
  order: integer("order").default(0),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  completedSteps: integer("completed_steps").default(0),
  totalSteps: integer("total_steps").default(0),
  isCompleted: boolean("is_completed").default(false),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const aiIdeas = pgTable("ai_ideas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  prompt: text("prompt").notNull(),
  result: text("result").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const inventionProjects = pgTable("invention_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  problem: text("problem"),
  solution: text("solution"),
  target: text("target"),
  method: text("method"),
  scamperNotes: jsonb("scamper_notes").$type<Record<string, string>>(),
  trizNotes: text("triz_notes"),
  patentDraft: text("patent_draft"),
  level: text("level").default("beginner"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const businessCanvases = pgTable("business_canvases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  keyPartners: text("key_partners"),
  keyActivities: text("key_activities"),
  valueProposition: text("value_proposition"),
  customerRelationships: text("customer_relationships"),
  customerSegments: text("customer_segments"),
  keyResources: text("key_resources"),
  channels: text("channels"),
  costStructure: text("cost_structure"),
  revenueStreams: text("revenue_streams"),
  aiFeedback: text("ai_feedback"),
  pitchDeck: text("pitch_deck"),
  level: text("level").default("beginner"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const diagnosticResults = pgTable("diagnostic_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  answers: jsonb("answers").$type<number[]>(),
  scores: jsonb("scores").$type<Record<string, number>>(),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const franchiseInquiries = pgTable("franchise_inquiries", {
  id: serial("id").primaryKey(),
  organizationName: text("organization_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  expectedMembers: integer("expected_members"),
  message: text("message"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const galleryPosts = pgTable("gallery_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  projectId: integer("project_id"),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  likesCount: integer("likes_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const galleryLikes = pgTable("gallery_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => galleryPosts.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("gallery_likes_user_post_unique").on(table.userId, table.postId),
]);

export const galleryPostsRelations = relations(galleryPosts, ({ one, many }) => ({
  user: one(users, { fields: [galleryPosts.userId], references: [users.id] }),
  likes: many(galleryLikes),
}));

export const galleryLikesRelations = relations(galleryLikes, ({ one }) => ({
  user: one(users, { fields: [galleryLikes.userId], references: [users.id] }),
  post: one(galleryPosts, { fields: [galleryLikes.postId], references: [galleryPosts.id] }),
}));

// ===== Billing / 수익화 (Toss Payments) =====
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),            // pro_monthly | pro_yearly | b2b_seat
  name: text("name").notNull(),
  audience: text("audience").default("b2c").notNull(), // b2c | b2b
  interval: text("interval").default("month").notNull(), // month | year | once
  amount: integer("amount").notNull(),              // 원(KRW)
  aiQuota: integer("ai_quota").default(-1).notNull(), // -1 = 공정사용 무제한
  features: jsonb("features").$type<string[]>().default([]),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planCode: text("plan_code").notNull(),
  status: text("status").default("active").notNull(), // active | canceled | expired
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  organizationId: integer("organization_id").references(() => organizations.id),
  seats: integer("seats").default(1).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("subscriptions_user_idx").on(table.userId),
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),     // 토스로 전달하는 주문번호
  userId: integer("user_id").references(() => users.id),
  planCode: text("plan_code").notNull(),
  orderName: text("order_name").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending").notNull(), // pending | paid | failed | canceled
  customerName: text("customer_name"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  paymentKey: text("payment_key").notNull().unique(),
  method: text("method"),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  approvedAt: timestamp("approved_at"),
  raw: jsonb("raw").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertPlanSchema = createInsertSchema(plans).omit({ id: true });
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;

// ===== 결과물 공유 (바이럴) =====
export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),         // 공개 URL 토큰
  userId: integer("user_id").references(() => users.id),
  authorName: text("author_name"),                 // 표시용 작성자명
  type: text("type").notNull(),                    // invention | canvas | diagnosis
  refId: integer("ref_id"),                         // 원본 결과물 id(참고용)
  title: text("title").notNull(),
  summary: text("summary"),
  payload: jsonb("payload").$type<Record<string, any>>(), // 렌더링 스냅샷(공개 안전 데이터만)
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
export type Share = typeof shares.$inferSelect;

export const insertFranchiseInquirySchema = createInsertSchema(franchiseInquiries).omit({ id: true, status: true, createdAt: true });
export type FranchiseInquiry = typeof franchiseInquiries.$inferSelect;
export type InsertFranchiseInquiry = z.infer<typeof insertFranchiseInquirySchema>;

export const insertGalleryPostSchema = createInsertSchema(galleryPosts).omit({ id: true, likesCount: true, createdAt: true });
export type GalleryPost = typeof galleryPosts.$inferSelect;
export type InsertGalleryPost = z.infer<typeof insertGalleryPostSchema>;
export type GalleryLike = typeof galleryLikes.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  ideas: many(aiIdeas),
  inventionProjects: many(inventionProjects),
  businessCanvases: many(businessCanvases),
  diagnosticResults: many(diagnosticResults),
  userBadges: many(userBadges),
  userOrganizations: many(userOrganizations),
  createdOrganizations: many(organizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  creator: one(users, { fields: [organizations.createdBy], references: [users.id] }),
  members: many(userOrganizations),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, { fields: [userOrganizations.userId], references: [users.id] }),
  organization: one(organizations, { fields: [userOrganizations.organizationId], references: [organizations.id] }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  course: one(courses, { fields: [userProgress.courseId], references: [courses.id] }),
}));

export const aiIdeasRelations = relations(aiIdeas, ({ one }) => ({
  user: one(users, { fields: [aiIdeas.userId], references: [users.id] }),
}));

export const inventionProjectsRelations = relations(inventionProjects, ({ one }) => ({
  user: one(users, { fields: [inventionProjects.userId], references: [users.id] }),
}));

export const businessCanvasesRelations = relations(businessCanvases, ({ one }) => ({
  user: one(users, { fields: [businessCanvases.userId], references: [users.id] }),
}));

export const diagnosticResultsRelations = relations(diagnosticResults, ({ one }) => ({
  user: one(users, { fields: [diagnosticResults.userId], references: [users.id] }),
}));

export interface CourseStep {
  title: string;
  description: string;
  content: string;
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  schoolName: true,
  gradeLevel: true,
  parentEmail: true,
  parentalConsent: true,
  signupIpUaHash: true,
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true });
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({ id: true, joinedAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, awardedAt: true });
export const insertGuestAiUsageSchema = createInsertSchema(guestAiUsage).omit({ id: true, lastUsedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, updatedAt: true });
export const insertAiIdeaSchema = createInsertSchema(aiIdeas).omit({ id: true, createdAt: true });
export const insertInventionProjectSchema = createInsertSchema(inventionProjects).omit({ id: true, createdAt: true });
export const insertBusinessCanvasSchema = createInsertSchema(businessCanvases).omit({ id: true, createdAt: true });
export const insertDiagnosticResultSchema = createInsertSchema(diagnosticResults).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type GuestAiUsage = typeof guestAiUsage.$inferSelect;
export type InsertGuestAiUsage = z.infer<typeof insertGuestAiUsageSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type AiIdea = typeof aiIdeas.$inferSelect;
export type InsertAiIdea = z.infer<typeof insertAiIdeaSchema>;
export type InventionProject = typeof inventionProjects.$inferSelect;
export type InsertInventionProject = z.infer<typeof insertInventionProjectSchema>;
export type BusinessCanvas = typeof businessCanvases.$inferSelect;
export type InsertBusinessCanvas = z.infer<typeof insertBusinessCanvasSchema>;
export type DiagnosticResult = typeof diagnosticResults.$inferSelect;
export type InsertDiagnosticResult = z.infer<typeof insertDiagnosticResultSchema>;
