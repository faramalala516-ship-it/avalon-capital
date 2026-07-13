import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Landmark,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Target,
  TrendingUp
} from "lucide-react";
import { FinancialBackground } from "@/components/financial-background";
import { MarketChart } from "@/components/market-chart";
import { MiniMarketPanel } from "@/components/mini-market-panel";
import { Button } from "@/components/ui/button";
import { aiAgents, complianceItems, pricingPlans, sentimentIndicators, signals } from "@/lib/data";

const platformPillars = [
  {
    title: "Sentiment et flux",
    text: "Lecture risk-on/risk-off, rotations sectorielles, ETF flows, volatilite et conviction institutionnelle.",
    icon: Radar
  },
  {
    title: "Macro et banques centrales",
    text: "Inflation, croissance, emploi, trajectoires de taux, surprises macro et impacts cross-asset.",
    icon: Landmark
  },
  {
    title: "Idees de trades structurees",
    text: "Entree, take profit, stop loss, horizon, ratio risque/rendement et scenarios alternatifs.",
    icon: Target
  },
  {
    title: "Agents IA Pro",
    text: "Architecture multi-agent avec roles specialises, sorties structurees et garde-fous de risque.",
    icon: Bot
  }
];

const workflow = [
  "Collecte macro, micro, sentiment, volatilite et flux de capitaux.",
  "Score de regime et hierarchisation des opportunites par asymetrie.",
  "Generation d'un plan de trade avec invalidation et scenario alternatif.",
  "Suivi du risque, journal IA et historique de decision."
];

export default function HomePage() {
  const highlightedSignal = signals.find((signal) => signal.asset === "XAUUSD") ?? signals[0];

  return (
    <main>
      <section className="relative min-h-[calc(100vh-65px)] overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <FinancialBackground />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.28em] text-bullion">
              AI financial intelligence terminal
            </p>
            <h1 className="text-balance text-5xl font-semibold tracking-normal text-white md:text-7xl">
              Avalon Capital
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Plateforme premium d&apos;analyse et de decision financiere assistee par IA pour les marches
              internationaux, concue autour du sentiment, des flux, de la macro et de la discipline du risque.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Ouvrir le terminal <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/chatbot-ia">Tester les agents IA</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["64/100", "Sentiment global"],
                ["1:2.1", "R/R moyen signaux"],
                ["8", "Agents specialises"]
              ].map(([value, label]) => (
                <div key={label} className="border-l border-bullion/50 pl-4">
                  <strong className="block text-2xl text-white">{value}</strong>
                  <span className="text-xs uppercase tracking-[.18em] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-lg p-4 shadow-terminal">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Avalon command center</p>
                <h2 className="text-xl font-semibold text-white">Market regime cockpit</h2>
              </div>
              <span className="rounded-md bg-emerald/10 px-2 py-1 text-xs font-semibold text-emerald">
                Live model
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
              <MiniMarketPanel />
              <div className="grid gap-3">
                {sentimentIndicators.slice(0, 4).map((item) => (
                  <div key={item.label} className="rounded-md border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <strong className="text-white">{item.value}</strong>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-bullion" style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-bullion">
                <BrainCircuit className="h-4 w-4" />
                AI synthesis
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Regime risk-on modere: leadership AI infrastructure, or en couverture, dollar ferme. Les signaux
                long momentum restent valides uniquement avec stops stricts et exposition reduite avant CPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformPillars.map((pillar) => (
            <div key={pillar.title} className="glass rounded-lg p-5">
              <pillar.icon className="mb-4 h-6 w-6 text-bullion" />
              <h3 className="font-semibold text-white">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.03] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-bullion">Multi-agent desk</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Agents IA Pro pour chaque angle de marche</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Chaque agent possede un role, des entrees de donnees, une methode d&apos;analyse, une sortie structuree
              et un niveau d&apos;autorite. Les Gems Gemini sont presentes comme des experts personnalisables par role.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aiAgents.slice(0, 6).map((agent) => (
              <Link
                key={agent.id}
                href="/chatbot-ia"
                className="rounded-lg border border-white/10 bg-black/20 p-4 transition hover:bg-white/10"
              >
                <agent.icon className="mb-3 h-5 w-5 text-bullion" />
                <h3 className="font-semibold text-white">{agent.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{agent.role}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Performance visualisee</p>
                <h2 className="text-xl font-semibold text-white">Cross-asset intelligence</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald" />
            </div>
            <MarketChart />
          </div>

          <article className="glass rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Idee de trade IA</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{highlightedSignal.asset}</h2>
              </div>
              <span className="rounded-md bg-emerald/10 px-2 py-1 text-xs font-semibold text-emerald">
                {highlightedSignal.confidence}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Direction", highlightedSignal.direction],
                ["Entree", highlightedSignal.entry],
                ["Take profit", highlightedSignal.takeProfit],
                ["Stop loss", highlightedSignal.stopLoss],
                ["Horizon", highlightedSignal.horizon],
                ["R/R", highlightedSignal.rr]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-black/25 p-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm leading-6 text-slate-300">{highlightedSignal.justification}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Risque de scenario: {highlightedSignal.scenarioRisk}
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.03] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-bullion">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">De l&apos;information au plan de risque</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workflow.map((item, index) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-semibold uppercase tracking-[.18em] text-bullion">
                  0{index + 1}
                </span>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.24em] text-bullion">Abonnements</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Trois niveaux, une montee en puissance claire</h2>
            </div>
            <Button asChild variant="secondary">
              <Link href="/tarifs">Comparer les plans</Link>
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-lg border p-5 ${
                  plan.highlighted
                    ? "border-bullion/60 bg-bullion/10 shadow-glow"
                    : "border-white/10 bg-white/[.03]"
                }`}
              >
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-3 text-3xl font-semibold text-bullion">{plan.monthly}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.annual}</p>
                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{plan.tagline}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-300">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-bullion">
              <ShieldCheck className="h-4 w-4" />
              Confiance et conformite
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Decision probabiliste, risque explicite</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {complianceItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-bullion" />
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <span className="font-semibold uppercase tracking-[.22em] text-platinum">Avalon Capital</span>
          <span>Research technology for professional investors. (c) 2026 Avalon Capital.</span>
        </div>
      </footer>
    </main>
  );
}
