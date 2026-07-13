import Image from "next/image";
import { Gem } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { gems } from "@/lib/data";

export default function GemInvestmentPage() {
  return (
    <PageShell
      title="Gem Investment"
      eyebrow="Rare asset desk"
      description="Catalogue premium de diamants, rubis, saphirs, emeraudes, alexandrites, spinelles et tanzanites."
      icon={Gem}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {gems.map((gem) => (
          <article key={gem.name} className="overflow-hidden rounded-lg border border-white/10 bg-white/[.04]">
            <div className="relative aspect-[4/3]">
              <Image src={gem.image} alt={gem.name} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{gem.name}</h2>
                <span className="rounded-md bg-bullion/10 px-2 py-1 text-sm font-semibold text-bullion">{gem.aiRating}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Type</dt><dd>{gem.type}</dd></div>
                <div><dt className="text-slate-500">Origine</dt><dd>{gem.origin}</dd></div>
                <div><dt className="text-slate-500">Poids</dt><dd>{gem.carat}</dd></div>
                <div><dt className="text-slate-500">Certification</dt><dd>{gem.certification}</dd></div>
                <div><dt className="text-slate-500">Rarete IA</dt><dd>{gem.rarity}/100</dd></div>
              </dl>
              <div className="mt-4 flex h-16 items-end gap-1 border-b border-white/10">
                {gem.valueCurve.map((value) => (
                  <span
                    key={`${gem.name}-${value}`}
                    className="flex-1 rounded-t bg-bullion/70"
                    style={{ height: `${Math.max(18, value - 35)}%` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{gem.history}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
