import { Bot, BrainCircuit, Layers3, Route, ShieldCheck } from "lucide-react";
import { MarketAiAssistant } from "@/components/market-ai-assistant";
import { PageShell } from "@/components/page-shell";
import { aiAgents } from "@/lib/data";

const orchestration = [
  {
    title: "Selection du Gem",
    text: "La demande est routee vers un agent specialise selon l'actif, l'horizon, le risque et l'intention."
  },
  {
    title: "Raisonnement cadre",
    text: "L'agent combine macro, micro, sentiment, flux et niveaux techniques dans une sortie structuree."
  },
  {
    title: "Controle de risque",
    text: "Chaque reponse separe analyse, signal, idee de trade, scenario alternatif et invalidation."
  },
  {
    title: "Memoire produit",
    text: "L'espace membre conserve l'historique des analyses, preferences, alertes et decisions simulees."
  }
];

export default function ChatbotIaPage() {
  return (
    <PageShell
      title="Chatbot IA multi-agent"
      eyebrow="Gemini/Gems architecture"
      description="Interface conversationnelle pour interroger des agents specialises en macro, sentiment, swing trade, daily trade, flux cross-asset, risque et allocation."
      icon={Bot}
    >
      <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
        <div className="space-y-4">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2 text-bullion">
              <BrainCircuit className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-white">Logique de Gems specialises</h2>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              Les Gems sont presentes comme des assistants personnalises par instructions: analyste macro,
              detecteur de sentiment, copilote trading, controleur de risque ou allocateur portefeuille.
              Avalon les orchestre sous forme de desk IA avec roles explicites et sorties verifiables.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {orchestration.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-white/10 bg-white/[.03] p-4">
                <span className="text-xs font-semibold uppercase tracking-[.18em] text-bullion">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <MarketAiAssistant />
      </div>

      <div className="mt-6 glass rounded-lg p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-bullion">
            <Layers3 className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-white">Catalogue des agents Pro</h2>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-slate-300">
            Permissions par abonnement
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {aiAgents.map((agent) => (
            <article key={agent.id} className="rounded-md border border-white/10 bg-black/25 p-4">
              <agent.icon className="mb-3 h-5 w-5 text-bullion" />
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{agent.role}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Route className="h-3.5 w-3.5" />
                {agent.output}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-bullion/30 bg-bullion/10 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-bullion" />
          <p className="text-sm leading-6 text-slate-200">
            Les reponses du chatbot sont des analyses probabilistes et des aides a la decision. Elles ne
            constituent pas un conseil financier personnalise, ni une promesse de performance.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
