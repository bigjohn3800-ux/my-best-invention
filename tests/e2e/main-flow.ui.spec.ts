import { test, expect } from "@playwright/test";
import { randomBytes } from "crypto";

/**
 * 핵심 사용자 흐름 - UI 브라우저 스모크
 *
 * API 테스트(main-flow.api.spec.ts)는 백엔드 흐름을 검증하지만, 실제 사용자가
 * 보는 화면이 회원가입 페이지에서 실제로 렌더링되는지, 보호 라우트 동작이
 * 살아있는지는 잡지 못합니다. 이 스펙은 chromium 으로 최소한의 페이지 동작을
 * 검증하고, 실패 시 Playwright 가 자동으로 페이지 스크린샷·비디오·trace 를
 * tests/e2e-artifacts/ 와 tests/e2e-report/index.html 로 남깁니다.
 *
 * 실행 전 chromium 설치 필요: `npx playwright install chromium`
 * (Replit 환경의 경우 시스템 라이브러리도 필요. replit.md 참고)
 */

test.describe("UI 스모크", () => {
  test("/auth 회원가입 폼 → 가입 → 홈으로 이동한다", async ({ page }) => {
    const suffix = randomBytes(4).toString("hex");
    const username = `e2e_ui_${suffix}`;
    const password = "pw_test_1234";

    await page.goto("/auth");
    await expect(page.getByTestId("text-auth-title")).toBeVisible();

    // 로그인 화면 → 회원가입 토글
    await page.getByTestId("button-toggle-auth").click();
    await expect(page.getByTestId("text-auth-title")).toHaveText("회원가입");

    await page.getByTestId("input-register-username").fill(username);
    await page.getByTestId("input-register-displayname").fill(`UI ${suffix}`);
    await page.getByTestId("input-register-password").fill(password);
    await page.getByTestId("input-age-confirm").check();
    await page.getByTestId("input-terms-agree").check();

    const registerButton = page.getByTestId("button-register");
    await expect(registerButton).toBeEnabled();
    await registerButton.click();

    // 가입 직후 /auth 의 user 가드가 작동해 / 로 이동
    await page.waitForURL("/", { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("미인증 사용자가 /api/reports/saengbu 호출 시 401 을 받는다 (브라우저 컨텍스트)", async ({ page }) => {
    // 새 페이지(쿠키 없음)에서 fetch 호출
    await page.goto("/auth");
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/reports/saengbu", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-E2E-Test": "1" },
        body: JSON.stringify({ projectId: 1, projectType: "invention" }),
        credentials: "include",
      });
      return res.status;
    });
    expect(status).toBe(401);
  });
});
