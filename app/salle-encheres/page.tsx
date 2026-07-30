"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, LockKeyhole } from "lucide-react";
import { ProtectedPhoto } from "@/components/protected-photo";
import { Button } from "@/components/ui/button";
import { auctionLots, formatPrice } from "@/lib/gallery-data";
import { readStoredUser, type GalleryUser } from "@/lib/session";

export default function SalleEncheresPage() {
  const [user, setUser] = useState<GalleryUser | null>(null);
  const [lots, setLots] = useState(auctionLots);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener("gses-user-updated", sync);
    return () => window.removeEventListener("gses-user-updated", sync);
  }, []);

  if (!user) {
    return (
      <Gate
        title="Salle fermée aux visiteurs"
        text="Cette page privée est réservée aux membres enregistrés avec abonnement Salon Privé."
        ctaHref="/espace"
        cta="S'enregistrer"
      />
    );
  }

  if (!user.subscriptionActive) {
    return (
      <Gate
        title="Accès abonnés uniquement"
        text="Souscrivez au Salon Privé pour les avant-premières mensuelles et les enchères virtuelles."
        ctaHref="/espace"
        cta="Activer mon abonnement"
      />
    );
  }

  function placeBid(event: FormEvent, lotId: string, currentBid: number) {
    event.preventDefault();
    const value = Number(amounts[lotId] ?? "");
    if (!Number.isFinite(value) || value <= currentBid) {
      setNotice("Votre enchère doit dépasser la mise actuelle.");
      return;
    }
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === lotId ? { ...lot, currentBid: value, bids: lot.bids + 1 } : lot
      )
    );
    setNotice(`Enchère enregistrée à ${formatPrice(value)}. Confirmation par e-mail après clôture.`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold-deep">
          <Gavel className="h-4 w-4" /> Salle des ventes aux enchères
        </p>
        <h1 className="mt-3 font-display text-5xl text-aqua-deep md:text-6xl">Avant-premières du mois</h1>
        <p className="mt-5 text-base leading-8 text-stone">
          Bienvenue {user.name}. Une fois par mois, les plus beaux clichés en exclusivité — enchères
          virtuelles pour abonnés. Paiement final par virement international.
        </p>
        {notice ? (
          <p className="mt-4 rounded-sm border border-aqua/30 bg-aqua-mist/40 px-4 py-3 text-sm text-aqua-deep">
            {notice}
          </p>
        ) : null}
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        {lots.map((lot) => (
          <article key={lot.id} className="pearl-panel overflow-hidden rounded-sm">
            <ProtectedPhoto
              src={lot.imageUrl}
              alt={lot.title}
              className="aspect-[4/5] w-full"
              watermark="Salon privé · GSES"
            />
            <div className="space-y-3 p-5">
              {lot.premiere ? (
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold-deep">Avant-première</span>
              ) : null}
              <h2 className="font-display text-2xl text-ink">{lot.title}</h2>
              <p className="text-sm text-stone">{lot.mineral}</p>
              <p className="text-sm text-stone-deep">
                Mise actuelle · <span className="font-display text-xl">{formatPrice(lot.currentBid)}</span>
                <br />
                <span className="text-xs uppercase tracking-[0.14em] text-stone-soft">
                  {lot.bids} enchères · clôture{" "}
                  {new Date(lot.endsAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })}
                </span>
              </p>
              <form
                className="flex gap-2"
                onSubmit={(event) => placeBid(event, lot.id, lot.currentBid)}
              >
                <input
                  type="number"
                  min={lot.currentBid + 10}
                  step={10}
                  placeholder={`${lot.currentBid + 20}`}
                  value={amounts[lot.id] ?? ""}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [lot.id]: e.target.value }))}
                  className="h-10 flex-1 rounded-sm border border-gold/30 bg-white/80 px-3 text-sm"
                />
                <Button type="submit" size="sm">
                  Enchérir
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Gate({
  title,
  text,
  ctaHref,
  cta
}: {
  title: string;
  text: string;
  ctaHref: string;
  cta: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <LockKeyhole className="h-10 w-10 text-gold-deep" />
      <h1 className="mt-6 font-display text-4xl text-aqua-deep">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-stone">{text}</p>
      <Button asChild className="mt-8" size="lg">
        <Link href={ctaHref}>{cta}</Link>
      </Button>
    </main>
  );
}
