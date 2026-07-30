import { issueCertificate } from "@/lib/blockchain";

type Props = { params: Promise<{ id: string }> };

export default async function CertificatPage({ params }: Props) {
  const { id } = await params;
  const sample = issueCertificate({
    photoId: "verified",
    photoTitle: "Certificat public",
    ownerEmail: "verifie@gemstoneyeshootingallery.com",
    ownerName: "Vérification publique",
    formatId: "editorial-a4",
    amountEur: 0
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.24em] text-gold-deep">Registre GSES-Ledger</p>
      <h1 className="mt-3 font-display text-4xl text-aqua-deep">Certificat {id}</h1>
      <div className="pearl-panel mt-8 space-y-3 rounded-sm p-6 text-sm leading-7 text-stone-deep">
        <p>
          Chaîne : <strong>{sample.chain}</strong>
        </p>
        <p>
          Identifiant demandé : <strong className="break-all">{id}</strong>
        </p>
        <p>
          Les certificats définitifs sont émis à la confirmation du virement et visibles dans l&apos;espace
          personnel de l&apos;acquéreur, avec QR d&apos;appartenance et empreinte SHA-256.
        </p>
        <p className="text-xs text-stone">
          Domaine de vérification : www.gemstoneyeshootingallery.com
        </p>
      </div>
    </main>
  );
}
