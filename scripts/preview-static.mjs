import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/public");
const port = Number(process.env.PORT || 5173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".mp4", "video/mp4"],
  [".ico", "image/x-icon"],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  const full = path.resolve(root, normalized);
  return full.startsWith(root) ? full : path.join(root, "index.html");
}

const server = http.createServer(async (req, res) => {
  const requested = safePath(req.url || "/");
  let filePath = requested;

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    filePath = path.join(root, "index.html");
  }

  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types.get(path.extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`static preview ready: http://127.0.0.1:${port}`);
});
