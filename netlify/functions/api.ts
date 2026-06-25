// 임시 스텁 — 서버리스 백엔드 이전(Replit 탈출) 전까지 비활성 상태.
// 이유: 실제 Express 래퍼(serverless-http + 서버 전체 import)를 여기 두면
//       Netlify가 함수 번들링을 시도하다 빌드가 깨질 수 있어, 이전 검증 전까지 스텁으로 둔다.
// 실제 구현은 전략분석/Replit탈출_Netlify이전_계획.md 참고하여 이전 시점에 복원한다.
// 현재 /api/* 라우팅은 netlify.toml 에서 Replit 백엔드로 프록시된다(이 함수는 사용되지 않음).
import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => ({
  statusCode: 503,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message: "serverless backend not yet enabled" }),
});
