// Netlify Function: Express 백엔드를 서버리스로 실행 (Replit 대체)
// netlify.toml 에서 /api/* 를 이 함수로 라우팅한다. (테스트 검증 후 전환)
// 주의: AI SSE 스트리밍 엔드포인트(/api/ai/*)는 일반 함수에서 스트리밍이 안 되므로,
//       전환 1단계에서는 /api/ai/* 만 Replit으로 두고(아래 netlify.toml 참고),
//       나머지(/api/*)를 이 함수로 옮긴다. (2단계에서 AI를 Netlify 스트리밍 함수로 이전)
import serverless from "serverless-http";
import type { Handler } from "@netlify/functions";
import { getServerlessApp } from "../../server/serverless-app";

// 콜드스타트 시 1회만 마이그레이션/시드 실행
let migrated = false;
async function ensureMigrated() {
  if (migrated) return;
  try {
    const { runMigrations } = await import("../../server/migrate");
    await runMigrations();
    const { seedDatabase } = await import("../../server/seed");
    await seedDatabase();
  } catch (e) {
    console.error("[netlify] migrate/seed failed:", e);
  }
  migrated = true;
}

let cached: ReturnType<typeof serverless> | null = null;

export const handler: Handler = async (event, context) => {
  await ensureMigrated();
  if (!cached) {
    const app = await getServerlessApp();
    cached = serverless(app);
  }
  return cached(event, context) as ReturnType<Handler>;
};
