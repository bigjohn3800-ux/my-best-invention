// 서버리스(Netlify Functions)용 Express 앱 빌더.
// 기존 server/index.ts(Replit/로컬용)는 그대로 두고, 이 파일이 서버리스 경로를 담당.
// 정적 파일은 Netlify가 직접 서빙하므로 여기서는 API 라우트만 처리한다.
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

let appPromise: Promise<express.Express> | null = null;

export function getServerlessApp(): Promise<express.Express> {
  if (appPromise) return appPromise;
  appPromise = (async () => {
    const app = express();
    const httpServer = createServer(app);

    app.use(
      express.json({
        verify: (req, _res, buf) => {
          (req as Request & { rawBody?: unknown }).rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    // 인증(setupAuth) + 모든 API/공유 라우트 등록
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      if (res.headersSent) return next(err);
      res.status(status).json({ message: err.message || "Internal Server Error" });
    });

    return app;
  })();
  return appPromise;
}
