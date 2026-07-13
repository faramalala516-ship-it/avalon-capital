import { Newspaper } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const news = ["Fed: la fonction de reaction reste data-dependent", "Semi-conducteurs: revisions beneficiaires positives", "Or: achats banques centrales au-dessus de la moyenne 5 ans"];

export default function NewsPage() {
  return (
    <PageShell title="News" eyebrow="Market tape" description="Flux d'actualites filtre par pertinence macro, earnings et liquidite." icon={Newspaper}>
      <div className="space-y-3">
        {news.map((item) => <article key={item} className="glass rounded-lg p-5 text-white">{item}</article>)}
      </div>
    </PageShell>
  );
}
