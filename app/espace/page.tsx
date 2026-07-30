"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Award, Lock, ShoppingBag } from "lucide-react";
import { OwnershipQr } from "@/components/ownership-qr";
import { BankTransferPanel } from "@/components/bank-transfer-panel";
import { Button } from "@/components/ui/button";
import { BADGES, SUBSCRIPTION, formatPrice } from "@/lib/gallery-data";
import {
  clearStoredUser,
  computeBadges,
  emptyUser,
  makeOrderReference,
  readStoredUser,
  writeStoredUser,
  type GalleryUser
} from "@/lib/session";

export default function EspacePage() {
  const [user, setUser] = useState<GalleryUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subRef, setSubRef] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener("gses-user-updated", sync);
    return () => window.removeEventListener("gses-user-updated", sync);
  }, []);

  function register(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;
    const next = emptyUser(email, name);
    writeStoredUser(next);
    setUser(next);
  }

  function startSubscription() {
    if (!user) return;
    setSubRef(makeOrderReference());
  }

  function activateSubscription() {
    if (!user) return;
    const next = { ...user, subscriptionActive: true };
    next.badges = computeBadges(next);
    writeStoredUser(next);
    setUser(next);
    setSubRef(null);
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <p className="text-xs uppercase tracking-[0.24em] text-gold-deep">Espace personnel</p>
        <h1 className="mt-3 font-display text-5xl text-aqua-deep">Ouvrir votre page</h1>
        <p className="mt-4 text-sm leading-7 text-stone">
          Enregistrez-vous avec votre adresse e-mail pour retrouver achats, badges, certificats QR et — avec
          abonnement — la salle des ventes privée.
        </p>
        <form onSubmit={register} className="pearl-panel mt-8 space-y-4 rounded-sm p-6">
          <label className="block text-sm">
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-11 w-full rounded-sm border border-gold/30 bg-white/80 px-3"
              placeholder="Votre nom"
            />
          </label>
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-sm border border-gold/30 bg-white/80 px-3"
              placeholder="vous@exemple.eu"
            />
          </label>
          <Button type="submit" size="lg" className="w-full">
            Créer ma page personnelle
          </Button>
        </form>
      </main>
    );
  }

  const earned = new Set(user.badges);
  const confirmed = user.purchases.filter((p) => p.status === "confirmed");

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold-deep">Espace personnel</p>
          <h1 className="mt-3 font-display text-5xl text-aqua-deep">{user.name}</h1>
          <p className="mt-2 text-sm text-stone">{user.email}</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => { clearStoredUser(); setUser(null); }}>
          Se déconnecter
        </Button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="pearl-panel rounded-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold-deep" />
            <h2 className="font-display text-3xl text-ink">Achats effectués</h2>
          </div>
          {user.purchases.length === 0 ? (
            <p className="mt-4 text-sm text-stone">
              Aucun achat pour l&apos;instant.{" "}
              <Link href="/galerie" className="text-aqua-deep underline">
                Parcourir la galerie
              </Link>
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {user.purchases.map((p) => (
                <li key={p.id} className="rounded-sm border border-gold/20 bg-white/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl text-aqua-deep">{p.photoTitle}</p>
                      <p className="text-sm text-stone">
                        {p.mineral} · format {p.formatId} · {formatPrice(p.amountEur)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-soft">
                        {p.reference} · {p.status === "confirmed" ? "confirmé" : "en attente de virement"}
                      </p>
                    </div>
                    {p.certificateId && p.txHash ? (
                      <OwnershipQr
                        payload={JSON.stringify({
                          certificateId: p.certificateId,
                          txHash: p.txHash,
                          photoId: p.photoId,
                          owner: user.email,
                          verify: `https://www.gemstoneyeshootingallery.com/certificat/${p.certificateId}`
                        })}
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-6">
          <div className="pearl-panel rounded-sm p-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-deep" />
              <h2 className="font-display text-2xl text-ink">Badges</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {BADGES.map((badge) => {
                const active =
                  badge.id === "salon-prive"
                    ? user.subscriptionActive
                    : earned.has(badge.id) || confirmed.length >= badge.threshold;
                return (
                  <li
                    key={badge.id}
                    className={
                      active
                        ? "rounded-sm border border-aqua/30 bg-aqua-mist/50 px-3 py-2"
                        : "rounded-sm border border-dashed border-stone-soft/40 px-3 py-2 opacity-55"
                    }
                  >
                    <p className="text-sm font-medium text-ink">{badge.label}</p>
                    <p className="text-xs text-stone">{badge.description}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="pearl-panel rounded-sm p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gold-deep" />
              <h2 className="font-display text-2xl text-ink">{SUBSCRIPTION.name}</h2>
            </div>
            <p className="mt-2 font-display text-3xl text-aqua-deep">
              {formatPrice(SUBSCRIPTION.priceEur)}
              <span className="text-base text-stone"> / mois</span>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-stone">
              {SUBSCRIPTION.perks.map((perk) => (
                <li key={perk}>· {perk}</li>
              ))}
            </ul>
            {user.subscriptionActive ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-sm bg-aqua-deep/10 px-3 py-2 text-sm text-aqua-deep">
                  Abonnement actif — salle privée ouverte.
                </p>
                <Button asChild className="w-full">
                  <Link href="/salle-encheres">Entrer dans la salle des enchères</Link>
                </Button>
              </div>
            ) : subRef ? (
              <div className="mt-4 space-y-3">
                <BankTransferPanel reference={subRef} amountEur={SUBSCRIPTION.priceEur} />
                <Button type="button" variant="gold" className="w-full" onClick={activateSubscription}>
                  Virement effectué — activer l&apos;accès
                </Button>
              </div>
            ) : (
              <Button type="button" className="mt-4 w-full" onClick={startSubscription}>
                S&apos;abonner par virement
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
