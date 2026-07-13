import { BadgeDollarSign, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/data";

const comparisonRows = [
  ["Analyses par jour", "analyses"],
  ["Acces agents IA", "agents"],
  ["Profondeur donnees", "depth"],
  ["Support", "support"]
] as const;

export default function PricingPage() {
  return (
    <PageShell
      title="Abonnements Avalon"
      eyebrow="Pricing"
      description="Trois niveaux pour passer d'un suivi de marche premium a une experience complete avec agents IA Pro, Gems Gemini, portefeuille et reporting."
      icon={BadgeDollarSign}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-lg border p-6 ${
              plan.highlighted ? "border-bullion/60 bg-bullion/10 shadow-glow" : "border-white/10 bg-white/[.03]"
            }`}
          >
            {plan.highlighted ? (
              <span className="absolute right-4 top-4 rounded-md bg-bullion px-2 py-1 text-xs font-semibold text-obsidian">
                Recommande
              </span>
            ) : null}
            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="mt-3 text-3xl font-semibold text-bullion">{plan.monthly}</p>
            <p className="mt-1 text-sm text-slate-500">{plan.annual}</p>
            <p className="mt-4 min-h-14 text-sm leading-6 text-slate-400">{plan.tagline}</p>
            <Button asChild className="mt-6 w-full" variant={plan.highlighted ? "primary" : "secondary"}>
              <Link href="/inscription">Demarrer</Link>
            </Button>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8 glass rounded-lg p-5">
        <div className="mb-5 flex items-center gap-2 text-bullion">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">Comparaison operationnelle</h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[.16em] text-slate-500">
              <tr>
                <th className="border-b border-white/10 py-3 font-medium">Capacite</th>
                {pricingPlans.map((plan) => (
                  <th key={plan.name} className="border-b border-white/10 py-3 font-medium">{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-300">
              {comparisonRows.map(([label, key]) => (
                <tr key={label}>
                  <td className="py-4 font-semibold text-white">{label}</td>
                  {pricingPlans.map((plan) => (
                    <td key={`${plan.name}-${key}`} className="max-w-xs py-4 pr-6">
                      {plan[key]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-4 font-semibold text-white">Chatbot</td>
                <td className="py-4 pr-6">Reponses limitees</td>
                <td className="py-4 pr-6">Acces etendu aux outils IA</td>
                <td className="py-4 pr-6">Chatbot multi-agent avance avec Gems personnalises</td>
              </tr>
              <tr>
                <td className="py-4 font-semibold text-white">Export et reporting</td>
                <td className="py-4 pr-6">Historique 30 jours</td>
                <td className="py-4 pr-6">Exports CSV/PDF mensuels</td>
                <td className="py-4 pr-6">Exports premium, scenarios et reporting prioritaire</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {comparisonRows.map(([label, key]) => (
            <div key={label} className="rounded-md border border-white/10 bg-black/25 p-4">
              <h3 className="font-semibold text-white">{label}</h3>
              <div className="mt-3 space-y-3 text-sm">
                {pricingPlans.map((plan) => (
                  <div key={`${plan.name}-${key}`} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
                    <span className="text-xs uppercase tracking-[.16em] text-slate-500">{plan.name}</span>
                    <p className="mt-1 text-slate-300">{plan[key]}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-md border border-white/10 bg-black/25 p-4">
            <h3 className="font-semibold text-white">Chatbot, export et reporting</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Essential limite les reponses et l&apos;historique. Premium Gold ajoute les exports CSV/PDF.
              Elite Full AI ouvre le chatbot multi-agent avance, les Gems personnalises et le reporting prioritaire.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-white/10 bg-black/25 p-5">
        <p className="text-sm leading-6 text-slate-300">
          Les abonnements donnent acces a des analyses, signaux et simulations. Avalon Capital ne promet aucun
          rendement et ne fournit pas d&apos;execution automatique. Les decisions restent sous la responsabilite de
          l&apos;utilisateur.
        </p>
      </div>
    </PageShell>
  );
}
