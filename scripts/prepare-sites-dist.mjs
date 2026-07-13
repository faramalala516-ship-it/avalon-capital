import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const requiredPaths = [".open-next/worker.js", ".open-next/assets", ".openai/hosting.json", "wrangler.jsonc"];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing required Sites build artifact: ${requiredPath}`);
  }
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync(".open-next", "dist/.open-next", { recursive: true });
cpSync(".openai", "dist/.openai", { recursive: true });
cpSync("wrangler.jsonc", "dist/wrangler.jsonc");
mkdirSync("dist/server", { recursive: true });
writeFileSync(
  "dist/package.json",
  `${JSON.stringify({ type: "module" }, null, 2)}\n`
);
writeFileSync(
  "dist/server/index.js",
  `import worker from "../.open-next/worker.js";

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
