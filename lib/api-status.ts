export const apiSurface = [
  {
    method: "GET",
    path: "/api/health",
    purpose: "Liveness check court pour supervision."
  },
  {
    method: "GET",
    path: "/api/status",
    purpose: "Statut operationnel, integrations externes et controles de conformite."
  },
  {
    method: "GET/POST",
    path: "/api/agents",
    purpose: "Catalogue et orchestration des agents Avalon."
  },
  {
    method: "POST",
    path: "/api/market-ai",
    purpose: "Analyses IA institutionnelles avec repli local anti-hallucination."
  },
  {
    method: "GET",
    path: "/api/gemstones",
    purpose: "Donnees metiers pierres et actifs tangibles."
  },
  {
    method: "GET",
    path: "/api/reports",
    purpose: "Rapports de recherche."
  },
  {
    method: "GET",
    path: "/api/macro/events",
    purpose: "Evenements macro suivis par Avalon."
  },
  {
    method: "GET",
    path: "/api/trading/signals",
    purpose: "Signaux et scenarios multi-actifs."
  },
  {
    method: "POST",
    path: "/api/portfolio/rebalance",
    purpose: "Simulation de rebalancement portefeuille."
  },
  {
    method: "POST",
    path: "/api/stripe/webhook",
    purpose: "Reception webhook Stripe avec mode non configure explicite."
  }
];

export const institutionalControls = {
  antiHallucination: "enabled",
  realtimeDataPolicy: "Aucune donnee temps reel n'est inventee sans source ou outil disponible.",
  provenancePolicy: "Chaque analyse doit distinguer donnees fournies, contexte Avalon, hypotheses et donnees non fournies.",
  riskPolicy: "Chaque analyse inclut invalidation, scenario alternatif et condition de non-trade/non-allocation.",
  financialAdvicePolicy: "Les sorties sont informatives et ne constituent pas un conseil financier personnalise.",
  fallbackPolicy: "Si OpenAI est indisponible, le site renvoie un cadre local structure avec statut fournisseur explicite."
};

export function getIntegrationStatus() {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );

  return {
    openai: {
      configured: openAiConfigured,
      status: openAiConfigured ? "configured" : "fallback_ready",
      modelConfigured: Boolean(process.env.OPENAI_MODEL),
      fallback: "local_institutional_analysis"
    },
    stripe: {
      configured: stripeConfigured,
      status: stripeConfigured ? "configured" : "unconfigured",
      fallback: "webhook_acknowledgement_only"
    },
    clerk: {
      configured: clerkConfigured,
      status: clerkConfigured ? "configured" : "local_public_pages_only",
      fallback: "auth_pages_show_configuration_notice"
    }
  };
}

export function getApiStatus() {
  return {
    status: "ok",
    service: "avalon-capital",
    timestamp: new Date().toISOString(),
    apiVersion: "2026-07-13",
    integrations: getIntegrationStatus(),
    compliance: institutionalControls,
    endpoints: apiSurface
  };
}
