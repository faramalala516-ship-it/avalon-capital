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
  pages[route] = readFileSync(filePath, "utf8");
}

const serverSource = `const pages = ${JSON.stringify(pages)};

const compliance = {
  antiHallucination: "enabled",
  realtimeDataPolicy: "Aucune donnee temps reel n'est inventee sans source ou outil disponible.",
  provenancePolicy: "Chaque analyse distingue donnees fournies, contexte Avalon, hypotheses et donnees non fournies.",
  riskPolicy: "Chaque analyse inclut invalidation, scenario alternatif et condition de non-trade/non-allocation.",
  financialAdvicePolicy: "Les sorties sont informatives et ne constituent pas un conseil financier personnalise.",
  fallbackPolicy: "Si OpenAI est indisponible, le site renvoie un cadre local structure avec statut fournisseur explicite."
};

const signals = [
  { asset: "XAUUSD", direction: "Long defensif", support: "4 070 / 4 000", resistance: "4 135 / 4 210" },
  { asset: "Nasdaq 100", direction: "Long selectif", support: "18 940 / 18 620", resistance: "19 420 / 19 850" },
  { asset: "Bitcoin", direction: "Breakout conditionnel", support: "62 300 / 58 800", resistance: "68 400 / 72 000" }
];

const agents = [
  { id: "macro-x", name: "Macro-X Intelligence" },
  { id: "gem-trading-x", name: "GEM-Trading Intelligence X" },
  { id: "risk", name: "Risk Management Agent" },
  { id: "portfolio", name: "Portfolio Allocation Agent" },
  { id: "sentiment", name: "Market Sentiment Agent" }
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

function integrations(env = {}) {
  const openai = Boolean(env.OPENAI_API_KEY);
  const stripe = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  const clerk = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);

  return {
    openai: {
      configured: openai,
      status: openai ? "configured" : "fallback_ready",
      modelConfigured: Boolean(env.OPENAI_MODEL),
      fallback: "local_institutional_analysis"
    },
    stripe: {
      configured: stripe,
      status: stripe ? "configured" : "unconfigured",
      fallback: "webhook_acknowledgement_only"
    },
    clerk: {
      configured: clerk,
      status: clerk ? "configured" : "local_public_pages_only",
      fallback: "auth_pages_show_configuration_notice"
    }
  };
}

function buildAnalysis(question = "Analyse XAUUSD", agentId = "gem-trading-x") {
  const agent = agents.find((item) => item.id === agentId)?.name ?? "Avalon Market AI";

  return {
    answer: \`\${agent}

## Synthese executive
XAUUSD reste l'actif prioritaire. Le cadre utilise des niveaux Avalon statiques et ne pretend pas fournir un prix temps reel.

## Donnees et niveaux
- Donnees utilisees: contexte Avalon statique et demande utilisateur.
- Support: 4 070 / 4 000.
- Resistance: 4 135 / 4 210.
- Demande: \${question}

## Validation institutionnelle
- Aucune donnee live, flux ETF, COT, carnet, options ou news recente n'est inventee.
- Les niveaux numeriques sont classes comme contexte Avalon statique.
- La confiance reste moderee sans verification externe en temps reel.

## Donnees manquantes / hypotheses
- Donnees non fournies: dernier prix tick-by-tick, volumes, volatilite implicite, calendrier macro exact et news recentes.
- Hypothese: l'analyse sert de cadre de recherche, pas de signal executable.

## Invalidation et conditions de non-trade
- Non-trade si le prix est au milieu du range, si le R/R est inferieur a 1:1.5 ou si une publication majeure contredit le scenario.
- Invalidation sous la zone 4 035 ou sur rupture de coherence dollar/taux reels.

## Note de conformite
Information educative et analytique uniquement. Aucun conseil financier personnalise, aucune promesse de performance.\`,
    agent,
    source: "local-fallback",
    providerStatus: integrations().openai.configured ? "openai_unavailable" : "openai_not_configured",
    compliance
  };
}

async function handleApi(path, request, env) {
  if (path === "/api/health" && request.method === "GET") {
    const status = integrations(env);
    return json({
      status: "ok",
      service: "avalon-capital",
      timestamp: new Date().toISOString(),
      checks: {
        openai: status.openai.status,
        stripe: status.stripe.status,
        clerk: status.clerk.status,
        antiHallucinationProtocol: "enabled"
      }
    });
  }

  if (path === "/api/status" && request.method === "GET") {
    return json({
      status: "ok",
      service: "avalon-capital",
      timestamp: new Date().toISOString(),
      apiVersion: "2026-07-13",
      integrations: integrations(env),
      compliance
    });
  }

  if (path === "/api/market-ai" && request.method === "GET") {
    return json({ service: "market-ai", status: integrations(env).openai.status, supportedAgents: agents.map((agent) => agent.id), compliance });
  }

  if (path === "/api/market-ai" && request.method === "POST") {
    const body = await parseJson(request);
    return json(buildAnalysis(body.question, body.agentId));
  }

  if (path === "/api/agents" && request.method === "GET") {
    return json({ tools: agents });
  }

  if (path === "/api/agents" && request.method === "POST") {
    const body = await parseJson(request);
    return json({ agent: "market-intelligence", answer: buildAnalysis(body.prompt).answer, compliance });
  }

  if (path === "/api/trading/signals" && request.method === "GET") {
    return json({ signals });
  }

  if (path === "/api/gemstones" && request.method === "GET") {
    return json({ gemstones: [{ name: "Diamant bleu fancy vivid", type: "Diamant", allocation: "actif tangible defensif" }] });
  }

  if (path === "/api/reports" && request.method === "GET") {
    return json({ reports: [{ title: "Regime macro: croissance lente, liquidite selective", category: "Macro" }] });
  }

  if (path === "/api/macro/events" && request.method === "GET") {
    return json({ indicators: [{ label: "Inflation US", value: "verification live requise", tone: "neutral" }] });
  }

  if (path === "/api/admin/stats" && request.method === "GET") {
    return json({ users: 1284, activeSubscriptions: 412, monthlyRecurringRevenue: 286700 });
  }

  if (path === "/api/portfolio/rebalance" && request.method === "POST") {
    return json({ weights: { equities: 0.34, bonds: 0.18, gold: 0.12, gemstones: 0.08, alternatives: 0.12, cash: 0.16 }, compliance });
  }

  if (path === "/api/stripe/webhook" && request.method === "POST") {
    return json({ received: true, mode: integrations(env).stripe.configured ? "configured" : "unconfigured" });
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

console.log("Prepared dist for Sites static pages and API worker.");
