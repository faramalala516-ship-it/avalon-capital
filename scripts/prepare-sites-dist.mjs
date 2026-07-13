import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const requiredPaths = [".open-next/worker.js", ".open-next/assets", ".openai/hosting.json", "wrangler.jsonc"];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing required Sites build artifact: ${requiredPath}`);
  }
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync(".openai", "dist/.openai", { recursive: true });
writeFileSync(
  "dist/wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8").replaceAll(".open-next", "server/open-next")
);
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/client", { recursive: true });
cpSync(".open-next", "dist/server/open-next", { recursive: true });
rmSync("dist/server/open-next/assets", { recursive: true, force: true });
cpSync(".open-next/assets", "dist/client", { recursive: true });
writeFileSync(
  "dist/package.json",
  `${JSON.stringify({ type: "module" }, null, 2)}\n`
);
writeFileSync(
  "dist/server/index.js",
  `import worker from "./open-next/worker.js";

function createExecutionContext() {
  return {
    waitUntil() {},
    passThroughOnException() {}
  };
}

export default function handler(request, env = {}, ctx = createExecutionContext()) {
  return worker.fetch(request, env, ctx);
}

export { worker };
`
);

console.log("Prepared dist for Sites OpenNext deployment.");
