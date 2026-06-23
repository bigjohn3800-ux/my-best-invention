# CLAUDE.md — 마이베스트 발명창업 (Invention Ventures Hub)

> 이 파일은 Claude가 이 프로젝트를 빠르게 이해하고 **이어서 업데이트 작업**을 하기 위한 가이드입니다.
> 상세한 기능/라우트/DB/AI 프롬프트 명세는 같은 폴더의 `replit.md`에 모두 정리돼 있으니 함께 참고하세요.

## 0. 한 줄 요약
**17. 모두의 창업, 발명** — AI시대 자신의 도메인(특징, 캐릭터 등)을 기반으로 발명과 창업을 실천하며, 시대정신인 주도성을 더 키우는 깊은 학습 프로그램. AI 발명도구(SCAMPER/TRIZ/특허초안), 창업도구(BMC/IR 피칭덱), 창의성·창업 진단, 학교 제출용 보고서 자동생성(생기부·자유학기·정부지원사업)을 제공.
- 운영 배포: https://my-inventors.replit.app
- 소유자: 동완 (오늘과내일의학교 회장)

## 1. 기술 스택
- **프론트엔드**: React 18 + Vite 7 + TailwindCSS + shadcn/ui + Framer Motion + Recharts + wouter(라우팅)
- **백엔드**: Express 5 + PostgreSQL + Drizzle ORM
- **AI**: OpenAI (gpt-4o / gpt-4o-mini, SSE 스트리밍)
- **인증**: Passport.js local + 세션
- **결제(예정)**: 토스페이먼츠
- **DB 호스팅**: Supabase (Postgres)

## 2. 폴더 구조
```
Invention-Ventures-Hub/
├── client/               # 프론트엔드 (React)
│   └── src/
│       ├── pages/        # 화면 단위 (home, invention-studio, startup-lab, diagnosis, admin 등 20개)
│       ├── components/   # 재사용 UI + shadcn/ui
│       ├── hooks/        # use-kid-tts 등 커스텀 훅
│       └── lib/          # report-match 등 유틸
├── server/               # 백엔드 (Express)
│   ├── index.ts          # 서버 진입점
│   ├── routes.ts         # 모든 API 라우트 + AI SSE 엔드포인트
│   ├── auth.ts           # Passport 인증
│   ├── db.ts             # Drizzle + pg 풀 (DATABASE_URL 필요)
│   ├── storage.ts        # DB 접근 레이어
│   └── seed.ts           # 코스/뱃지 시드
├── shared/               # 프론트/백 공용 (Drizzle 스키마 = DB 테이블 정의)
├── supabase/             # Supabase 설정/마이그레이션
├── tests/                # Playwright e2e (api + ui)
├── docs/                 # 사업화/배포 문서
├── attached_assets/      # 이미지 등 첨부 리소스
├── .env                  # 환경변수 (git 제외, 로컬 비밀값)
├── replit.md             # ★ 상세 기능 명세 (필독)
└── CLAUDE.md             # 이 파일
```

## 3. 로컬 실행
```bash
npm install          # 최초 1회 (node_modules 이미 포함됨)
npm run dev          # 개발 서버 (Express+Vite, http://localhost:5000)
npm run build        # 프로덕션 빌드 (dist/)
npm start            # 빌드 결과 실행
npm run check        # 타입체크 (tsc)
npm run db:push      # Drizzle 스키마를 DB에 반영
npx playwright test --project=api   # API 스모크 테스트 (~2초)
```
> 서버는 부팅 시 `DATABASE_URL`이 **반드시** 필요합니다(`server/db.ts`에서 없으면 throw).
> Supabase → Project Settings → Database → Connection string 값을 `.env`의 `DATABASE_URL`에 채우세요.

## 4. 환경변수 (.env)
`.env`는 git에 올라가지 않습니다(.gitignore 처리됨). 키 목록과 설명은 `.env` 파일 주석 참고.
| 키 | 용도 | 현재 |
|---|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase 연결 | ✅ 입력됨 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 프론트 Supabase | ✅ 입력됨 |
| `DATABASE_URL` | Postgres 연결(서버 부팅 필수) | ⬜ 비움 — Supabase에서 복사 필요 |
| `SESSION_SECRET` | 세션 암호화 | ⚠️ 임시값 — 운영 전 랜덤 문자열로 교체 |
| `AI_INTEGRATIONS_OPENAI_API_KEY` / `_BASE_URL` | AI 기능 | ⬜ 비움 — AI 쓰려면 필요 |
| `TOSS_*` / `VITE_TOSS_CLIENT_KEY` / `APP_ORIGIN` | 결제 | ⬜ 운영 활성화 전 추가 |

## 5. Claude와 업데이트 작업하는 방법 (워크플로)
1. **요청**: 동완이 "○○ 화면 이렇게 바꿔줘 / ○○ 기능 추가해줘"라고 말함
2. **파악**: Claude가 `replit.md` + 관련 `client/src/pages/*` 또는 `server/routes.ts` 확인
3. **수정**: 해당 파일 편집 (Edit/Write)
4. **검증**: `npm run check`(타입) → 필요시 `npx playwright test --project=api`
5. **기록**: 의미 있는 단위로 git 커밋 (아래 6번 참고)
6. **배포**: 검증 후 Replit 재배포 또는 Vercel 배포

### 주요 화면 ↔ 파일 매핑 (빠른 참조)
| 화면 | 파일 |
|---|---|
| 홈 | `client/src/pages/home-page.tsx` |
| AI 발명도구 | `client/src/pages/invention-studio-page.tsx` |
| AI 창업도구 | `client/src/pages/startup-lab-page.tsx` |
| 진단 | `client/src/pages/diagnosis-page.tsx` |
| 내 아이디어 노트 | `client/src/pages/idea-notes-page.tsx` |
| 관리자 | `client/src/pages/admin-page.tsx` |
| 모든 API/AI | `server/routes.ts` |
| DB 테이블 정의 | `shared/` (Drizzle 스키마) |

## 6. 버전관리 & 배포 (중요)
- git 초기화 + GitHub 푸시는 **`setup-git-github.ps1`** (작업폴더 루트) 스크립트로 1회 실행 → 이후 동완 컴퓨터에서 git 사용.
- 일상 커밋: `git add -A && git commit -m "설명"` → `git push`
- 비밀값(.env, 키)은 **절대 커밋 금지**. (.gitignore에 이미 설정됨)
- 배포 선택지: ① 기존 Replit 재배포(현 URL 유지) ② Vercel (`vercel.json` 있음, `scripts/deploy-vercel.ps1` 참고)

## 7. 주의사항
- **비밀값 노출 금지**: `.env`, Supabase service_role 키, 토스 secret 키는 코드/커밋/채팅에 넣지 않는다.
- DB 스키마 변경 시 `shared/` 수정 → `npm run db:push`로 반영.
- 초등 모드(`.kid-mode`)·TTS·보고서 추천 등 세밀한 동작은 `replit.md`에 상세 기술됨 — 건드리기 전 반드시 확인.
- 기존 협업처(꿈구두/가르침에듀)는 현재 무관. 현재 운영 주체는 동완/오늘과내일의학교·가르치는사람들.

## 8. 자율 진행 규칙 (Autonomous Operation)
> 목적: 동완의 매 단계 확인 없이도, **방향과 내용이 맞는지 스스로 검열하며** 진행한다.

### 8-1. 제품 방향 (모든 작업의 기준)
현재 우선순위는 ① **유입(신규 사용자 획득)** ② **콘텐츠 사용 만족도** ③ **안정적 운영** 이다.
유료 결제는 코드로 준비돼 있으나 지금은 **보류**(나중에 켠다). 새 작업은 ①②③ 중 하나에 기여해야 하며, 아니면 멈추고 묻는다.

### 8-2. 스스로 검열 체크리스트 (작업 전·후)
1. **방향 정합성**: 이 작업이 유입·만족도·운영 중 무엇에 기여하나? 불명확하면 중단.
2. **사실 확인**: 코드·수치·주장은 추측 금지. 실제 파일(Read)·실행·웹검색으로 확인.
3. **패턴 일관성**: 기존 구조 따른다 — Drizzle 스키마, `req.isAuthenticated()` 라우트, wouter 라우팅, 디자인 토큰(glass-card·gradient·네온).
4. **검증 필수**: 변경 후 `npm run check`(타입체크) 통과 + 핵심 동작 확인. 통과 못 하면 '완료'로 표시하지 않는다.
5. **비밀값/안전**: 비밀값 노출·하드코딩 금지.

### 8-3. 확인 없이 진행 (GREEN — 자율)
코드 작성·수정·리팩터, 새 기능 구현, 문서·기획 작성, 로컬 검증(타입체크/테스트), 분석·조사, 디자인·카피 개선, 의미 단위 정리.

### 8-4. 반드시 동완 확인 (STOP & ASK — 자율 금지)
- 실서비스 **배포/Republish** (라이브 사용자 영향)
- 결제 **실키 전환**, 금전 거래·환불
- 저장소 **공개/권한 변경**, 비밀번호·토큰 입력
- 데이터 **삭제**, 외부로 **메시지/게시물 발행**
- 큰 비용이 드는 작업

### 8-5. 환경 제약 (반드시 기억)
- 작업 폴더는 Windows 동기화 폴더 → **샌드박스에서 git/파일삭제 불가**. git·GitHub은 Windows용 `.bat`로 처리.
- 셸 마운트가 **편집한 파일을 지연 캐싱** → 셸 타입체크가 거짓 오류를 낼 수 있음. **실제 파일은 Read 도구 기준이 정답**.
- 파일 편집 시 끝에 **널바이트**가 붙는 경우가 있음 → 빌드 전 점검.
- **Replit 배포**: 워크스페이스 git은 이 GitHub repo와 직접 연결 안 됨(자체 backup/subrepl remote만). 비공개라 fetch에 인증 필요 → 코드 반영은 동완의 클릭/셸 입력이 필요(STOP & ASK).

### 8-6. 작업 기록
의미 있는 단위로 git 커밋(`.bat`), 큰 결정·전략은 `전략분석/` 폴더 문서에 남긴다.
