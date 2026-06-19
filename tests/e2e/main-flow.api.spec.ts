import { test, expect, request, APIRequestContext } from "@playwright/test";
import { randomBytes } from "crypto";

/**
 * 핵심 사용자 흐름 e2e 테스트
 *
 * 검증 시나리오:
 *  1. 신규 회원가입 → 자동 로그인 (세션 쿠키 발급)
 *  2. 로그인 후 발명 프로젝트 저장 (POST /api/invention-projects)
 *  3. 비즈니스 캔버스 저장 (POST /api/business-canvases)
 *  4. 보고서 3종 생성 엔드포인트가 인증 후 200 응답을 반환하는지 확인
 *     - POST /api/reports/saengbu
 *     - POST /api/reports/business-plan
 *     - POST /api/reports/competition
 *
 * 결정성: `X-E2E-Test: 1` 헤더(playwright.config.ts 의 extraHTTPHeaders)가 있을 때
 * 서버는 OpenAI 호출 대신 stub 텍스트를 반환합니다 (server/routes.ts 의 isE2eStub).
 * 이 게이트는 NODE_ENV !== "production" 에서만 동작하므로 운영 환경에는 영향이 없습니다.
 *
 * 실패 시 Playwright가 trace.zip / 응답 본문을 tests/e2e-artifacts 와
 * tests/e2e-report 로 남깁니다.
 */

interface AuthUser {
  id: number;
  username: string;
}

interface InventionProject {
  id: number;
  userId: number;
  title: string;
}

interface BusinessCanvas {
  id: number;
  userId: number;
  title: string;
}

interface SaengbuReport {
  text: string;
  wordCount: number;
}

interface BusinessPlanReport {
  text: string;
}

interface CompetitionReport {
  text: string;
  competition: string;
  competitionName: string;
}

const uniqueSuffix = () => randomBytes(4).toString("hex");

const inventionPayload = (suffix: string) => ({
  title: `e2e 발명 프로젝트 ${suffix}`,
  problem: "비 오는 날 우산을 들고 양손을 자유롭게 쓸 수 없다.",
  solution: "어깨에 걸 수 있는 핸즈프리 우산 하네스",
  target: "통학·통근하는 학생과 직장인",
  method: "경량 알루미늄 프레임과 조절형 어깨 밴드",
  level: "beginner",
  status: "draft",
});

const canvasPayload = (suffix: string) => ({
  title: `e2e 창업 아이템 ${suffix}`,
  valueProposition: "비 오는 날 손이 자유로워지는 우산 솔루션",
  customerSegments: "통학생, 자전거 통근자, 배달 라이더",
  channels: "온라인 스토어, 학교 협력 판매",
  customerRelationships: "체험단·SNS 후기 기반 커뮤니티",
  revenueStreams: "제품 판매 + 학교 단체 공급",
  keyResources: "디자인 특허, 경량 소재 공급망",
  keyActivities: "프로토타입 개량, 학교 시연",
  keyPartners: "지역 제조 업체, 학교 동아리",
  costStructure: "초기 금형 비용, 마케팅비",
  level: "beginner",
});

async function registerAndLogin(api: APIRequestContext, suffix: string) {
  const username = `e2e_${suffix}`;
  const password = "pw_test_1234";

  const res = await api.post("/api/register", {
    data: { username, password, displayName: `E2E 사용자 ${suffix}` },
  });
  expect(res.status(), `register status: ${await res.text().catch(() => "")}`).toBe(201);
  const user = (await res.json()) as AuthUser;
  expect(user.id).toBeGreaterThan(0);
  expect(user.username).toBe(username);

  const me = await api.get("/api/user");
  expect(me.status()).toBe(200);
  const meBody = (await me.json()) as AuthUser;
  expect(meBody.id).toBe(user.id);

  return { username, password, user };
}

test.describe("핵심 사용자 흐름", () => {
  // 실패 시 진단 로그 명시: API 컨텍스트 테스트라 페이지 스크린샷은 없지만
  // playwright.config.ts 의 trace=retain-on-failure 가 모든 request/response
  // (헤더·바디·status) 를 trace.zip 으로 보존합니다.
  // 보기: `npx playwright show-report tests/e2e-report` 또는
  //      `npx playwright show-trace tests/e2e-artifacts/<test>/trace.zip`
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      console.error(
        `[E2E FAIL] ${testInfo.title} — ${testInfo.status}. ` +
        `진단 자료: trace.zip 은 tests/e2e-artifacts/${testInfo.titlePath.join("-")}/ 에, ` +
        `HTML 리포트는 tests/e2e-report/index.html 에 있습니다.`
      );
    }
  });

  test("회원가입 → 발명/캔버스 저장 → 보고서 3종이 200을 반환한다", async () => {
    const suffix = uniqueSuffix();
    const api = await request.newContext({
      baseURL: process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || "5000"}`,
      extraHTTPHeaders: { "X-E2E-Test": "1" },
    });

    try {
      // 1) 회원가입 + 자동 로그인
      const { user } = await registerAndLogin(api, suffix);

      // 2) 발명 프로젝트 저장
      const inventionRes = await api.post("/api/invention-projects", {
        data: inventionPayload(suffix),
      });
      expect(
        inventionRes.status(),
        `invention create failed: ${await inventionRes.text().catch(() => "")}`,
      ).toBe(201);
      const invention = (await inventionRes.json()) as InventionProject;
      expect(invention.id).toBeGreaterThan(0);
      expect(invention.userId).toBe(user.id);

      const inventionList = await api.get("/api/invention-projects");
      expect(inventionList.status()).toBe(200);
      const inventionItems = (await inventionList.json()) as InventionProject[];
      expect(Array.isArray(inventionItems)).toBe(true);
      expect(inventionItems.some((p) => p.id === invention.id)).toBe(true);

      // 3) 비즈니스 캔버스 저장
      const canvasRes = await api.post("/api/business-canvases", {
        data: canvasPayload(suffix),
      });
      expect(
        canvasRes.status(),
        `canvas create failed: ${await canvasRes.text().catch(() => "")}`,
      ).toBe(201);
      const canvas = (await canvasRes.json()) as BusinessCanvas;
      expect(canvas.id).toBeGreaterThan(0);
      expect(canvas.userId).toBe(user.id);

      // 4) 보고서 3종 - 인증 후 200 응답 검증
      // 결정성을 위해 X-E2E-Test 헤더가 켜져 있어 server 가 stub 응답을 반환합니다.
      await test.step("POST /api/reports/saengbu (발명) → 200", async () => {
        const r = await api.post("/api/reports/saengbu", {
          data: {
            projectId: invention.id,
            projectType: "invention",
            wordCount: 500,
          },
        });
        expect(
          r.status(),
          `saengbu failed: ${await r.text().catch(() => "")}`,
        ).toBe(200);
        const body = (await r.json()) as SaengbuReport;
        expect(typeof body.text).toBe("string");
        expect(body.text.length).toBeGreaterThan(0);
        expect(body.wordCount).toBe(500);
      });

      await test.step("POST /api/reports/business-plan → 200", async () => {
        const r = await api.post("/api/reports/business-plan", {
          data: { canvasId: canvas.id },
        });
        expect(
          r.status(),
          `business-plan failed: ${await r.text().catch(() => "")}`,
        ).toBe(200);
        const body = (await r.json()) as BusinessPlanReport;
        expect(typeof body.text).toBe("string");
        expect(body.text.length).toBeGreaterThan(0);
      });

      await test.step("POST /api/reports/competition (발명) → 200", async () => {
        const r = await api.post("/api/reports/competition", {
          data: {
            projectId: invention.id,
            projectType: "invention",
            competition: "student_invention",
          },
        });
        expect(
          r.status(),
          `competition failed: ${await r.text().catch(() => "")}`,
        ).toBe(200);
        const body = (await r.json()) as CompetitionReport;
        expect(typeof body.text).toBe("string");
        expect(body.text.length).toBeGreaterThan(0);
        expect(body.competitionName).toBe("대한민국학생발명전시회");
        expect(body.competition).toBe("student_invention");
      });
    } finally {
      await api.dispose();
    }
  });

  test("미인증 상태에서 보고서 엔드포인트는 401을 반환한다", async () => {
    const api = await request.newContext({
      baseURL: process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || "5000"}`,
      extraHTTPHeaders: { "X-E2E-Test": "1" },
    });
    try {
      const endpoints: Array<[string, Record<string, unknown>]> = [
        ["/api/reports/saengbu", { projectId: 1, projectType: "invention" }],
        ["/api/reports/business-plan", { canvasId: 1 }],
        ["/api/reports/competition", { projectId: 1, projectType: "invention" }],
      ];
      for (const [path, data] of endpoints) {
        const r = await api.post(path, { data });
        expect(r.status(), `${path} should require auth`).toBe(401);
      }
    } finally {
      await api.dispose();
    }
  });
});
