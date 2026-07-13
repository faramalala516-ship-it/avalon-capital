import { CalendarClock, Landmark, Scale, Zap } from "lucide-react";
import { MarketChart } from "@/components/market-chart";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { centralBanks, macroIndicators } from "@/lib/data";

const policyScenarios = [
  {
    name: "Fed hawkish surprise",
    probability: "28%",
    reaction: "USD +, yields +, Nasdaq compression, gold pullback",
    trade: "Reduire beta growth, conserver hedges dollar."
  },
  {
    name: "Disinflation soft landing",
    probability: "46%",
    reaction: "Equities quality +, credit stable, or range, VIX bas",
    trade: "Favoriser quality momentum et swing longs avec stops serres."
  },
  {
    name: "Growth scare",
    probability: "26%",
    reaction: "Duration +, defensives +, cyclicals -, crypto beta -",
    trade: "Augmenter cash, or et duration courte avant confirmation."
  }
];

export default function MacroDashboardPage() {
  return (
    <PageShell
      title="Politique monetaire"
      eyebrow="Central bank intelligence"
      description="Suivi des decisions de taux, attentes de marche, surprises macro et implications sur devises, indices, obligations et actifs a risque."
      icon={Landmark}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {macroIndicators.slice(0, 6).map((indicator) => (
          <MetricCard
            key={indicator.label}
            label={indicator.label}
            value={indicator.value}
            detail={indicator.change}
            tone={indicator.tone as "positive" | "negative" | "neutral"}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-slate-500">Rates and risk assets</p>
              <h2 className="text-lg font-semibold text-white">Courbe macro et actifs sensibles</h2>
            </div>
            <Scale className="h-5 w-5 text-bullion" />
          </div>
          <MarketChart />
        </div>

        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2 text-bullion">
            <CalendarClock className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Calendrier des banques centrales</h2>
          </div>
          <div className="space-y-3">
            {centralBanks.map((bank) => (
              <article key={bank.bank} className="rounded-md border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{bank.bank}</h3>
                    <p className="mt-1 text-xs text-slate-500">Prochaine decision: {bank.next}</p>
                  </div>
                  <span className="rounded-md bg-bullion/10 px-2 py-1 text-xs font-semibold text-bullion">
                    {bank.tone}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Taux</dt>
                    <dd className="text-white">{bank.rate}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pricing marche</dt>
                    <dd className="text-white">{bank.marketPricing}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm leading-6 text-slate-400">{bank.surprise}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {policyScenarios.map((scenario) => (
          <article key={scenario.name} className="glass rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.2em] text-slate-500">Scenario</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{scenario.name}</h2>
              </div>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-slate-200">
                {scenario.probability}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{scenario.reaction}</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-bullion">{scenario.trade}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 glass rounded-lg p-5">
        <div className="mb-4 flex items-center gap-2 text-bullion">
          <Zap className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">Impacts probables par banque centrale</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {centralBanks.map((bank) => (
            <div key={bank.bank} className="rounded-md border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold text-white">{bank.bank}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {bank.impacts.map((impact) => (
                  <li key={impact}>{impact}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
