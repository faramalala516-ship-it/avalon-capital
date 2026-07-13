import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

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

console.log("Prepared dist for Sites OpenNext deployment.");
