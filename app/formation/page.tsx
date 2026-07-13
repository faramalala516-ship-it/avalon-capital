import { BookOpen } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const lessons = ["Macro regime investing", "ICT liquidity and market structure", "Portfolio risk: VaR, drawdown, correlations", "Gemstone certification and valuation"];

export default function TrainingPage() {
  return (
    <PageShell title="Formation" eyebrow="Academy" description="Parcours de formation pour analystes, traders et family offices." icon={BookOpen}>
      <div className="grid gap-4 md:grid-cols-2">
        {lessons.map((lesson, index) => <div key={lesson} className="glass rounded-lg p-5"><span className="text-bullion">Module {index + 1}</span><h2 className="mt-2 text-xl font-semibold text-white">{lesson}</h2></div>)}
      </div>
    </PageShell>
  );
}
