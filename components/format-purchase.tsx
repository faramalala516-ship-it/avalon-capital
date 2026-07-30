"use client";

import { useMemo, useState } from "react";
import { IMAGE_FORMATS, formatPrice, priceForFormat, type GalleryPhoto } from "@/lib/gallery-data";
import { Button } from "@/components/ui/button";
import {
  computeBadges,
  makeOrderReference,
  readStoredUser,
  writeStoredUser,
  type PurchaseRecord
} from "@/lib/session";
import { BankTransferPanel } from "@/components/bank-transfer-panel";

export function FormatPurchase({ photo }: { photo: GalleryPhoto }) {
  const available = useMemo(
    () => IMAGE_FORMATS.filter((f) => photo.formats.includes(f.id)),
    [photo.formats]
  );
  const [formatId, setFormatId] = useState(available[0]?.id ?? "editorial-a4");
  const [order, setOrder] = useState<PurchaseRecord | null>(null);
  const [error, setError] = useState("");

  const amount = priceForFormat(photo.priceEur, formatId);

  function startPurchase() {
    const user = readStoredUser();
    if (!user) {
      setError("Ouvrez d'abord votre page personnelle avec votre e-mail.");
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
      reference,
      purchasedAt: new Date().toISOString()
    };
    const next = { ...user, purchases: [purchase, ...user.purchases] };
    next.badges = computeBadges(next);
    writeStoredUser(next);
    setOrder(purchase);
  }

  async function confirmPaid() {
    if (!order) return;
    const user = readStoredUser();
    if (!user) return;

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
            certificateId: cert.certificateId as string,
            txHash: cert.txHash as string
          }
        : p
    );
    const next = { ...user, purchases };
    next.badges = computeBadges(next);
    writeStoredUser(next);
    setOrder({ ...order, status: "confirmed", certificateId: cert.certificateId, txHash: cert.txHash });
  }

  return (
    <div className="pearl-panel space-y-5 rounded-sm p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">Formats disponibles</p>
        <h2 className="mt-2 font-display text-3xl text-aqua-deep">Choisir le rendu</h2>
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
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="button" size="lg" className="w-full" onClick={startPurchase}>
            Commander — {formatPrice(amount)}
          </Button>
          <p className="text-xs leading-5 text-stone">
            Paiement par virement bancaire international. Le master et le certificat blockchain + QR sont
            délivrés après confirmation du crédit.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <BankTransferPanel reference={order.reference} amountEur={order.amountEur} />
          {order.status === "awaiting_transfer" ? (
            <Button type="button" variant="gold" className="w-full" onClick={() => void confirmPaid()}>
              J&apos;ai effectué le virement — générer certificat &amp; QR
            </Button>
          ) : (
            <div className="rounded-sm border border-aqua/30 bg-aqua-mist/40 p-4 text-sm leading-6 text-ink">
              Acquisition confirmée. Certificat <strong>{order.certificateId}</strong>
              <br />
              Empreinte : <span className="break-all font-mono text-xs">{order.txHash}</span>
              <br />
              Retrouvez le QR et vos badges dans votre espace personnel.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
