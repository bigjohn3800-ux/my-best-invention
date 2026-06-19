import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { computeIpUaHash } from "./ip-ua-hash";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ pool, createTableIfMissing: true }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else if (user.blocked) {
        return done(null, false, { message: "계정이 차단되었습니다. 관리자에게 문의하세요." });
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const parentalConsent = !!req.body.parentalConsent;
    const isMinor = !!req.body.isMinor;
    const ageConfirmed = !!req.body.ageConfirmed;
    const termsAgreed = !!req.body.termsAgreed;
    const privacyAgreed = !!req.body.privacyAgreed;
    const youthPolicyAgreed = !!req.body.youthPolicyAgreed;
    const parentEmail = typeof req.body.parentEmail === "string" ? req.body.parentEmail.trim() : null;

    if (!termsAgreed || !privacyAgreed || !youthPolicyAgreed) {
      return res.status(400).send("필수 약관에 동의해야 합니다.");
    }
    if (isMinor) {
      if (!parentalConsent) {
        return res.status(400).send("만 14세 미만은 보호자 동의가 필요합니다.");
      }
      if (!parentEmail || !/.+@.+\..+/.test(parentEmail)) {
        return res.status(400).send("보호자 이메일을 정확히 입력해주세요.");
      }
    } else if (!ageConfirmed) {
      return res.status(400).send("연령 확인이 필요합니다.");
    }
    if (parentalConsent && (!parentEmail || !/.+@.+\..+/.test(parentEmail))) {
      return res.status(400).send("보호자 동의 시 보호자 이메일이 필요합니다.");
    }
    const user = await storage.createUser({
      username: req.body.username,
      password: await hashPassword(req.body.password),
      displayName: req.body.displayName || null,
      schoolName: req.body.schoolName || null,
      gradeLevel: req.body.gradeLevel || null,
      parentEmail: parentalConsent ? parentEmail : null,
      parentalConsent,
      signupIpUaHash: computeIpUaHash(req),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
