import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import OpenAI from "openai";
import { randomBytes, createHash } from "crypto";
import { computeIpUaHash } from "./ip-ua-hash";
import { confirmPayment } from "./toss";
import fs from "fs";
import path from "path";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const GUEST_AI_LIMIT = 2;

// --- Token efficiency helpers ---
// Use the cheaper model for short, structured, or formatting-heavy tasks.
// Reserve the premium model for analytical depth (특허·IR·사업계획·창의 발산).
const MODEL_FAST = "gpt-4o-mini";
const MODEL_SMART = "gpt-4o";

function clampText(value: unknown, max: number): string {
  const s = typeof value === "string" ? value : value == null ? "" : String(value);
  return s.length > max ? s.slice(0, max) : s;
}

// --- Safety filters (Korean edutech baseline) ---
const PII_PATTERNS: { name: string; rx: RegExp }[] = [
  { name: "주민등록번호", rx: /\b\d{6}[-\s]?[1-4]\d{6}\b/ },
  { name: "휴대전화번호", rx: /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/ },
  { name: "계좌번호", rx: /\b\d{2,6}[-\s]\d{2,6}[-\s]\d{2,6}(?:[-\s]\d{2,6})?\b/ },
  { name: "신용카드번호", rx: /\b(?:\d[ -]?){13,16}\b/ },
];
const PROFANITY = ["씨발", "ㅅㅂ", "시발", "개새끼", "병신", "ㅂㅅ", "좆", "fuck", "shit", "asshole"];
function detectUnsafe(text: string): { ok: true } | { ok: false; reason: string } {
  if (!text) return { ok: true };
  for (const p of PII_PATTERNS) {
    if (p.rx.test(text)) return { ok: false, reason: `개인정보(${p.name})로 보이는 내용이 포함되어 있어요. 개인정보를 빼고 다시 입력해 주세요.` };
  }
  const low = text.toLowerCase();
  if (PROFANITY.some(w => low.includes(w))) {
    return { ok: false, reason: "교육용 서비스에 적합하지 않은 표현이 포함되어 있어요. 표현을 다듬어 다시 입력해 주세요." };
  }
  return { ok: true };
}
function guardInputs(...texts: string[]): string | null {
  for (const t of texts) {
    const r = detectUnsafe(t);
    if (!r.ok) return r.reason;
  }
  return null;
}
const SAFETY_NOTE = "\n\n[안전 가드] 본 응답은 교육용 학습 자료입니다. 욕설·차별·개인정보(이름·연락처·주민번호 등)·불법/유해 정보를 절대 생성하지 말고, 초·중·고등 학생도 안전하게 읽을 수 있는 톤으로 작성하세요.";
async function logAi(req: Request, endpoint: string, model: string) {
  try {
    await storage.createAiUsageLog({
      userId: req.isAuthenticated() ? req.user!.id : null,
      sessionId: req.isAuthenticated() ? null : (req.sessionID || null),
      ipUaHash: computeIpUaHash(req),
      endpoint,
      model,
    });
  } catch (e) {
    // logging은 실패해도 요청 자체를 막지 않음
    console.warn("ai usage log fail", endpoint, (e as Error).message);
  }
}
function sendSafetyError(res: Response, reason: string) {
  if (res.headersSent) {
    res.write(`data: ${JSON.stringify({ error: reason })}\n\n`);
    res.end();
    return;
  }
  res.status(400).json({ error: "UNSAFE_INPUT", message: reason });
}

// E2E 테스트용 결정론적 stub 응답 게이트.
// production 에서는 어떤 헤더가 와도 절대 활성화되지 않으며, 개발/테스트 환경에서
// X-E2E-Test: 1 헤더가 있을 때만 OpenAI 호출을 우회합니다.
// (dev 서버에서 일반 사용자는 이 헤더를 보내지 않으므로 영향 없음)
function isE2eStub(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return req.header("x-e2e-test") === "1";
}

async function awardBadgeIfEarned(userId: number, badgeKey: string): Promise<{ awarded: boolean; badge?: { name: string; icon: string } }> {
  const badge = await storage.getBadgeByKey(badgeKey);
  if (!badge) return { awarded: false };
  const has = await storage.hasUserBadge(userId, badge.id);
  if (has) return { awarded: false };
  await storage.awardBadge(userId, badge.id);
  return { awarded: true, badge: { name: badge.name, icon: badge.icon } };
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.blocked) return res.status(403).json({ error: "계정이 차단되었습니다." });
    if (!roles.includes(req.user!.role)) return res.sendStatus(403);
    next();
  };
}

const GUEST_HASH_SALT = process.env.SESSION_SECRET || "mybest-guest-salt";
function hashIdentifier(value: string): string {
  return createHash("sha256").update(`${GUEST_HASH_SALT}|${value}`).digest("hex");
}
function getGuestFingerprint(req: Request): { ipHash: string; uaHash: string; clientCount: number } {
  const fwd = req.headers["x-forwarded-for"];
  const ipRaw = (Array.isArray(fwd) ? fwd[0] : fwd?.toString().split(",")[0]) || req.ip || "";
  const ua = (req.headers["user-agent"] || "").toString();
  const headerVal = req.header("x-guest-ai-count") || "0";
  const parsed = parseInt(headerVal, 10);
  const clientCount = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 1000) : 0;
  return {
    ipHash: ipRaw ? hashIdentifier(`ip:${ipRaw.trim()}`) : "",
    uaHash: ua ? hashIdentifier(`ua:${ua}`) : "",
    clientCount,
  };
}

async function checkGuestAiLimit(req: Request, res: Response): Promise<boolean> {
  if (req.isAuthenticated()) return true;
  (req.session as Record<string, unknown>).guestAi = true;
  await new Promise<void>((resolve, reject) => {
    req.session.save((err) => { if (err) reject(err); else resolve(); });
  });
  const sessionId = req.sessionID;
  const { ipHash, uaHash, clientCount } = getGuestFingerprint(req);
  const [sessionUsage, ipUaMax] = await Promise.all([
    storage.getGuestAiUsage(sessionId),
    ipHash && uaHash ? storage.getMaxGuestAiUsageByIpUa(ipHash, uaHash) : Promise.resolve(0),
  ]);
  const sessionCount = sessionUsage?.usageCount || 0;
  const effective = Math.max(sessionCount, ipUaMax, clientCount);
  if (effective >= GUEST_AI_LIMIT) {
    res.status(403).json({ error: "GUEST_LIMIT_REACHED", message: "비회원 AI 사용 횟수를 초과했습니다. 회원가입 후 무제한 이용하세요." });
    return false;
  }
  const newCount = effective + 1;
  await storage.incrementGuestAiUsage(sessionId, ipHash || null, uaHash || null, effective);
  res.setHeader("Access-Control-Expose-Headers", "X-Guest-Ai-Count");
  res.setHeader("X-Guest-Ai-Count", String(newCount));
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/courses", async (req, res) => {
    try {
      const track = req.query.track as string | undefined;
      const courses = track ? await storage.getCoursesByTrack(track) : await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseById(parseInt(req.params.id));
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.get("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const progress = await storage.getUserProgress(req.user!.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeBody } = req.body;
      const progress = await storage.upsertUserProgress({ ...safeBody, userId: req.user!.id });
      let newBadge = null;
      if (progress.isCompleted) {
        const badgeResult = await awardBadgeIfEarned(req.user!.id, "first_course");
        if (badgeResult.awarded) newBadge = badgeResult.badge;
      }
      res.json({ ...progress, newBadge });
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get("/api/ideas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const ideas = await storage.getAiIdeas(req.user!.id);
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ideas" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const stats = await storage.getDashboardStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.patch("/api/user/level", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { level } = req.body;
      const VALID_LEVELS = [
        "beginner", "intermediate", "advanced",
        "elementary", "middle", "high", "university", "general",
      ];
      if (!VALID_LEVELS.includes(level)) {
        return res.status(400).json({ error: "Invalid level" });
      }
      const user = await storage.updateUserLevel(req.user!.id, level);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update level" });
    }
  });

  app.get("/api/user/badges", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allBadges = await storage.getBadges();
      const userBadges = await storage.getUserBadges(req.user!.id);
      const userBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
      const result = allBadges.map(badge => ({
        ...badge,
        earned: userBadgeIds.has(badge.id),
        awardedAt: userBadges.find(ub => ub.badgeId === badge.id)?.awardedAt || null,
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.get("/api/invention-projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const projects = await storage.getInventionProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/invention-projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const project = await storage.getInventionProject(parseInt(req.params.id), req.user!.id);
      if (!project) return res.status(404).json({ error: "Not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/invention-projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeBody } = req.body;
      const project = await storage.createInventionProject({ ...safeBody, userId: req.user!.id });
      const badgeResult = await awardBadgeIfEarned(req.user!.id, "first_invention");
      res.status(201).json({ ...project, newBadge: badgeResult.awarded ? badgeResult.badge : null });
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/invention-projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeData } = req.body;
      const project = await storage.updateInventionProject(parseInt(req.params.id), req.user!.id, safeData);
      if (!project) return res.status(404).json({ error: "Not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.get("/api/business-canvases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const canvases = await storage.getBusinessCanvases(req.user!.id);
      res.json(canvases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch canvases" });
    }
  });

  app.get("/api/business-canvases/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const canvas = await storage.getBusinessCanvas(parseInt(req.params.id), req.user!.id);
      if (!canvas) return res.status(404).json({ error: "Not found" });
      res.json(canvas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch canvas" });
    }
  });

  app.post("/api/business-canvases", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeBody } = req.body;
      const canvas = await storage.createBusinessCanvas({ ...safeBody, userId: req.user!.id });
      const badgeResult = await awardBadgeIfEarned(req.user!.id, "first_bmc");
      res.status(201).json({ ...canvas, newBadge: badgeResult.awarded ? badgeResult.badge : null });
    } catch (error) {
      res.status(500).json({ error: "Failed to create canvas" });
    }
  });

  app.patch("/api/business-canvases/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeData } = req.body;
      const canvas = await storage.updateBusinessCanvas(parseInt(req.params.id), req.user!.id, safeData);
      if (!canvas) return res.status(404).json({ error: "Not found" });
      res.json(canvas);
    } catch (error) {
      res.status(500).json({ error: "Failed to update canvas" });
    }
  });

  app.get("/api/diagnostic-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const results = await storage.getDiagnosticResults(req.user!.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.post("/api/diagnostic-results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { userId: _u, id: _i, ...safeBody } = req.body;
      const result = await storage.createDiagnosticResult({ ...safeBody, userId: req.user!.id });
      const badgeResult = await awardBadgeIfEarned(req.user!.id, "first_diagnosis");
      res.json({ ...result, newBadge: badgeResult.awarded ? badgeResult.badge : null });
    } catch (error) {
      res.status(500).json({ error: "Failed to save result" });
    }
  });

  // --- Admin API ---
  app.get("/api/admin/users", requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password: _, ...u }) => u);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireRole("superadmin"), async (req, res) => {
    try {
      const { role } = req.body;
      const validRoles = ["admin", "member"];
      if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
      const targetId = parseInt(req.params.id);
      const target = await storage.getUser(targetId);
      if (!target) return res.status(404).json({ error: "User not found" });
      if (target.role === "superadmin" || target.role === "group_admin") {
        return res.status(403).json({ error: "Cannot change role of this user" });
      }
      const user = await storage.updateUserRole(targetId, role);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.get("/api/admin/stats", requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/users/:id/block", requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const { blocked } = req.body;
      if (typeof blocked !== "boolean") return res.status(400).json({ error: "Invalid blocked value" });
      const targetId = parseInt(req.params.id);
      if (targetId === req.user!.id) return res.status(400).json({ error: "Cannot block yourself" });
      const target = await storage.getUser(targetId);
      if (!target) return res.status(404).json({ error: "User not found" });
      if (target.role === "superadmin") return res.status(403).json({ error: "Cannot block superadmin" });
      if (req.user!.role === "admin" && (target.role === "admin" || target.role === "superadmin")) {
        return res.status(403).json({ error: "Cannot block users with equal or higher role" });
      }
      const user = await storage.updateUserBlocked(targetId, blocked);
      const { password: _, ...safeUser } = user!;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update block status" });
    }
  });

  // --- Organization API ---
  app.get("/api/organizations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const role = req.user!.role;
      if (role === "superadmin" || role === "admin") {
        const orgs = await storage.getAllOrganizations();
        res.json(orgs);
      } else if (role === "group_admin") {
        const orgs = await storage.getOrganizationsByCreator(req.user!.id);
        res.json(orgs);
      } else {
        const userOrgs = await storage.getUserOrganizations(req.user!.id);
        res.json(userOrgs);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", requireRole("superadmin", "admin", "group_admin"), async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const inviteCode = randomBytes(4).toString("hex").toUpperCase();
      const org = await storage.createOrganization({
        name,
        description: description || null,
        inviteCode,
        createdBy: req.user!.id,
      });
      res.status(201).json(org);
    } catch (error) {
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.post("/api/organizations/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) return res.status(400).json({ error: "Invite code required" });
      const org = await storage.getOrganizationByInviteCode(inviteCode.toString().trim().toUpperCase());
      if (!org) return res.status(404).json({ error: "초대 코드가 올바르지 않습니다" });
      const membership = await storage.joinOrganization(req.user!.id, org.id);
      res.json({ organization: org, membership });
    } catch (error) {
      res.status(500).json({ error: "Failed to join organization" });
    }
  });

  app.get("/api/organizations/:id/members", requireRole("group_admin", "admin", "superadmin"), async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const user = req.user!;
      const role = user.role;
      if (role === "group_admin") {
        const org = await storage.getOrganization(orgId);
        if (!org || org.createdBy !== user.id) {
          return res.sendStatus(403);
        }
      }
      const members = await storage.getOrganizationMembers(orgId);
      const memberDetails = await Promise.all(
        members.map(async (m) => {
          const user = await storage.getUser(m.userId);
          if (!user) return null;
          const { password: _, ...safeUser } = user;
          const progress = await storage.getUserProgressSummary(m.userId);
          return { ...m, user: safeUser, progress };
        })
      );
      res.json(memberDetails.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // --- AI Endpoints (now allow guests with limit) ---
  function getLevelContext(level: string) {
    switch (level) {
      case "elementary":
      case "beginner":
        return "초등학생(만 9~12세) 수준에 맞게 쉬운 단어와 친근한 예시로 재미있게";
      case "middle":
        return "중학생 수준에 맞게 자유학기제·진로탐색 관점에서 친구·팀과 함께 풀어볼 수 있도록 구체적이고 흥미롭게";
      case "high":
        return "고등학생 수준에 맞게 학생부·대입 포트폴리오·발명대회 출품에 활용할 수 있도록 구체적이고 학술적으로";
      case "intermediate":
        return "중·고등학생 수준에 맞게 구체적이고 실용적으로";
      case "university":
        return "대학생 수준에 맞게 캡스톤·창업동아리·연구실 IP화 관점에서 전문 용어를 사용해 심도있게";
      case "general":
        return "일반인·소상공인·예비창업자 수준에 맞게 정부지원사업·실무 적용 관점에서 실전적이고 구체적으로";
      case "advanced":
      default:
        return "대학생·일반인 수준에 맞게 전문적이고 심도있게";
    }
  }
  function levelCtx(level: string) {
    return getLevelContext(level) + SAFETY_NOTE;
  }

  app.post("/api/ai/scamper", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      const problem = clampText(req.body?.problem, 1500);
      const unsafe = guardInputs(problem); if (unsafe) return sendSafetyError(res, unsafe);
      await logAi(req, "/api/ai/scamper", MODEL_SMART);
      const { level } = req.body;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          {
            role: "system",
            content: `당신은 SCAMPER 발명 기법 전문가이자 특허 전략 컨설턴트입니다. ${levelCtx(level)} 답변해주세요.

사용자가 제시한 문제/불편에 대해 SCAMPER 7가지 기법으로 각각 아이디어를 제시해주세요.
각 아이디어마다 특허의 3요소(신규성, 진보성, 산업상 이용가능성)를 간략히 평가하여 "patentability" 필드에 작성해주세요.

반드시 아래 JSON 형식으로 응답하세요 (마크다운 코드블록 없이 순수 JSON만):
{
  "substitute": {"idea": "대체 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "combine": {"idea": "결합 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "adapt": {"idea": "응용 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "modify": {"idea": "수정/확대/축소 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "putToOtherUse": {"idea": "다른용도 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "eliminate": {"idea": "제거 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"},
  "rearrange": {"idea": "재배열/역발상 아이디어", "detail": "상세 설명", "patentability": "신규성: O/X, 진보성: O/X, 산업성: O/X - 한줄 근거"}
}`
          },
          { role: "user", content: `문제/불편: ${problem}` }
        ],
        stream: true,
        max_completion_tokens: 2500,
        response_format: { type: "json_object" },
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("SCAMPER error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/triz", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      const problem = clampText(req.body?.problem, 1500);
      const contradiction = clampText(req.body?.contradiction, 1000);
      const unsafe = guardInputs(problem, contradiction); if (unsafe) return sendSafetyError(res, unsafe);
      await logAi(req, "/api/ai/triz", MODEL_SMART);
      const { level } = req.body;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          {
            role: "system",
            content: `당신은 TRIZ(창의적 문제해결이론) 전문가이자 특허 전략 컨설턴트입니다. ${levelCtx(level)} 답변해주세요.

사용자가 제시한 문제와 모순에 대해 TRIZ 40가지 발명원리 중 가장 관련있는 3~5가지를 추천하고, 각 원리에 기반한 해결 방향을 제시해주세요.
반드시 각 해결 아이디어에 대해 특허의 3요소(신규성, 진보성, 산업상 이용가능성) 관점에서 특허 가능성을 평가해주세요.

마크다운 형식으로 답변하세요:
## 모순 분석
(기술적 모순과 물리적 모순 분석)

## 추천 발명 원리
### 원리 N번: 원리명
- **적용 방법**: 이 문제에 어떻게 적용할 수 있는지
- **구체적 아이디어**: 실제 해결 아이디어
- **특허 가능성 평가**: 신규성(기존 기술 대비 새로움) / 진보성(당업자가 쉽게 도출 가능 여부) / 산업상 이용가능성(실제 산업에서 활용 가능 여부)

## 최적 해결 방향
(가장 유력한 해결 방향 요약 + 특허 출원 전략 제언)`
          },
          { role: "user", content: `문제: ${problem}\n모순: ${contradiction || "아직 정의하지 않음"}` }
        ],
        stream: true,
        max_completion_tokens: 3000,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("TRIZ error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/patent-draft", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      const title = clampText(req.body?.title, 200);
      const problem = clampText(req.body?.problem, 1500);
      const solution = clampText(req.body?.solution, 1500);
      const target = clampText(req.body?.target, 500);
      const method = clampText(req.body?.method, 1500);
      const unsafe = guardInputs(title, problem, solution, target, method); if (unsafe) return sendSafetyError(res, unsafe);
      await logAi(req, "/api/ai/patent-draft", MODEL_SMART);
      const { level } = req.body;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          {
            role: "system",
            content: `당신은 변리사급 특허 명세서 작성 전문가입니다. ${levelCtx(level)} 답변해주세요.

사용자의 발명 아이디어를 바탕으로 특허 명세서 초안을 작성해주세요.
반드시 특허의 3요소(신규성, 진보성, 산업상 이용가능성)를 엄격하게 분석하고, 각 요소에서 부족한 점이 있으면 냉정하게 지적하며 보완 방안을 제시해주세요.
기존 유사 기술(선행기술)과의 차별점을 명확히 밝혀주세요.

마크다운 형식으로 다음 구조로 작성:
# 특허 명세서 초안

## 1. 발명의 명칭
## 2. 기술분야
## 3. 배경기술 (종래기술의 문제점)
- 유사 선행기술 최소 2건 언급 및 차이점 분석
## 4. 발명의 목적
## 5. 발명의 구성 (해결수단)
- 구성요소를 구체적으로 기술 (구조, 작동원리, 재료 등)
## 6. 발명의 효과
## 7. 신규성 분석 (10점 만점)
- 점수, 근거, 선행기술 대비 차별점, 부족시 보완 방안
## 8. 진보성 분석 (10점 만점)
- 점수, 근거, 당업자가 용이하게 도출 가능한지 여부, 부족시 보완 방안
## 9. 산업상 이용가능성 (10점 만점)
- 점수, 근거, 구체적 산업 적용 분야, 부족시 보완 방안
## 10. 종합 특허성 평가
- 3요소 종합 의견 + 특허 출원 추천 여부 (추천/보완 후 추천/비추천)
## 11. 청구범위 (독립항 1개, 종속항 3개)
- 권리범위를 최대한 넓게 기술`
          },
          { role: "user", content: `발명 제목: ${title}\n해결할 문제: ${problem}\n해결 방법: ${solution}\n대상: ${target}\n구체적 방법: ${method}` }
        ],
        stream: true,
        max_completion_tokens: 4500,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Patent draft error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/bmc-assist", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      const fieldNames: Record<string, string> = {
        keyPartners: "핵심 파트너", keyActivities: "핵심 활동", valueProposition: "가치 제안",
        customerRelationships: "고객 관계", customerSegments: "고객 세그먼트",
        keyResources: "핵심 자원", channels: "채널", costStructure: "비용 구조", revenueStreams: "수익원",
      };
      const { field, level } = req.body;
      if (typeof field !== "string" || !(field in fieldNames)) {
        return res.status(400).json({ error: "잘못된 BMC 항목입니다." });
      }
      const currentValue = clampText(req.body?.currentValue, 800);
      const canvasData = (req.body?.canvasData ?? {}) as Record<string, unknown>;
      const unsafe = guardInputs(currentValue); if (unsafe) return sendSafetyError(res, unsafe);
      await logAi(req, "/api/ai/bmc-assist", MODEL_FAST);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 비즈니스 모델 캔버스(BMC) 전문 컨설턴트이자 스타트업 액셀러레이터 심사역입니다. ${levelCtx(level)} 답변해주세요.

사용자의 비즈니스 모델 캔버스에서 "${fieldNames[field] || field}" 항목에 대해 구체적이고 실용적인 내용을 제안해주세요.
다른 항목에 이미 입력된 내용을 참고하여 일관성 있게 작성해주세요.

특히 다음 사항을 집요하게 검증해주세요:
1. **수익 모델(Revenue Model)**: 어떻게 돈을 벌 것인지 구체적인 과금 체계(구독/건당/중개수수료/광고 등)를 명시하도록 유도
2. **타겟 고객 분석**: 고객 세그먼트가 구체적인지(연령/직업/소득/행동패턴 등), TAM/SAM/SOM으로 시장 크기 추정이 가능한지 검증
3. **가치 제안 검증**: 고객이 기꺼이 돈을 내고 살 만큼의 가치가 있는지, 기존 대안 대비 차별점은 무엇인지

3~5개의 구체적인 항목을 bullet point로 제시하고, 추가 질문이 필요한 부분은 "💡 확인 필요"로 표시해주세요.`
          },
          {
            role: "user",
            content: `현재 캔버스 내용:\n${Object.entries(canvasData).filter(([, v]) => v).map(([k, v]) => `- ${fieldNames[k] || k}: ${clampText(v, 400)}`).join('\n')}\n\n"${fieldNames[field] || field}" 항목을 작성해주세요. 현재 입력된 내용: ${currentValue || '(없음)'}`
          }
        ],
        stream: true,
        max_completion_tokens: 800,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("BMC assist error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/pitch-deck", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      await logAi(req, "/api/ai/pitch-deck", MODEL_SMART);
      const { level } = req.body;
      const canvasData = (req.body?.canvasData ?? {}) as Record<string, unknown>;
      const canvasTexts = Object.values(canvasData).map((v) => clampText(v, 600) || "");
      const unsafe = guardInputs(...canvasTexts); if (unsafe) return sendSafetyError(res, unsafe);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const c = (k: string) => clampText(canvasData?.[k], 600) || "미입력";

      const stream = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          {
            role: "system",
            content: `당신은 스타트업 IR 피칭 전문가이자 벤처캐피탈 심사역 출신 컨설턴트입니다. ${levelCtx(level)} 답변해주세요.

비즈니스 모델 캔버스를 바탕으로 투자자 대상 IR 피칭덱 초안을 작성해주세요.

특히 다음 사항을 깊이있게 다뤄주세요:
1. **수익 모델**: 과금 체계를 구체적으로 (단가, 예상 ARPU, LTV 등), 수익성 검증
2. **타겟 고객 분석**: TAM/SAM/SOM 추정, 고객 페르소나 구체화, 고객 획득 전략(CAC)
3. **경쟁 분석**: 직접/간접 경쟁사 대비 차별화 포인트를 정량적으로 기술
4. 부족하거나 보완이 필요한 항목은 "⚠️ 보완 필요" 표시와 함께 구체적 제안

마크다운으로 각 슬라이드를 구분하여 작성:
# 슬라이드 1: 표지 (회사명/서비스명, 한줄 소개)
# 슬라이드 2: 문제 정의 (고객 Pain Point 수치화)
# 슬라이드 3: 솔루션 (핵심 가치 제안)
# 슬라이드 4: 시장 규모 (TAM/SAM/SOM 분석)
# 슬라이드 5: 비즈니스 모델 (수익 구조 + 단위경제학)
# 슬라이드 6: 경쟁 분석 (경쟁 매트릭스)
# 슬라이드 7: Go-to-Market 전략 (고객 획득 + 성장 전략)
# 슬라이드 8: 팀 구성 (필요 역량 + 추천 구성)
# 슬라이드 9: 재무 계획 (3개년 매출/비용 추정)
# 슬라이드 10: 투자 요청 (투자금 사용 계획 + 기대 성과)`
          },
          {
            role: "user",
            content: `비즈니스 모델 캔버스:\n- 가치 제안: ${c('valueProposition')}\n- 고객 세그먼트: ${c('customerSegments')}\n- 채널: ${c('channels')}\n- 고객 관계: ${c('customerRelationships')}\n- 수익원: ${c('revenueStreams')}\n- 핵심 자원: ${c('keyResources')}\n- 핵심 활동: ${c('keyActivities')}\n- 핵심 파트너: ${c('keyPartners')}\n- 비용 구조: ${c('costStructure')}`
          }
        ],
        stream: true,
        max_completion_tokens: 4500,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Pitch deck error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/diagnostic-analysis", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      await logAi(req, "/api/ai/diagnostic-analysis", MODEL_FAST);
      const { type, scores: rawScores, level } = req.body;
      const isCreativity = type === "creativity";
      const categories = isCreativity
        ? { fluency: "유창성", flexibility: "융통성", originality: "독창성", elaboration: "정교성", openness: "개방성" }
        : { feasibility: "실현가능성", profitability: "수익성", growth: "성장성", marketability: "시장성", innovation: "혁신성" };

      // Only accept known category keys with numeric scores in 0–10. Prevents prompt-size abuse.
      if (!rawScores || typeof rawScores !== "object") {
        return res.status(400).json({ error: "scores must be an object" });
      }
      const scoreDesc = Object.keys(categories)
        .filter((k) => k in (rawScores as Record<string, unknown>))
        .map((k) => {
          const raw = Number((rawScores as Record<string, unknown>)[k]);
          const safe = Number.isFinite(raw) ? Math.max(0, Math.min(10, raw)) : 0;
          return `${(categories as Record<string, string>)[k]}: ${safe}점/10점`;
        })
        .join(", ");
      if (!scoreDesc) {
        return res.status(400).json({ error: "유효한 점수가 없습니다." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 ${isCreativity ? '창의성 교육 전문가이자 영재교육 연구자' : '창업 컨설턴트이자 스타트업 액셀러레이터 멘토'}입니다. ${levelCtx(level)} 답변해주세요.

진단 결과를 전문적으로 분석하여 구체적이고 실행 가능한 맞춤형 피드백을 제공해주세요.
${isCreativity ? '특히 각 영역의 점수를 객관적으로 평가하고, 창의성 향상을 위한 과학적 근거 기반의 훈련법을 제시해주세요.' : '특히 수익 모델 설계 역량과 타겟 고객 분석 능력을 중점 평가하고, 실전 창업에 바로 적용할 수 있는 구체적 액션 아이템을 제시해주세요.'}

마크다운으로 답변:
## 종합 분석
(전체적인 강점과 개선점, 동일 수준 학습자 대비 상대적 위치 평가)

## 영역별 피드백
(각 영역별 구체적 피드백 + 점수 해석 + 실질적 개선 방법)

## 핵심 발전 과제 TOP 3
(가장 시급한 개선 영역 3가지 + 각각 2주/1개월/3개월 단기-중기 목표 설정)

## 추천 활동 및 학습 자원
(실천할 수 있는 활동/프로그램/도서/온라인 강좌 구체적 추천)`
          },
          { role: "user", content: `${isCreativity ? '창의성' : '창업 지수'} 진단 결과:\n${scoreDesc}` }
        ],
        stream: true,
        max_completion_tokens: 2000,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Diagnostic error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  app.post("/api/ai/followup", async (req, res) => {
    if (!(await checkGuestAiLimit(req, res))) return;
    try {
      const { level, history } = req.body;
      const previousContent = clampText(req.body?.previousContent, 4000);
      const question = clampText(req.body?.question, 1500);
      const context = clampText(req.body?.context, 800);
      if (!previousContent || !question) {
        return res.status(400).json({ error: "previousContent and question are required" });
      }
      const unsafe = guardInputs(question, context); if (unsafe) return sendSafetyError(res, unsafe);
      await logAi(req, "/api/ai/followup", MODEL_FAST);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const conversationMessages: { role: "user" | "assistant"; content: string }[] = [];
      if (Array.isArray(history) && history.length > 0) {
        conversationMessages.push({ role: "assistant", content: previousContent });
        // Keep only the most recent 6 turns to bound prompt size.
        const recent = history.slice(-6);
        for (const msg of recent) {
          if (msg.role === "user" || msg.role === "assistant") {
            conversationMessages.push({ role: msg.role, content: clampText(msg.content, 1500) });
          }
        }
      } else {
        conversationMessages.push({ role: "assistant", content: previousContent });
        conversationMessages.push({ role: "user", content: question });
      }

      const stream = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 발명·창업 교육 전문가입니다. ${getLevelContext(level || "intermediate")} 답변해주세요.
사용자가 이전 AI 응답에 대해 후속 질문을 합니다. 이전 응답의 맥락을 유지하면서 새로운 질문에 답변해주세요.
${context ? `맥락: ${context}` : ""}`
          },
          ...conversationMessages,
        ],
        stream: true,
        max_completion_tokens: 1500,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Follow-up error:", error);
      if (!res.headersSent) res.status(500).json({ error: "AI error" });
      else { res.write(`data: ${JSON.stringify({ error: "AI 오류" })}\n\n`); res.end(); }
    }
  });

  // --- Gallery / Community API ---
  app.get("/api/gallery", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const q = req.query.q as string | undefined;
      const tagParam = req.query.tag;
      const tags = Array.isArray(tagParam)
        ? tagParam.map(t => String(t)).filter(Boolean)
        : typeof tagParam === "string" && tagParam.trim()
          ? tagParam.split(",").map(t => t.trim()).filter(Boolean)
          : undefined;
      const posts = await storage.getGalleryPosts(type || undefined, q, tags);
      let likedPostIds: number[] = [];
      if (req.isAuthenticated()) {
        likedPostIds = await storage.getUserGalleryLikes(req.user!.id);
      }
      res.json({ posts, likedPostIds });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gallery" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { type, projectId, title, description, tags } = req.body;
      if (!title || !type) return res.status(400).json({ error: "제목과 유형은 필수입니다." });
      const post = await storage.createGalleryPost({
        userId: req.user!.id,
        type,
        projectId: projectId || null,
        title,
        description: description || null,
        tags: tags || null,
      });
      const badgeResult = await awardBadgeIfEarned(req.user!.id, "first_share");
      res.status(201).json({ ...post, newBadge: badgeResult.awarded ? badgeResult.badge : null });
    } catch (error) {
      res.status(500).json({ error: "작품 등록에 실패했습니다." });
    }
  });

  app.post("/api/gallery/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) return res.status(400).json({ error: "잘못된 요청입니다." });
    try {
      await storage.likeGalleryPost(req.user!.id, postId);
      res.json({ liked: true });
    } catch (error) {
      res.status(500).json({ error: "좋아요 실패" });
    }
  });

  app.delete("/api/gallery/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) return res.status(400).json({ error: "잘못된 요청입니다." });
    try {
      await storage.unlikeGalleryPost(req.user!.id, postId);
      res.json({ liked: false });
    } catch (error) {
      res.status(500).json({ error: "좋아요 취소 실패" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) return res.status(400).json({ error: "잘못된 요청입니다." });
    try {
      const deleted = await storage.deleteGalleryPost(postId, req.user!.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "삭제 실패" });
    }
  });

  // --- Public Stats API ---
  app.get("/api/stats/public", async (_req, res) => {
    try {
      const stats = await storage.getPublicStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // --- Organization Detailed Stats ---
  app.get("/api/organizations/:id/stats", requireRole("group_admin", "admin", "superadmin"), async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      if (req.user!.role === "group_admin") {
        const org = await storage.getOrganization(orgId);
        if (!org || org.createdBy !== req.user!.id) return res.sendStatus(403);
      }
      const stats = await storage.getOrganizationDetailedStats(orgId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organization stats" });
    }
  });

  app.post("/api/franchise", async (req, res) => {
    try {
      const { organizationName, contactName, phone, email, expectedMembers, message } = req.body;
      if (!organizationName || !contactName || !phone || !email) {
        return res.status(400).json({ error: "필수 항목을 입력해주세요." });
      }
      const inquiry = await storage.createFranchiseInquiry({
        organizationName, contactName, phone, email,
        expectedMembers: expectedMembers ? parseInt(expectedMembers) : null,
        message: message || null,
      });
      res.json(inquiry);
    } catch (error) {
      console.error("Franchise inquiry error:", error);
      res.status(500).json({ error: "신청 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/admin/analytics/overview", requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || "30")) || 30));
      const toolRaw = typeof req.query.tool === "string" ? req.query.tool : "";
      const allowed = ["scamper", "triz", "patent", "bmc", "pitch", "diagnosis"];
      const tool = allowed.includes(toolRaw) ? toolRaw : undefined;
      const data = await storage.getAnalyticsOverview(days, tool);
      res.json(data);
    } catch (e) {
      console.error("analytics overview fail", e);
      res.status(500).json({ error: "Analytics overview failed" });
    }
  });

  app.get("/api/admin/ai-usage", requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const days = Math.max(1, Math.min(90, parseInt(String(req.query.days || "30")) || 30));
      const stats = await storage.getAiUsageStats(days);
      res.json({ days, ...stats });
    } catch (e) {
      res.status(500).json({ error: "AI usage stats failed" });
    }
  });

  app.get("/api/organizations/:orgId/members/:memberId/works", requireRole("group_admin", "admin", "superadmin"), async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const memberId = parseInt(req.params.memberId);
      if (Number.isNaN(orgId) || Number.isNaN(memberId)) return res.status(400).json({ error: "잘못된 요청" });
      const caller = req.user!;
      if (caller.role === "group_admin") {
        const org = await storage.getOrganization(orgId);
        if (!org || org.createdBy !== caller.id) return res.sendStatus(403);
      }
      const orgMembers = await storage.getOrganizationMembers(orgId);
      if (!orgMembers.some(m => m.userId === memberId)) return res.sendStatus(403);
      const works = await storage.getMemberWorks(memberId);
      res.json(works);
    } catch (e) {
      res.status(500).json({ error: "회원 작품 조회 실패" });
    }
  });

  app.get("/api/admin/franchise", requireRole("superadmin", "admin"), async (_req, res) => {
    const inquiries = await storage.getFranchiseInquiries();
    res.json(inquiries);
  });

  app.patch("/api/admin/franchise/:id/status", requireRole("superadmin", "admin"), async (req, res) => {
    const { status } = req.body;
    if (!["pending", "contacted", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "유효하지 않은 상태입니다." });
    }
    const updated = await storage.updateFranchiseStatus(parseInt(req.params.id), status);
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  });

  app.post("/api/ai/quick-trial", async (req, res) => {
    const allowed = await checkGuestAiLimit(req, res);
    if (!allowed) return;

    const { idea } = req.body;
    if (!idea || typeof idea !== "string") {
      return res.status(400).json({ error: "아이디어를 입력해주세요." });
    }

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: "당신은 발명·창업 전문 AI 멘토입니다. 사용자가 제시한 발명 아이디어를 짧고 인상적으로 분석하세요. 반드시 한국어로, 3~4줄 이내로 답하세요. 포함 항목: 1) 아이디어의 강점 한 줄 2) 타겟 시장 한 줄 3) 발전 방향 한 줄. 이모지를 적절히 사용하세요.",
          },
          { role: "user", content: `발명 아이디어: ${clampText(idea, 800)}` },
        ],
        max_tokens: 250,
        temperature: 0.8,
      });
      const result = response.choices[0]?.message?.content || "분석을 생성할 수 없습니다.";
      res.json({ result });
    } catch (error) {
      console.error("Quick trial error:", error);
      res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }
  });

  // --- Tailored reports (생기부 / 사업계획서) ---
  const saengbuSchema = z.object({
    projectId: z.coerce.number().int().positive(),
    projectType: z.enum(["invention", "startup"]),
    wordCount: z.union([z.literal(500), z.literal(1500)]).optional(),
  });
  app.post("/api/reports/saengbu", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = saengbuSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "잘못된 요청입니다.", details: parsed.error.flatten() });
    }
    try {
      const { projectId, projectType, wordCount } = parsed.data;
      const targetWords = wordCount === 1500 ? 1500 : 500;
      let project: any = null;
      if (projectType === "invention") {
        project = await storage.getInventionProject(projectId, req.user!.id);
      } else {
        project = await storage.getBusinessCanvas(projectId, req.user!.id);
      }
      if (!project) return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다." });

      if (isE2eStub(req)) {
        return res.json({
          text: `[E2E STUB] 생기부 활동보고서 (${targetWords}자) - ${clampText(project.title, 80)}`,
          wordCount: targetWords,
        });
      }

      const f = (v: unknown) => clampText(v, 800);
      const summary = projectType === "invention"
        ? `발명 제목: ${f(project.title)}\n문제 정의: ${f(project.problem)}\n해결 방안: ${f(project.solution)}\n대상: ${f(project.target)}\n구현 방법: ${f(project.method)}`
        : `창업 아이템: ${f(project.title)}\n가치제안: ${f(project.valueProposition)}\n고객: ${f(project.customerSegments)}\n채널: ${f(project.channels)}\n수익: ${f(project.revenueStreams)}`;

      const completion = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 고등학교 학생부(생활기록부) 작성 전문가입니다. 학생의 실제 활동을 토대로 학종(학생부종합전형)에 활용 가능한 '교과 세부능력 및 특기사항' 또는 '창의적 체험활동' 영역의 활동 보고서를 작성합니다.

다음 규칙을 반드시 지켜주세요:
1. 정확히 ${targetWords}자 내외(±10%)로 작성
2. 학생부 문체(동기→과정→배운점→성장 흐름, 명사형 종결 또는 ~함/~음 어미)
3. 구체적 활동 내용과 학생의 자기주도성·탐구역량·문제해결력이 드러나도록 서술
4. 과장·허위 표현 금지, 사실 기반으로 작성
5. 출력은 본문 텍스트만 (제목·번호·마크다운 없이)`
          },
          { role: "user", content: `다음 프로젝트를 ${targetWords}자 분량 학생부 활동보고서로 작성해주세요.\n\n${summary}` },
        ],
        max_completion_tokens: targetWords === 1500 ? 3000 : 1200,
      });
      const text = completion.choices[0]?.message?.content || "";
      res.json({ text, wordCount: targetWords });
    } catch (error) {
      console.error("Saengbu report error:", error);
      res.status(500).json({ error: "보고서 생성 중 오류가 발생했습니다." });
    }
  });

  const businessPlanSchema = z.object({
    canvasId: z.coerce.number().int().positive(),
  });
  app.post("/api/reports/business-plan", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = businessPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "잘못된 요청입니다.", details: parsed.error.flatten() });
    }
    try {
      const { canvasId } = parsed.data;
      const canvas: any = await storage.getBusinessCanvas(canvasId, req.user!.id);
      if (!canvas) return res.status(404).json({ error: "비즈니스 캔버스를 찾을 수 없습니다." });

      if (isE2eStub(req)) {
        return res.json({
          text: `[E2E STUB] 사업계획서 - ${clampText(canvas.title, 80)}\n## 1. 문제 인식\n## 2. 실현 가능성\n## 3. 성장 전략\n## 4. 사업화 추진 일정\n## 5. 팀 구성\n## 6. 자금 운용 계획\n## 7. 사회적 가치 및 기대 효과`,
        });
      }

      const f = (v: unknown) => clampText(v, 800);
      const bmcSummary = `사업명: ${f(canvas.title)}
[가치 제안] ${f(canvas.valueProposition)}
[고객 세그먼트] ${f(canvas.customerSegments)}
[채널] ${f(canvas.channels)}
[고객 관계] ${f(canvas.customerRelationships)}
[수익원] ${f(canvas.revenueStreams)}
[핵심 자원] ${f(canvas.keyResources)}
[핵심 활동] ${f(canvas.keyActivities)}
[핵심 파트너] ${f(canvas.keyPartners)}
[비용 구조] ${f(canvas.costStructure)}`;

      const completion = await openai.chat.completions.create({
        model: MODEL_SMART,
        messages: [
          {
            role: "system",
            content: `당신은 K-Startup·예비창업패키지·청년창업사관학교 등 정부지원사업 사업계획서 컨설턴트입니다.
사용자의 비즈니스 모델 캔버스를 정부 표준 양식(PSST: Problem-Solution-Scale-Team) 기반 사업계획서로 변환해주세요.

다음 7개 섹션을 반드시 포함하고, 각 섹션 제목은 마크다운 H2(##)로 작성합니다:
## 1. 문제 인식 (Problem)
   - 창업 아이템의 사회적/시장적 배경, 해결하고자 하는 문제

## 2. 실현 가능성 (Solution)
   - 솔루션의 구체적 내용, 차별성, 기술적 실현 가능성, 지식재산권

## 3. 성장 전략 (Scale-up)
   - 시장 규모 추정(TAM/SAM/SOM 관점), 진입 전략, 매출 시나리오(1~3년)

## 4. 사업화 추진 일정 (Roadmap)
   - 분기별 마일스톤 표 (개발/마케팅/매출 목표)

## 5. 팀 구성 (Team)
   - 대표자 역량, 핵심팀, 외부 자문/멘토 활용 계획

## 6. 자금 운용 계획 (Budget)
   - 정부지원금 사용 계획 항목별 예시 (인건비/외주비/재료비/마케팅비/기타)

## 7. 사회적 가치 및 기대 효과
   - 일자리 창출, 지역 기여, ESG 관점

각 섹션은 3~5문단, 실제 정부지원사업 평가 기준(혁신성·시장성·사업성·자립도)이 잘 드러나도록 작성하세요. 과장 없이 사실 기반.`
          },
          { role: "user", content: `다음 비즈니스 모델 캔버스를 정부지원사업 사업계획서로 변환해주세요.\n\n${bmcSummary}` },
        ],
        max_completion_tokens: 4000,
      });
      const text = completion.choices[0]?.message?.content || "";
      res.json({ text });
    } catch (error) {
      console.error("Business plan error:", error);
      res.status(500).json({ error: "사업계획서 생성 중 오류가 발생했습니다." });
    }
  });

  // --- 대회 출품 도우미 ---
  // 대한민국학생발명전시회 / 청소년창업경진대회 등 표준 양식으로 변환
  const competitionSchema = z.object({
    projectId: z.coerce.number().int().positive(),
    projectType: z.enum(["invention", "startup"]),
    competition: z.enum(["student_invention", "youth_startup", "general"]).optional(),
  });

  const COMPETITION_TEMPLATES: Record<string, { name: string; sections: string[]; tone: string }> = {
    student_invention: {
      name: "대한민국학생발명전시회",
      sections: [
        "## 1. 작품명 및 한 줄 소개",
        "## 2. 발명 동기 (왜 만들었나요?)",
        "## 3. 작품 개요 및 작동 원리",
        "## 4. 기존 제품과의 차별점·창의성",
        "## 5. 활용 가능성 및 기대효과",
        "## 6. 추가 발전 계획",
      ],
      tone: "초·중·고 학생 본인이 설명하는 1인칭 친근한 어조, 과장 없이 실제 제작 과정과 배운 점이 드러나도록",
    },
    youth_startup: {
      name: "청소년창업경진대회",
      sections: [
        "## 1. 사업 아이템명 및 핵심 가치",
        "## 2. 창업 동기 (해결하고자 하는 문제)",
        "## 3. 사업 개요 및 비즈니스 모델",
        "## 4. 시장 분석 및 타겟 고객",
        "## 5. 차별화 전략 및 경쟁 우위",
        "## 6. 사업화 추진 계획 (단계별)",
        "## 7. 기대 효과 및 사회적 가치",
      ],
      tone: "청소년 창업가 입장의 도전적이고 진정성 있는 어조, 시장성·실현가능성·팀 역량이 함께 드러나도록",
    },
    general: {
      name: "범용 출품작 보고서",
      sections: [
        "## 1. 출품작 명칭 및 핵심 요약",
        "## 2. 개발/기획 동기",
        "## 3. 주요 내용 및 특징",
        "## 4. 차별성 및 우수성",
        "## 5. 활용 방안 및 기대 효과",
      ],
      tone: "심사위원이 빠르게 핵심을 파악할 수 있는 객관적·구조적 어조",
    },
  };

  app.post("/api/reports/competition", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = competitionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "잘못된 요청입니다.", details: parsed.error.flatten() });
    }
    try {
      const { projectId, projectType } = parsed.data;
      const competitionKey = parsed.data.competition
        ?? (projectType === "invention" ? "student_invention" : "youth_startup");
      const template = COMPETITION_TEMPLATES[competitionKey];

      let project: any = null;
      if (projectType === "invention") {
        project = await storage.getInventionProject(projectId, req.user!.id);
      } else {
        project = await storage.getBusinessCanvas(projectId, req.user!.id);
      }
      if (!project) return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다." });

      if (isE2eStub(req)) {
        return res.json({
          text: `[E2E STUB] ${template.name} 출품 양식 - ${clampText(project.title, 80)}\n${template.sections.join("\n")}`,
          competition: competitionKey,
          competitionName: template.name,
        });
      }

      const f = (v: unknown) => clampText(v, 800);
      const summary = projectType === "invention"
        ? `발명 제목: ${f(project.title)}\n해결할 문제: ${f(project.problem)}\n해결 방안: ${f(project.solution)}\n사용 대상: ${f(project.target)}\n구현 방법: ${f(project.method)}`
        : `사업 아이템: ${f(project.title)}\n가치 제안: ${f(project.valueProposition)}\n고객 세그먼트: ${f(project.customerSegments)}\n채널: ${f(project.channels)}\n수익원: ${f(project.revenueStreams)}\n핵심 자원: ${f(project.keyResources)}\n핵심 활동: ${f(project.keyActivities)}`;

      const completion = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 ${template.name} 출품 양식을 다년간 지도해온 멘토입니다.
사용자의 프로젝트를 ${template.name}의 표준 출품 양식으로 변환해주세요.

작성 어조: ${template.tone}

다음 섹션을 모두 포함하고 각 섹션 제목은 마크다운 H2로 작성합니다:
${template.sections.join("\n")}

각 섹션은 2~4문단으로, 심사 평가 기준(창의성·실현가능성·완성도·사회적 가치)이 자연스럽게 드러나도록 작성하세요.
과장·허위 표현 금지, 입력된 사실 기반으로만 서술하세요.`,
          },
          { role: "user", content: `다음 프로젝트를 ${template.name} 출품 양식으로 변환해주세요.\n\n${summary}` },
        ],
        max_completion_tokens: 2500,
      });
      const text = completion.choices[0]?.message?.content || "";
      res.json({ text, competition: competitionKey, competitionName: template.name });
    } catch (error) {
      console.error("Competition report error:", error);
      res.status(500).json({ error: "출품 양식 생성 중 오류가 발생했습니다." });
    }
  });

  // --- 자유학기제·진로탐색 워크북 (중학생용) ---
  // 주제선정 → 탐구과정 → 느낀점 → 진로 연계 4단계 활동지 양식
  const freeSemesterSchema = z.object({
    projectId: z.coerce.number().int().positive(),
    projectType: z.enum(["invention", "startup"]),
  });

  app.post("/api/reports/freesemester", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = freeSemesterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "잘못된 요청입니다.", details: parsed.error.flatten() });
    }
    try {
      const { projectId, projectType } = parsed.data;
      let project: any = null;
      if (projectType === "invention") {
        project = await storage.getInventionProject(projectId, req.user!.id);
      } else {
        project = await storage.getBusinessCanvas(projectId, req.user!.id);
      }
      if (!project) return res.status(404).json({ error: "프로젝트를 찾을 수 없습니다." });

      const f = (v: unknown) => clampText(v, 800);
      const summary = projectType === "invention"
        ? `발명 제목: ${f(project.title)}\n해결할 문제: ${f(project.problem)}\n해결 방안: ${f(project.solution)}\n사용 대상: ${f(project.target)}\n구현 방법: ${f(project.method)}`
        : `사업 아이템: ${f(project.title)}\n가치 제안: ${f(project.valueProposition)}\n고객 세그먼트: ${f(project.customerSegments)}\n채널: ${f(project.channels)}\n수익원: ${f(project.revenueStreams)}\n핵심 자원: ${f(project.keyResources)}\n핵심 활동: ${f(project.keyActivities)}`;

      const completion = await openai.chat.completions.create({
        model: MODEL_FAST,
        messages: [
          {
            role: "system",
            content: `당신은 중학교 자유학기제(자유학년제) 활동을 지도하는 진로교사입니다.
학생이 진행한 발명/창업 프로젝트를 자유학기제 표준 활동지 형식으로 변환해주세요.

작성 어조: 중학생 본인이 직접 쓴 1인칭 활동 일지 어조 (~했다, ~배웠다, ~느꼈다 어미). 친근하지만 학습 흐름이 분명히 드러나도록.

다음 4개 섹션을 모두 포함하고, 각 섹션 제목은 마크다운 H2(##)로 작성합니다:

## 1. 주제 선정 (왜 이 주제를 골랐나요?)
   - 활동 주제·동기, 평소 관심 분야와의 연결, 주제를 선택한 계기를 2~3문단

## 2. 탐구 과정 (어떻게 진행했나요?)
   - 자료 조사·아이디어 구체화·시제품 또는 모델 설계 등 단계별 과정, 협업·도구 활용을 2~4문단

## 3. 배운 점과 느낀 점 (Reflection)
   - 새롭게 알게 된 지식, 어려웠던 점과 극복 방법, 자기 성장 포인트를 2~3문단

## 4. 진로 연계 (앞으로 어떻게 이어갈까?)
   - 이 활동이 관심 진로·직업과 어떻게 연결되는지, 앞으로 더 탐구하고 싶은 분야와 후속 학습 계획을 2~3문단

작성 규칙:
- 자유학기제 평가 관점(자기주도성·탐구역량·진로성숙도)이 자연스럽게 드러나야 함
- 과장·허위 표현 금지, 입력된 사실 기반으로만 서술
- 분량은 전체 800~1200자 내외`,
          },
          { role: "user", content: `다음 프로젝트를 중학교 자유학기제 활동지 양식으로 작성해주세요.\n\n${summary}` },
        ],
        max_completion_tokens: 2000,
      });
      const text = completion.choices[0]?.message?.content || "";
      res.json({ text });
    } catch (error) {
      console.error("Free semester report error:", error);
      res.status(500).json({ error: "자유학기 활동지 생성 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/manual/download", (_req, res) => {
    const filePath = path.resolve("마이베스트_발명창업_사용자_매뉴얼.md");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "매뉴얼 파일을 찾을 수 없습니다." });
    }
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="user_manual.md"');
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/manual/content", (_req, res) => {
    const filePath = path.resolve("마이베스트_발명창업_사용자_매뉴얼.md");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "매뉴얼 파일을 찾을 수 없습니다." });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  });

  // ===== Billing / 결제 (Toss Payments) =====
  // 공개: 요금제 목록
  app.get("/api/billing/plans", async (_req, res) => {
    try {
      const list = await storage.getPlans();
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: "요금제를 불러오지 못했습니다." });
    }
  });

  // 클라이언트 결제위젯에 쓸 공개 설정(클라이언트키)
  app.get("/api/billing/config", (_req, res) => {
    res.json({
      clientKey: process.env.VITE_TOSS_CLIENT_KEY || process.env.TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",
    });
  });

  // 현재 사용자 구독 상태
  app.get("/api/billing/subscription", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sub = await storage.getActiveSubscription(req.user!.id);
    res.json({ subscription: sub ?? null });
  });

  // 주문 생성: 결제 전 서버에서 금액을 확정(위변조 방지)
  app.post("/api/billing/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인이 필요합니다." });
    try {
      const planCode = String(req.body?.planCode || "");
      const plan = await storage.getPlanByCode(planCode);
      if (!plan || !plan.active) return res.status(404).json({ error: "유효하지 않은 요금제입니다." });
      const orderId = `mbi_${Date.now()}_${randomBytes(6).toString("hex")}`;
      const customerName = req.user!.displayName || req.user!.username;
      await storage.createOrder({
        orderId, userId: req.user!.id, planCode: plan.code,
        orderName: plan.name, amount: plan.amount, customerName,
      });
      res.json({
        orderId, orderName: plan.name, amount: plan.amount,
        customerName, customerKey: `user_${req.user!.id}`,
      });
    } catch (e) {
      res.status(500).json({ error: "주문 생성 중 오류가 발생했습니다." });
    }
  });

  // 결제 승인: 위젯/리다이렉트에서 받은 값으로 서버가 최종 승인 + 구독 활성화
  app.post("/api/billing/confirm", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인이 필요합니다." });
    try {
      const paymentKey = String(req.body?.paymentKey || "");
      const orderId = String(req.body?.orderId || "");
      const amount = Number(req.body?.amount || 0);
      if (!paymentKey || !orderId || !amount) return res.status(400).json({ error: "결제 정보가 올바르지 않습니다." });

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
      if (order.userId !== req.user!.id) return res.status(403).json({ error: "주문 소유자가 아닙니다." });
      if (order.status === "paid") return res.json({ ok: true, alreadyPaid: true });
      if (order.amount !== amount) {
        await storage.updateOrderStatus(orderId, "failed");
        return res.status(400).json({ error: "결제 금액이 일치하지 않습니다." });
      }

      // 토스 서버 승인
      const payment = await confirmPayment(paymentKey, orderId, amount);

      await storage.createPayment({
        orderId, paymentKey, method: payment.method ?? null, amount,
        status: payment.status, approvedAt: payment.approvedAt ? new Date(payment.approvedAt) : new Date(), raw: payment,
      });
      await storage.updateOrderStatus(orderId, "paid");

      // 구독 활성화 (월/연 기간 계산)
      const plan = await storage.getPlanByCode(order.planCode);
      let end: Date | null = null;
      if (plan?.interval === "month") { end = new Date(); end.setMonth(end.getMonth() + 1); }
      else if (plan?.interval === "year") { end = new Date(); end.setFullYear(end.getFullYear() + 1); }
      await storage.activateSubscription(req.user!.id, order.planCode, end);

      res.json({ ok: true, planCode: order.planCode, currentPeriodEnd: end });
    } catch (e) {
      const err = e as Error & { code?: string };
      try { await storage.updateOrderStatus(String(req.body?.orderId || ""), "failed"); } catch {}
      res.status(400).json({ error: err.message || "결제 승인에 실패했습니다.", code: err.code });
    }
  });

  // 토스 웹훅(결제 상태 변경 알림) — 기록용
  app.post("/api/billing/webhook", async (req, res) => {
    try {
      const data = req.body || {};
      const orderId = data?.data?.orderId || data?.orderId;
      const status = data?.data?.status || data?.status;
      if (orderId && status === "DONE") {
        const order = await storage.getOrder(orderId);
        if (order && order.status !== "paid") await storage.updateOrderStatus(orderId, "paid");
      }
      res.sendStatus(200);
    } catch (e) {
      res.sendStatus(200); // 웹훅은 항상 200 (재시도 폭주 방지)
    }
  });

  // ===== 결과물 공유 (바이럴 유입) =====
  function escapeAttr(s: string): string {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 공유 데이터 조회(공개)
  app.get("/api/shares/:token", async (req, res) => {
    const share = await storage.getShareByToken(req.params.token);
    if (!share) return res.status(404).json({ error: "공유를 찾을 수 없습니다." });
    storage.incrementShareViews(req.params.token).catch(() => {});
    res.json(share);
  });

  // 공유 생성(로그인 필요)
  app.post("/api/shares", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인이 필요합니다." });
    try {
      const type = String(req.body?.type || "");
      if (!["invention", "canvas", "diagnosis"].includes(type)) return res.status(400).json({ error: "잘못된 공유 유형입니다." });
      const title = clampText(req.body?.title, 120) || "마이베스트 발명창업 결과물";
      const summary = clampText(req.body?.summary, 280);
      const payload = (req.body?.payload && typeof req.body.payload === "object") ? req.body.payload : null;
      const refId = req.body?.refId ? Number(req.body.refId) : null;
      const token = randomBytes(8).toString("base64url");
      const authorName = req.user!.displayName || req.user!.username;
      await storage.createShare({ token, userId: req.user!.id, authorName, type, refId, title, summary, payload });
      const base = process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
      res.json({ token, url: `${base}/share/${token}` });
    } catch (e) {
      res.status(500).json({ error: "공유 생성 중 오류가 발생했습니다." });
    }
  });

  // 공개 공유 페이지: 카카오톡/SNS 크롤러용 OG 메타 주입(프로덕션). 그 외엔 SPA가 렌더.
  app.get("/share/:token", async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") return next(); // dev: Vite가 SPA 서빙
    try {
      const share = await storage.getShareByToken(req.params.token);
      const idxPath = path.resolve("dist", "public", "index.html");
      let html = fs.readFileSync(idxPath, "utf-8");
      if (share) {
        const base = process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
        const t = escapeAttr(`${share.title} · 마이베스트 발명창업`);
        const d = escapeAttr(share.summary || "AI로 만든 발명·창업 결과물을 확인해보세요.");
        const url = escapeAttr(`${base}/share/${share.token}`);
        const img = escapeAttr(`${base}/og-thumbnail.png`);
        html = html
          .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
          .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`)
          .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`)
          .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="article" />\n    <meta property="og:url" content="${url}" />`);
      }
      res.status(200).set("Content-Type", "text/html").end(html);
    } catch (e) {
      next();
    }
  });

  return httpServer;
}
