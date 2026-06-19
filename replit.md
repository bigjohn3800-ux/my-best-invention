# 마이베스트 발명창업

## Overview
Korean education platform for invention and entrepreneurship (elementary through college students). Features AI-powered tools for invention methodology (SCAMPER/TRIZ), business model design (BMC), and diagnostic assessments.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Framer Motion + Recharts
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-4o model, SSE streaming)
- **Auth**: Passport.js local strategy with session-based authentication

## Design System
- Dark mode by default (deep dark #0a0a1a background)
- Glassmorphism cards (semi-transparent + backdrop-blur)
- Neon accent colors: Cyan #00D1FF (primary), Purple #7000FF (secondary)
- CSS utility classes: `.glass-card`, `.glass-nav`, `.neon-glow`, `.gradient-primary`, `.gradient-text`, `.grid-bg`

## Navigation Structure
- **발명스튜디오** (dropdown): AI 발명도구 → /invention-studio, 발명 과정 → /invention, 영감의 전당 → /inspiration, 창의성 진단 → /diagnosis?type=creativity
- **창업랩** (dropdown): AI 창업도구 → /startup-lab, 창업 과정 → /startup, AI 창업 사례 → /inspiration?tab=startup, 창업 진단 → /diagnosis?type=startup
- **My Idea** (direct link): → /idea-notes
- Desktop: hover-activated glass dropdowns; Mobile: accordion expand/collapse

## Key Pages & Routes
- `/` - Home page (hero, AI trial widget, AI tools intro, roadmap, books, CTA sections, family sites)
- `/auth` - Login/Register
- `/invention-studio` - AI Invention Studio (SCAMPER/TRIZ/Patent draft, 6-step flow, guests get 2 free AI calls, `?projectId=X` for edit mode)
- `/startup-lab` - AI Startup Lab (BMC 9-cell editor + IR pitch deck, guests get 2 free AI calls, `?canvasId=X` for edit mode)
- `/diagnosis` - Diagnostic Solution (creativity/startup index tests + radar charts, guests get 2 free AI calls, `?type=creativity` or `?type=startup` for direct access)
- `/inspiration` - Inspiration Hall (학생 발명가 + AI 창업 성공 사례, 나도 할 수 있다 CTA)
- `/idea-notes` - My Idea Notes (saved projects/canvases/diagnostics portfolio + PDF export)
- `/invention` - Invention track course list
- `/startup` - Startup track course list
- `/course/:id` - Course detail page
- `/dashboard` - User dashboard (requires login, certificate downloads for completed courses)
- `/franchise` - B2B franchise/group enrollment page (benefits + inquiry form)
- `/guide` - Platform usage manual (feature-by-feature guide with step-by-step instructions)
- `/admin` - Admin dashboard (superadmin only: user management, role changes, stats, franchise inquiries)
- `/admin/members` - Member management (superadmin + admin: search, view members)
- `/admin/group` - Group/Organization management (group_admin+: create org, invite code, member list)

## Audience-Adaptive UI
- The 5-step audience system (`elementary` / `middle` / `high` / `university` / `general`) drives both AI prompt tone and UI density.
- When `level === "elementary"`, `invention-studio-page` and `startup-lab-page` apply a `.kid-mode` wrapper class defined in `client/src/index.css`. This bumps the in-page font scale (~1.18×), enlarges textareas/inputs/paddings, rounds corners, and shows a friendly yellow `.kid-banner` at the top.
- `startup-lab-page` additionally swaps BMC cell labels/descriptions/placeholders for a kid-friendly emoji dictionary (`KID_BMC` map) — e.g. "핵심 파트너" → "🤝 도와주는 친구", "예) 엄마, 분식집 사장님".
- `invention-studio-page` swaps the per-step headings, helper text, and example placeholders for shorter, friendlier copy when in elementary mode.
- Elementary mode also adds Korean text-to-speech (🔊) buttons next to step headings/BMC cell labels, plus two pill buttons on AI result blocks (SCAMPER/TRIZ/특허/IR 피칭덱): "처음부터 읽기" reads the whole response, and "한 글자씩 듣기" reads it one syllable at a time and shows the currently-spoken character so very young learners can follow along. The TTS hook (`client/src/hooks/use-kid-tts.ts`) wraps `window.speechSynthesis` with `ko-KR`, listens to `voiceschanged` to pick a Korean voice when it loads late, never autoplays, and exposes both `toggle` and `toggleByCharacter` methods. The shared `KidTtsButton` component (`client/src/components/kid-tts-button.tsx`) takes a `mode="full" | "char"` prop. All buttons are scoped under `.kid-mode` and gated by `isKid`, so other audience levels never see them.
- All other audience levels render the original UI unchanged — the kid styles are scoped under `.kid-mode` and the page wrappers only add the class for elementary.
- **Audience-aware report recommendation**: `client/src/lib/report-match.ts` defines per-report target audiences (e.g. `freesemester`→middle, `saengbu`→high, `business-plan`→university/general). Both `invention-studio-page` (step 6 patent area) and `startup-lab-page` (맞춤 보고서 변환) sort the download buttons so the user's school-grade-appropriate report comes first, add a "★추천" badge + cyan ring on matching templates, dim non-matching ones with `opacity-60`, and surface a one-line recommendation summary text (`text-report-recommendation` / `text-report-recommendation-startup`).

## AI Prompt Strategy
- **Invention (SCAMPER/TRIZ/Patent)**: Patent 3 elements (신규성/진보성/산업상 이용가능성) as evaluation criteria
- **Startup (BMC/Pitch)**: Revenue model and target customer analysis emphasized, TAM/SAM/SOM, unit economics
- **Diagnosis**: Professional-level analysis with actionable feedback and learning resources

## Database Tables
- `users` - Authentication + profile + role (superadmin/admin/group_admin/member)
- `organizations` - Group/organization with invite codes
- `user_organizations` - Many-to-many user↔organization membership
- `badges` - Achievement badge definitions (10 types)
- `user_badges` - User badge awards with timestamps
- `guest_ai_usage` - Guest AI usage tracking (session-based, 2-call limit)
- `courses` - Course content with steps (jsonb)
- `user_progress` - Learning progress tracking
- `ai_ideas` - Legacy AI analysis records
- `invention_projects` - SCAMPER/TRIZ/patent draft projects
- `business_canvases` - BMC data + pitch deck
- `diagnostic_results` - Test answers + scores + AI analysis
- `franchise_inquiries` - B2B franchise enrollment requests (org name, contact, phone, email, expected members, message, status)

## Role System
- `superadmin` - Full system access, can change any user's role
- `admin` - Member management, stats viewing
- `group_admin` - Organization management, member viewing within own groups
- `member` - Default role for new registrations, access to all learning features
- Guest (unauthenticated) - Can use AI tools up to 2 times, then prompted to register

## Badge System
- 10 badges seeded: first_invention, first_bmc, first_diagnosis, first_course, inventor_5, entrepreneur_5, patent_writer, pitch_master, all_courses_invention, all_courses_startup
- Badge awarding triggers: invention save, BMC save, diagnostic save, course completion
- Badge toast + confetti animation on first earn via `canvas-confetti`
- Dashboard shows all badges with earned (colored) / unearned (greyed out) states

## API Endpoints
- Auth: `/api/register`, `/api/login`, `/api/logout`, `/api/user`
- Courses: `GET /api/courses`, `GET /api/courses/:id`
- Progress: `GET /api/progress`, `POST /api/progress` (awards first_course badge on completion)
- Dashboard: `GET /api/dashboard/stats` (inventionCount + canvasCount + diagnosticCount)
- Level: `PATCH /api/user/level` (update user's default level)
- Badges: `GET /api/user/badges` (all badges with earned status)
- Invention: `GET/POST/PATCH /api/invention-projects` (POST awards first_invention badge)
- BMC: `GET/POST/PATCH /api/business-canvases` (POST awards first_bmc badge)
- Diagnostics: `GET/POST /api/diagnostic-results` (POST awards first_diagnosis badge)
- AI (SSE streaming): `/api/ai/scamper`, `/api/ai/triz`, `/api/ai/patent-draft`, `/api/ai/bmc-assist`, `/api/ai/pitch-deck`, `/api/ai/diagnostic-analysis`, `/api/ai/followup`
- Reports: `POST /api/reports/saengbu` (고등 생기부 500/1500자), `POST /api/reports/business-plan` (정부지원사업 K-Startup 양식), `POST /api/reports/competition` (대회 출품), `POST /api/reports/freesemester` (중학교 자유학기 활동지: 주제선정→탐구과정→느낀점→진로 연계 4섹션, gpt-4o-mini)
- 자유학기 활동지는 텍스트(.txt) 다운로드와 더불어 학교 양식 헤더(학교명·학기·학년/반/번호·성명·활동 주제·작성일)가 포함된 PDF 다운로드를 지원한다. 공용 컴포넌트 `client/src/components/freesemester-pdf-button.tsx`가 모달에서 학생 정보를 받아 jsPDF + html2canvas로 A4 레이아웃을 렌더링하며, 발명 스튜디오(`button-download-freesemester-pdf`)와 창업랩(`button-download-freesemester-pdf-startup`) 양쪽에 연결되어 있다.
- Admin: `GET /api/admin/users`, `PATCH /api/admin/users/:id/role`, `PATCH /api/admin/users/:id/block`, `GET /api/admin/stats`
- Organizations: `GET /api/organizations`, `POST /api/organizations`, `POST /api/organizations/join`, `GET /api/organizations/:id/members`

## Environment
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption
- `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI via Replit integrations

## Dev Commands
- `npm run dev` - Start dev server (Express + Vite on port 5000)
- `npm run db:push` - Sync Drizzle schema to DB
- `npx playwright test` - Run all e2e suites (api + ui)
- `npx playwright test --project=api` - API-only smoke (~2s, no browser, no OpenAI calls)
- `npx playwright test --project=ui` - Browser UI smoke via chromium (~6s, requires `npx playwright install chromium` + system libs first)
- All e2e suites need the dev server on port 5000 (or set `E2E_BASE_URL`). Failure artifacts: `tests/e2e-artifacts/` (trace.zip + screenshots + video on `ui` project), HTML report: `tests/e2e-report/index.html`. Determinism: `X-E2E-Test: 1` header is sent automatically; server returns canned report text in non-production. Production (`NODE_ENV=production`) ignores the header.

## Tests
- `tests/e2e/main-flow.api.spec.ts` - Playwright API smoke covering register → invention save → canvas save → `/api/reports/{saengbu,business-plan,competition}` 200 검증 + 미인증 401 회귀. Server-side stub gate lives in `server/routes.ts::isE2eStub`.
- `tests/e2e/main-flow.ui.spec.ts` - Playwright chromium UI smoke covering /auth 회원가입 폼 입력→ 홈 이동 + 미인증 보고서 호출 401 (브라우저 fetch). 실패 시 페이지 스크린샷·비디오 자동 보존.

### Browser dependencies (one-time per environment)
For the `ui` Playwright project, chromium binaries + Nix system libraries are required:
- Install browser: `npx playwright install chromium`
- Required nix packages (already configured): glib, nss, nspr, atk, at-spi2-atk, cups, libdrm, libxkbcommon, mesa, expat, alsa-lib, dbus, pango, cairo, gtk3, fontconfig, freetype, and several `xorg.*` libs (libX11, libxcb, libXcomposite, libXdamage, libXext, libXfixes, libXrandr, libXcursor, libXi, libXrender, libxshmfence, libXScrnSaver, libXtst).
