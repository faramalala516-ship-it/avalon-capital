import { Download, FileText } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { reports } from "@/lib/data";

export default function WeeklyResearchPage() {
  return (
    <PageShell
      title="Weekly Research"
      eyebrow="Institutional reports"
      description="Publication hebdomadaire, rapports PDF et graphiques de recherche pour comites d'investissement."
      icon={FileText}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <article key={report.title} className="glass rounded-lg p-5">
            <p className="text-sm text-bullion">{report.date}</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{report.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{report.summary}</p>
            <Button className="mt-5 w-full" variant="secondary">
              <Download className="h-4 w-4" />
              Telecharger PDF
            </Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
