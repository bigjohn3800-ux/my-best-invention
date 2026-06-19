import { executeSql } from "./db";

export async function runMigrations() {
  await executeSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'`);
  await executeSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false`);
  await executeSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_ip_ua_hash TEXT`);
  await executeSql(`ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS ip_ua_hash TEXT`);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      invite_code TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS user_organizations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      condition TEXT NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      badge_id INTEGER NOT NULL REFERENCES badges(id),
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS guest_ai_usage (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      usage_count INTEGER NOT NULL DEFAULT 0,
      last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  await executeSql(`ALTER TABLE guest_ai_usage ADD COLUMN IF NOT EXISTS ip_hash TEXT`);
  await executeSql(`ALTER TABLE guest_ai_usage ADD COLUMN IF NOT EXISTS ua_hash TEXT`);
  await executeSql(`CREATE INDEX IF NOT EXISTS guest_ai_usage_ip_ua_idx ON guest_ai_usage (ip_hash, ua_hash)`);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS franchise_inquiries (
      id SERIAL PRIMARY KEY,
      organization_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      expected_members INTEGER,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS gallery_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      project_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT[],
      likes_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executeSql(`
    CREATE TABLE IF NOT EXISTS gallery_likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      post_id INTEGER NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS gallery_likes_user_post_unique ON gallery_likes(user_id, post_id)`);

  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_org_unique ON user_organizations(user_id, organization_id)`);
  await executeSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badge_unique ON user_badges(user_id, badge_id)`);

  await executeSql(`UPDATE users SET role = 'member' WHERE role IS NULL OR role = ''`);

  await executeSql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check
          CHECK (role IN ('superadmin', 'admin', 'group_admin', 'member'));
      END IF;
    END $$
  `);

  console.log("Database migrations completed successfully");
}
