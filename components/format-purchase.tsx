"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IMAGE_FORMATS, formatPrice, priceForFormat, type GalleryPhoto } from "@/lib/gallery-data";
import { Button } from "@/components/ui/button";
import {
  computeBadges,
  makeOrderReference,
  readStoredUser,
  writeStoredUser,
  type PurchaseRecord
} from "@/lib/session";
import { PaymentCheckout, type PaymentMethod } from "@/components/payment-checkout";

export function FormatPurchase({ photo }: { photo: GalleryPhoto }) {
  const available = useMemo(
    () => IMAGE_FORMATS.filter((f) => photo.formats.includes(f.id)),
    [photo.formats]
  );
  const [formatId, setFormatId] = useState(available[0]?.id ?? "editorial-a4");
  const [order, setOrder] = useState<PurchaseRecord | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState(false);

  const amount = priceForFormat(photo.priceEur, formatId);

  function startPurchase() {
    const user = readStoredUser();
    if (!user) {
      setError("Enregistrez-vous d'abord (espace personnel) — l'abonnement premium n'est pas requis pour acheter.");
      return;
    }
    setError("");
    const reference = makeOrderReference();
    const purchase: PurchaseRecord = {
      id: crypto.randomUUID(),
      photoId: photo.id,
      photoTitle: photo.title,
      mineral: photo.mineral,
      formatId,
      amountEur: amount,
      status: "awaiting_transfer",
      paymentMethod: method,
      reference,
      purchasedAt: new Date().toISOString()
    };
    const next = { ...user, purchases: [purchase, ...user.purchases] };
    next.badges = computeBadges(next);
    writeStoredUser(next);
    setOrder(purchase);
  }

  async function finalizePurchase(paymentMethod: "card" | "transfer", paymentId?: string) {
    if (!order) return;
    const user = readStoredUser();
    if (!user) return;
    setBusy(true);
    try {
      const res = await fetch("/api/certificate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          photoTitle: photo.title,
          ownerEmail: user.email,
          ownerName: user.name,
          formatId: order.formatId,
          amountEur: order.amountEur
        })
      });
      const cert = await res.json();

      const purchases = user.purchases.map((p) =>
        p.id === order.id
          ? {
              ...p,
              status: "confirmed" as const,
              paymentMethod,
              paymentId,
              certificateId: cert.certificateId as string,
              txHash: cert.txHash as string
            }
          : p
      );
      const next = { ...user, purchases };
      next.badges = computeBadges(next);
      writeStoredUser(next);
      setOrder({
        ...order,
        status: "confirmed",
        paymentMethod,
        paymentId,
        certificateId: cert.certificateId,
        txHash: cert.txHash
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pearl-panel space-y-5 rounded-sm p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">Formats disponibles</p>
        <h2 className="mt-2 font-display text-3xl text-aqua-deep">Choisir le rendu</h2>
        <p className="mt-2 text-sm text-stone">
          Achat ouvert à tous les membres enregistrés — sans abonnement premium. Le Salon Privé
          n&apos;est requis que pour la salle des enchères.
        </p>
      </div>

      <div className="space-y-3">
        {available.map((format) => {
          const selected = format.id === formatId;
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => setFormatId(format.id)}
              className={
                selected
                  ? "w-full rounded-sm border border-aqua-deep bg-aqua-deep/5 p-4 text-left"
                  : "w-full rounded-sm border border-gold/25 bg-white/50 p-4 text-left hover:bg-nacre/60"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{format.label}</p>
                  <p className="mt-1 text-sm text-stone">{format.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-soft">
                    {format.resolution} · {format.license}
                  </p>
                </div>
                <p className="font-display text-xl text-aqua-deep">
                  {formatPrice(priceForFormat(photo.priceEur, format.id))}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!order ? (
        <div className="space-y-3">
          {error ? (
            <p className="text-sm text-red-700">
              {error}{" "}
              <Link href="/espace" className="underline">
                Ouvrir mon espace
              </Link>
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={
                method === "card"
                  ? "rounded-sm border border-aqua-deep bg-aqua-deep/10 px-3 py-2 text-sm text-aqua-deep"
                  : "rounded-sm border border-gold/25 px-3 py-2 text-sm"
              }
            >
              Visa / Mastercard
            </button>
            <button
              type="button"
              onClick={() => setMethod("transfer")}
              className={
                method === "transfer"
                  ? "rounded-sm border border-aqua-deep bg-aqua-deep/10 px-3 py-2 text-sm text-aqua-deep"
                  : "rounded-sm border border-gold/25 px-3 py-2 text-sm"
              }
            >
              Virement
            </button>
          </div>
          <Button type="button" size="lg" className="w-full" onClick={startPurchase}>
            Commander — {formatPrice(amount)}
          </Button>
        </div>
      ) : order.status !== "confirmed" ? (
        <PaymentCheckout
          reference={order.reference}
          amountEur={order.amountEur}
          method={method}
          onMethodChange={setMethod}
          busy={busy}
          onCardSuccess={() => void finalizePurchase("card")}
          onTransferConfirm={() => void finalizePurchase("transfer")}
        />
      ) : (
        <div className="rounded-sm border border-aqua/30 bg-aqua-mist/40 p-4 text-sm leading-6 text-ink">
          Acquisition confirmée
          {order.paymentMethod === "card" ? " (carte)" : " (virement)"}. Certificat{" "}
          <strong>{order.certificateId}</strong>
          <br />
          Empreinte : <span className="break-all font-mono text-xs">{order.txHash}</span>
          <br />
          Retrouvez le QR et vos badges dans votre espace personnel.
        </div>
      )}
    </div>
  );
}
