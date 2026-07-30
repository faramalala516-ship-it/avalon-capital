import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const appHtmlDir = ".next/server/app";
const staticDir = ".next/static";
const publicDir = "public";
const requiredPaths = [join(appHtmlDir, "index.html"), staticDir, ".openai/hosting.json"];

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing required Sites build artifact: ${requiredPath}`);
  }
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/client/_next", { recursive: true });

cpSync(".openai", "dist/.openai", { recursive: true });
cpSync(staticDir, "dist/client/_next/static", { recursive: true });

if (existsSync(publicDir)) {
  cpSync(publicDir, "dist/client", { recursive: true });
}

const pages = {};

for (const entry of readdirSync(appHtmlDir)) {
  const filePath = join(appHtmlDir, entry);
  if (!statSync(filePath).isFile() || extname(filePath) !== ".html") {
    continue;
  }

  const pageName = basename(entry, ".html");
  const route = pageName === "index" ? "/" : `/${pageName}`;
  const pageHtml = readFileSync(filePath, "utf8");
  const staticPageDir = route === "/" ? "dist/client" : join("dist/client", pageName);
  pages[route] = pageHtml;
  mkdirSync(staticPageDir, { recursive: true });
  writeFileSync(join(staticPageDir, "index.html"), pageHtml);
}

const serverSource = `const pages = ${JSON.stringify(pages)};

const formats = [
  { id: "editorial-a4", label: "Editorial A4", priceMultiplier: 1 },
  { id: "expo-grand", label: "Exposition grand format", priceMultiplier: 1.85 },
  { id: "tableau-fineart", label: "Tableau Fine Art", priceMultiplier: 2.4 },
  { id: "livre-double", label: "Double page livre", priceMultiplier: 2.1 }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function conciergeReply(question = "") {
  return "Concierge Gem'StonEye — gemmologie et photographie.\\n\\nPour « " + question +
    " » : explorez la collection du mois, choisissez un format licencié, réglez par virement SEPA/SWIFT, puis recevez certificat blockchain et QR. La salle des enchères est réservée aux abonnés Salon Privé.";
}

function certificate(body) {
  const issuedAt = new Date().toISOString();
  const certificateId = "GSES-" + Math.random().toString(16).slice(2, 10).toUpperCase();
  const txHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return {
    certificateId,
    photoId: body.photoId,
    photoTitle: body.photoTitle,
    ownerEmail: body.ownerEmail,
    ownerName: body.ownerName,
    formatId: body.formatId,
    amountEur: body.amountEur,
    issuedAt,
    chain: "GSES-Ledger",
    txHash,
    previousHash: "genesis",
    qrPayload: JSON.stringify({ certificateId, txHash, owner: body.ownerEmail }),
    verificationUrl: "https://www.gemstoneyeshootingallery.com/certificat/" + certificateId
  };
}

async function handleApi(path, request, env = {}) {
  if (path === "/api/health" && request.method === "GET") {
    return json({
      status: "ok",
      service: "gemstoneyeshootingallery",
      domain: "www.gemstoneyeshootingallery.com",
      timestamp: new Date().toISOString(),
      openai: Boolean(env.OPENAI_API_KEY) ? "configured" : "fallback_ready"
    });
  }

  if (path === "/api/gallery" && request.method === "GET") {
    return json({ formats, payment: { method: "international_bank_transfer" } });
  }

  if (path === "/api/auctions" && request.method === "GET") {
    return json({ lots: [], note: "Acces abonnes Salon Prive" });
  }

  if (path === "/api/concierge" && request.method === "GET") {
    return json({ service: "gses-concierge", status: Boolean(env.OPENAI_API_KEY) ? "openai_ready" : "local_fallback" });
  }

  if (path === "/api/concierge" && request.method === "POST") {
    const body = await parseJson(request);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (question.length < 2) return json({ error: "Question invalide" }, 400);
    return json({ answer: conciergeReply(question), source: "local-fallback", providerStatus: "openai_not_configured" });
  }

  if (path === "/api/certificate" && request.method === "POST") {
    const body = await parseJson(request);
    if (!body.photoId || !body.ownerEmail) return json({ error: "Donnees invalides" }, 400);
    return json(certificate(body));
  }

  return json({ error: "Not found" }, 404);
}

async function fetchHandler(request, env = {}) {
  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\\/$/, "") || "/";

  if (cleanPath.startsWith("/api/")) {
    return handleApi(cleanPath, request, env);
  }

  if (request.method === "GET" && pages[cleanPath]) {
    return html(pages[cleanPath]);
  }

  if (request.method === "GET" && cleanPath === "/_not-found") {
    return html(pages["/_not-found"] ?? "Not found", 404);
  }

  return html(pages["/_not-found"] ?? "Not found", 404);
}

export default {
  fetch: fetchHandler
};

export { fetchHandler as fetch };
`;

writeFileSync("dist/package.json", `${JSON.stringify({ type: "module" }, null, 2)}\n`);
writeFileSync("dist/server/index.js", serverSource);

console.log("Prepared dist for Gem'StonEye'Shootin'Gallery Sites.");
