import { Activity, BellRing, BookOpenCheck, ShieldCheck } from "lucide-react";
import { MarketAiAssistant } from "@/components/market-ai-assistant";
import { MarketChart } from "@/components/market-chart";
import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { macroIndicators, memberModules, signals } from "@/lib/data";

const orderBook = [
  ["NAS100", "Long", "19 110", "19 720", "18 760", "+1.8R"],
  ["XAUUSD", "Long", "4 105", "4 210", "4 035", "+0.6R"],
  ["EURUSD", "Watch", "1.0840", "1.0940", "1.0770", "0R"]
];

const analysisHistory = [
  ["09:10", "Macro Policy Agent", "Fed pause hawkish: beta growth reduit"],
  ["10:35", "Market Sentiment Agent", "Risk-on selectif, breadth encore fragile"],
  ["14:05", "Risk Management Agent", "Exposition nette limitee a 38% avant CPI"]
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard membre"
      eyebrow="Secure command center"
      description="Vue personnelle des marches, trades suggerees par IA, historique d'analyses, performance, alertes et suivi du risque."
      icon={Activity}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Performance YTD" value="+12.4%" detail="+2.1R mois" tone="positive" />
        <MetricCard label="VaR 95%" value="4.2%" detail="-0.6 pt" tone="positive" />
        <MetricCard label="Exposition nette" value="38%" detail="limitee" />
        <MetricCard label="Alertes actives" value="11" detail="3 critiques" tone="neutral" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-bullion" />
            <h2 className="text-lg font-semibold text-white">Performance et allocation suivie</h2>
          </div>
          <MarketChart />
        </div>
        <MarketAiAssistant />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">Carnet d&apos;ordres simule</h2>
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">Paper execution</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[.16em] text-slate-500">
                <tr>
                  {["Actif", "Direction", "Entree", "Take profit", "Stop", "P/L"].map((heading) => (
                    <th key={heading} className="border-b border-white/10 py-3 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {orderBook.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${cell}`} className={index === 5 ? "py-3 font-semibold text-emerald" : "py-3"}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2 text-bullion">
            <BookOpenCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Journal des analyses IA</h2>
          </div>
          <div className="space-y-3">
            {analysisHistory.map(([time, agent, note]) => (
              <div key={`${time}-${agent}`} className="rounded-md border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span>{time}</span>
                  <span>{agent}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {signals.map((signal) => (
          <article key={signal.asset} className="glass rounded-lg p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">{signal.asset}</h2>
              <span className="rounded-md bg-bullion/10 px-2 py-1 text-xs font-semibold text-bullion">
                {signal.horizon}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Entree</dt><dd className="text-white">{signal.entry}</dd></div>
              <div><dt className="text-slate-500">Take profit</dt><dd className="text-white">{signal.takeProfit}</dd></div>
              <div><dt className="text-slate-500">Stop</dt><dd className="text-white">{signal.stopLoss}</dd></div>
              <div><dt className="text-slate-500">R/R</dt><dd className="text-emerald">{signal.rr}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-slate-400">{signal.justification}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2 text-bullion">
            <BellRing className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Alertes intelligentes</h2>
          </div>
          <div className="space-y-3">
            {macroIndicators.slice(0, 4).map((indicator) => (
              <div key={indicator.label} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/25 p-3 text-sm">
                <span className="text-slate-300">{indicator.label}</span>
                <strong className="text-white">{indicator.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Modules espace membre</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {memberModules.map((module) => (
              <div key={module} className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-slate-300">
                {module}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
