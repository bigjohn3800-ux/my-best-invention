import type { Request } from "express";
import { createHash } from "crypto";

export function computeIpUaHash(req: Request): string {
  const ipRaw = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    || req.ip
    || req.socket?.remoteAddress
    || "";
  const ua = (req.headers["user-agent"] as string | undefined) || "";
  return createHash("sha256").update(`${ipRaw}|${ua}`).digest("hex").slice(0, 32);
}
