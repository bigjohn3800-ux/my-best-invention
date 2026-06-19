import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "5000";
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/e2e-report" }]],
  outputDir: "tests/e2e-artifacts",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Replit 환경에서는 보통 워크플로 'Start application' 으로 dev 서버가 이미 떠 있습니다.
  // CI/로컬에서 서버가 없을 때만 자동 기동하도록 reuseExistingServer=true 로 설정.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
        stdout: "ignore",
        stderr: "pipe",
      },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: { "X-E2E-Test": "1" },
  },
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
    },
    {
      name: "ui",
      testMatch: /.*\.ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
        extraHTTPHeaders: { "X-E2E-Test": "1" },
      },
    },
  ],
});
