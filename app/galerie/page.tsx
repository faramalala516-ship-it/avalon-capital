"use client";

import { useMemo, useState } from "react";
import { PhotoCard } from "@/components/photo-card";
import { collections, getCurrentCollection } from "@/lib/gallery-data";

export default function GaleriePage() {
  const current = getCurrentCollection();
  const [monthKey, setMonthKey] = useState(current.monthKey);

  const selected = useMemo(
    () => collections.find((c) => c.monthKey === monthKey) ?? current,
    [monthKey, current]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-gold-deep">Galerie shooting</p>
        <h1 className="mt-3 font-display text-5xl text-aqua-deep md:text-6xl">
          Meilleures collections du mois
        </h1>
        <p className="mt-5 text-base leading-8 text-stone">
          Non classées par variété : ici, le regard du mois. Sous chaque photo — description détaillée et
          prix. Archives mensuelles conservées pour les collectionneurs et les rédactions.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-2">
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setMonthKey(c.monthKey)}
            className={
              c.monthKey === monthKey
                ? "rounded-sm bg-aqua-deep px-4 py-2 text-sm text-foam"
                : "rounded-sm border border-gold/30 bg-white/50 px-4 py-2 text-sm text-stone-deep hover:bg-nacre/70"
            }
          >
            {c.label}
            {c.monthKey === current.monthKey ? " · en cours" : " · archive"}
          </button>
        ))}
      </div>

      <div className="pearl-panel mt-8 rounded-sm p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">{selected.label}</p>
        <h2 className="mt-2 font-display text-3xl text-ink">{selected.theme}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone">{selected.intro}</p>
      </div>

      <div className="mt-12 grid gap-12 sm:grid-cols-2">
        {selected.photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
      </div>
    </main>
  );
}
