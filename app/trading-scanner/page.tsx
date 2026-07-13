import { BarChart3 } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { TradingViewPanel } from "@/components/tradingview-panel";
import { signals } from "@/lib/data";

const methods = ["Wyckoff", "ICT", "Smart Money", "Order Blocks", "Fair Value Gap", "Market Structure", "Liquidity", "Volume Profile", "VWAP", "ATR", "EMA", "RSI", "MACD", "Multi Time Frame"];

export default function TradingScannerPage() {
  return (
    <PageShell
      title="Trading Scanner"
      eyebrow="Professional trading"
      description="Scanner multi-timeframe pour setups institutionnels, liquidite, volume profile et momentum."
      icon={BarChart3}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {methods.map((method) => (
          <span key={method} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            {method}
          </span>
        ))}
      </div>
      <div className="mb-6 glass rounded-lg p-4">
        <TradingViewPanel />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {signals.map((signal) => (
          <article key={signal.asset} className="glass rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{signal.asset}</h2>
              <span className="rounded-md bg-bullion/10 px-2 py-1 text-xs font-semibold text-bullion">{signal.timeframe}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200">{signal.direction}</span>
              <span className="rounded-md bg-emerald/10 px-2 py-1 text-xs text-emerald">
                {Math.round(signal.probability * 100)}% conviction
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{signal.setup}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Entree</dt><dd className="text-white">{signal.entry}</dd></div>
              <div><dt className="text-slate-500">Take profit</dt><dd className="text-white">{signal.takeProfit}</dd></div>
              <div><dt className="text-slate-500">Stop loss</dt><dd className="text-white">{signal.stopLoss}</dd></div>
              <div><dt className="text-slate-500">Risque/rendement</dt><dd className="text-emerald">{signal.rr}</dd></div>
              <div><dt className="text-slate-500">Horizon</dt><dd className="text-white">{signal.horizon}</dd></div>
              <div><dt className="text-slate-500">Biais sentiment</dt><dd className="text-white">{signal.sentimentBias}</dd></div>
            </dl>
            <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-400">
              {signal.justification}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">Catalyseurs: {signal.catalysts}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Scenario alternatif: {signal.scenarioRisk}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
