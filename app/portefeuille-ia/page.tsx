import { WalletCards } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { formatPercent } from "@/lib/utils";

const allocation = [
  ["US Quality Equity", 0.34, "Core compounding"],
  ["Global Macro Bonds", 0.18, "Convexity"],
  ["Gold", 0.12, "Real asset hedge"],
  ["Market Neutral", 0.16, "Low beta alpha"],
  ["Gemstones", 0.08, "Rare asset diversifier"],
  ["Cash/T-Bills", 0.12, "Dry powder"]
] as const;

export default function PortfolioAiPage() {
  return (
    <PageShell
      title="Portefeuille IA"
      eyebrow="Wealth intelligence"
      description="Allocation intelligente, correlations, VaR, drawdown, suggestions IA et reequilibrage."
      icon={WalletCards}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Allocation cible</h2>
          <div className="mt-5 space-y-4">
            {allocation.map(([name, weight, detail]) => (
              <div key={name}>
                <div className="mb-2 flex justify-between text-sm"><span>{name}</span><span className="text-bullion">{formatPercent(weight)}</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-bullion" style={{ width: `${weight * 100}%` }} /></div>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {[
            ["Correlation moyenne", "0.31"],
            ["VaR 95%", "4.2%"],
            ["Max drawdown simule", "-8.7%"],
            ["Suggestion IA", "Augmenter duration courte"]
          ].map(([label, value]) => (
            <div key={label} className="glass rounded-lg p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <strong className="mt-2 block text-2xl text-white">{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
