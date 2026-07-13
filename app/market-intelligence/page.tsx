import { Globe2, Radar, TrendingDown, TrendingUp } from "lucide-react";
import { MarketAiAssistant } from "@/components/market-ai-assistant";
import { MarketChart } from "@/components/market-chart";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { sectorFlows, sentimentIndicators } from "@/lib/data";
import { cn } from "@/lib/utils";

const rotations = [
  ["Actions US quality", "Overweight", "+14 pts"],
  ["Duration courte", "Neutral", "+3 pts"],
  ["Small caps", "Underweight", "-11 pts"],
  ["Credit high yield", "Neutral-", "-5 pts"],
  ["Gold hedge", "Overweight tactique", "+8 pts"],
  ["Crypto beta", "Selectif", "-2 pts"]
];

export default function MarketIntelligencePage() {
  return (
    <PageShell
      title="Market Sentiment Intelligence"
      eyebrow="Sentiment, flows, positioning"
      description="Lecture consolidee du sentiment global, des flux sectoriels, du positionnement institutionnel et des regimes risk-on/risk-off."
      icon={Globe2}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {sentimentIndicators.slice(0, 3).map((indicator) => (
          <MetricCard
            key={indicator.label}
            label={indicator.label}
            value={indicator.value}
            detail={indicator.detail}
            tone={indicator.tone as "positive" | "negative" | "neutral"}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-slate-500">Risk appetite model</p>
              <h2 className="text-lg font-semibold text-white">Sentiment et liquidite</h2>
            </div>
            <Radar className="h-5 w-5 text-bullion" />
          </div>
          <MarketChart />
        </div>

        <div className="glass rounded-lg p-5">
          <p className="text-xs uppercase tracking-[.2em] text-slate-500">Sector flow heatmap</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Rotations sectorielles</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sectorFlows.map((flow) => (
              <div
                key={flow.sector}
                className={cn(
                  "rounded-md border p-4",
                  flow.tone === "positive" && "border-emerald/25 bg-emerald/10",
                  flow.tone === "negative" && "border-red-400/25 bg-red-500/10",
                  flow.tone === "neutral" && "border-white/10 bg-black/25"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">{flow.sector}</span>
                  {flow.tone === "negative" ? (
                    <TrendingDown className="h-4 w-4 text-red-300" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald" />
                  )}
                </div>
                <strong className="mt-3 block text-2xl text-white">{flow.flow}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="glass rounded-lg p-5">
          <p className="text-xs uppercase tracking-[.2em] text-slate-500">Investor positioning</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Allocation observee</h2>
          <div className="mt-5 space-y-3">
            {rotations.map(([asset, stance, change]) => (
              <div key={asset} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-white/10 bg-black/25 p-3 text-sm">
                <span className="text-slate-300">{asset}</span>
                <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200">{stance}</span>
                <strong className={change.startsWith("+") ? "text-emerald" : "text-red-300"}>{change}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <p className="text-xs uppercase tracking-[.2em] text-slate-500">AI interpretation</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Synthese sentiment</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Le marche conserve un biais risk-on, mais la conviction reste concentree sur les leaders quality et
            infrastructure IA. Les flux montrent une preference pour les actifs liquides, avec une couverture or
            persistante. Les signaux directionnels doivent etre reduits avant les publications CPI et decisions Fed.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {sentimentIndicators.slice(3).map((indicator) => (
              <div key={indicator.label} className="rounded-md border border-white/10 bg-black/25 p-3">
                <span className="text-xs text-slate-500">{indicator.label}</span>
                <strong className="mt-2 block text-lg text-white">{indicator.value}</strong>
                <div className="mt-3 h-1.5 rounded-full bg-white/10">
                  <div className="h-1.5 rounded-full bg-bullion" style={{ width: `${indicator.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <MarketAiAssistant />
      </div>
    </PageShell>
  );
}
