import { BANK_TRANSFER, formatPrice } from "@/lib/gallery-data";

export function BankTransferPanel({
  reference,
  amountEur
}: {
  reference: string;
  amountEur: number;
}) {
  return (
    <div className="rounded-sm border border-gold/30 bg-white/70 p-4 text-sm leading-7 text-ink">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">Virement international</p>
      <p className="mt-2 font-display text-2xl text-aqua-deep">{formatPrice(amountEur)}</p>
      <dl className="mt-3 space-y-1 text-stone-deep">
        <div className="flex justify-between gap-4">
          <dt>Bénéficiaire</dt>
          <dd className="text-right">{BANK_TRANSFER.beneficiary}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>IBAN</dt>
          <dd className="text-right font-mono text-xs">{BANK_TRANSFER.iban}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>BIC</dt>
          <dd className="text-right font-mono text-xs">{BANK_TRANSFER.bic}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Banque</dt>
          <dd className="text-right">{BANK_TRANSFER.bank}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Libellé</dt>
          <dd className="text-right font-semibold">{reference}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-stone">{BANK_TRANSFER.note}</p>
    </div>
  );
}
