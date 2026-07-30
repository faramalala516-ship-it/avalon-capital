"use client";

import { FormEvent, useState } from "react";
import { CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankTransferPanel } from "@/components/bank-transfer-panel";
import { formatPrice } from "@/lib/gallery-data";
import { cn } from "@/lib/utils";

export type PaymentMethod = "card" | "transfer";

type Props = {
  reference: string;
  amountEur: number;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onCardSuccess: () => void;
  onTransferConfirm: () => void;
  busy?: boolean;
};

function luhnOk(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectBrand(num: string): "visa" | "mastercard" | "unknown" {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  return "unknown";
}

export function PaymentCheckout({
  reference,
  amountEur,
  method,
  onMethodChange,
  onCardSuccess,
  onTransferConfirm,
  busy
}: Props) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const brand = detectBrand(number);

  async function payCard(event: FormEvent) {
    event.preventDefault();
    setError("");
    const digits = number.replace(/\D/g, "");
    if (brand === "unknown") {
      setError("Carte Visa ou Mastercard uniquement.");
      return;
    }
    if (!luhnOk(digits)) {
      setError("Numéro de carte invalide.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Expiration au format MM/AA.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      setError("CVC invalide.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Nom du titulaire requis.");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payments/card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reference,
          amountEur,
          brand,
          last4: digits.slice(-4),
          holderName: name.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Paiement refusé.");
        return;
      }
      onCardSuccess();
    } catch {
      setError("Connexion paiement interrompue.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onMethodChange("card")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-sm",
            method === "card"
              ? "border-aqua-deep bg-aqua-deep/10 text-aqua-deep"
              : "border-gold/25 bg-white/60 text-stone-deep"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Visa / Mastercard
        </button>
        <button
          type="button"
          onClick={() => onMethodChange("transfer")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-sm border px-3 py-3 text-sm",
            method === "transfer"
              ? "border-aqua-deep bg-aqua-deep/10 text-aqua-deep"
              : "border-gold/25 bg-white/60 text-stone-deep"
          )}
        >
          <Landmark className="h-4 w-4" />
          Virement SEPA
        </button>
      </div>

      {method === "transfer" ? (
        <div className="space-y-3">
          <BankTransferPanel reference={reference} amountEur={amountEur} />
          <Button
            type="button"
            variant="gold"
            className="w-full"
            disabled={busy}
            onClick={onTransferConfirm}
          >
            J&apos;ai effectué le virement — générer certificat &amp; QR
          </Button>
        </div>
      ) : (
        <form onSubmit={payCard} className="pearl-panel space-y-3 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-gold-deep">
              Paiement carte · {formatPrice(amountEur)}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-stone-soft">
              {brand === "visa" ? "Visa" : brand === "mastercard" ? "Mastercard" : "Visa / MC"}
            </p>
          </div>
          <label className="block text-sm">
            Titulaire
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-10 w-full rounded-sm border border-gold/30 bg-white/80 px-3"
              placeholder="Nom sur la carte"
              autoComplete="cc-name"
            />
          </label>
          <label className="block text-sm">
            Numéro de carte
            <input
              value={number}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 19);
                setNumber(raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
              }}
              className="mt-1 h-10 w-full rounded-sm border border-gold/30 bg-white/80 px-3 font-mono"
              placeholder="ACCT-000006"
              inputMode="numeric"
              autoComplete="cc-number"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Expiration
              <input
                value={expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                  if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                  setExpiry(v);
                }}
                className="mt-1 h-10 w-full rounded-sm border border-gold/30 bg-white/80 px-3 font-mono"
                placeholder="MM/AA"
                autoComplete="cc-exp"
              />
            </label>
            <label className="block text-sm">
              CVC
              <input
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="mt-1 h-10 w-full rounded-sm border border-gold/30 bg-white/80 px-3 font-mono"
                placeholder="123"
                autoComplete="cc-csc"
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={processing || busy}>
            {processing ? "Autorisation…" : `Payer ${formatPrice(amountEur)}`}
          </Button>
          <p className="text-[11px] leading-5 text-stone">
            Visa et Mastercard acceptées. En démo sans clé Stripe, le paiement est simulé de façon
            sécurisée côté serveur (aucune carte n&apos;est stockée).
          </p>
        </form>
      )}
    </div>
  );
}
