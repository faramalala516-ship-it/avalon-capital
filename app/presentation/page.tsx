import { Layers3, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const architecture = [
  ["Vitrine premium", "Homepage, pricing, presentation, confiance, CTA inscription et demo."],
  ["Application membre", "Dashboard, profil, alertes, historique IA, carnet d'ordres simule et performance."],
  ["Intelligence marche", "Sentiment, flux, macro, banques centrales, scanner trading et portefeuille."],
  ["Agents IA", "Gemini/Gems specialises, orchestration par role, sorties structurees et journal d'audit."]
];

const designSystem = [
  ["Palette", "Obsidian, midnight, platinum, bullion, emerald, cobalt pour accents analytiques."],
  ["Typographie", "Inter/Segoe compacte, chiffres lisibles, titres retenus dans les interfaces applicatives."],
  ["Composants", "KPI cards, tables, badges, gauges, heatmaps, charts, side panels et blocs IA."],
  ["UX", "Navigation claire, densite dashboard, responsive mobile/tablette/desktop, micro-interactions sobres."]
];

const wireframes = [
  "Hero: marque Avalon, proposition de valeur, CTA, terminal marche live.",
  "Sentiment: score global, heatmap sectorielle, rotations, synthese IA.",
  "Policy: banques centrales, calendrier, pricing marche, scenarios de reaction.",
  "Chatbot: selection d'agent, role, donnees, methode, sortie, reponse structuree.",
  "Membre: KPI, chart, carnet d'ordres, journal IA, alertes, modules profil."
];

export default function PresentationPage() {
  return (
    <PageShell
      title="Presentation produit"
      eyebrow="Avalon Capital"
      description="Structure complete du site, arborescence, design system, composants cles et logique applicative pour une plateforme d'intelligence financiere."
      icon={ShieldCheck}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {architecture.map(([title, text]) => (
          <div key={title} className="glass rounded-lg p-5">
            <Layers3 className="mb-4 h-5 w-5 text-bullion" />
            <h2 className="font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Design system</h2>
          <div className="mt-5 space-y-4">
            {designSystem.map(([title, text]) => (
              <div key={title} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <h3 className="font-semibold text-bullion">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">Wireframes fonctionnels</h2>
          <div className="mt-5 space-y-3">
            {wireframes.map((wireframe, index) => (
              <div key={wireframe} className="rounded-md border border-white/10 bg-black/25 p-4">
                <span className="text-xs font-semibold uppercase tracking-[.18em] text-bullion">
                  Section 0{index + 1}
                </span>
                <p className="mt-2 text-sm leading-6 text-slate-300">{wireframe}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
