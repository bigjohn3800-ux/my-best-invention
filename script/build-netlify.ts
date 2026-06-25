import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildNetlify() {
  process.env.NODE_ENV = "production";
  await rm("dist/public", { recursive: true, force: true });
  await viteBuild({ configLoader: "runner" } as Parameters<typeof viteBuild>[0]);
}

buildNetlify().catch((err) => {
  console.error(err);
  process.exit(1);
});
