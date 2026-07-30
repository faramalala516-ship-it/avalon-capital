import Link from "next/link";
import { BANK_TRANSFER } from "@/lib/gallery-data";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-gold/20 bg-aqua-deep text-foam">
      <div className="stone-grain pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_.9fr_.9fr]">
        <div>
          <p className="font-display text-3xl">Gem&apos;StonEye&apos;Shootin&apos;Gallery</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-aqua-mist">
            Photographies de minerais de Madagascar pour expositions, foires, ouvrages de gemmologie et
            collectionneurs. Europe · virement international compte à compte.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Parcours</p>
          <ul className="mt-4 space-y-2 text-sm text-aqua-mist">
            <li>
              <Link href="/" className="hover:text-foam">
                Présentation
              </Link>
            </li>
            <li>
              <Link href="/galerie" className="hover:text-foam">
                Galerie shooting
              </Link>
            </li>
            <li>
              <Link href="/espace" className="hover:text-foam">
                Espace personnel
              </Link>
            </li>
            <li>
              <Link href="/salle-encheres" className="hover:text-foam">
                Salle des enchères
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Règlement</p>
          <p className="mt-4 text-sm leading-7 text-aqua-mist">
            {BANK_TRANSFER.beneficiary}
            <br />
            IBAN · sur facture de commande
            <br />
            BIC · {BANK_TRANSFER.bic}
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-4 text-center text-xs text-aqua-soft/80">
        © {new Date().getFullYear()} Gem&apos;StonEye&apos;Shootin&apos;Gallery — www.gemstoneyeshootingallery.com
      </div>
    </footer>
  );
}
