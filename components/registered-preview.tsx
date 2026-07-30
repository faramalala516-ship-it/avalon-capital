"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Lock, X, ZoomIn } from "lucide-react";
import { ProtectedPhoto } from "@/components/protected-photo";
import { Button } from "@/components/ui/button";
import { readStoredUser, type GalleryUser } from "@/lib/session";
import type { GalleryPhoto } from "@/lib/gallery-data";

/**
 * Preview parcel: unlocked only for registered visitors.
 * Shows a clearer, larger inspection view before payment (still no download).
 */
export function RegisteredPreview({ photo }: { photo: GalleryPhoto }) {
  const [user, setUser] = useState<GalleryUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener("gses-user-updated", sync);
    return () => window.removeEventListener("gses-user-updated", sync);
  }, []);

  if (!user) {
    return (
      <div className="pearl-panel rounded-sm p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
          <div>
            <p className="font-display text-xl text-aqua-deep">Aperçu avant achat</p>
            <p className="mt-1 text-sm leading-6 text-stone">
              Enregistrez-vous avec votre e-mail pour inspecter le cliché en grand format avant de
              payer. L&apos;abonnement premium n&apos;est pas requis pour acheter.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/espace">S&apos;enregistrer pour prévisualiser</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pearl-panel rounded-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-aqua-deep" />
            <div>
              <p className="font-display text-xl text-aqua-deep">Aperçu membre</p>
              <p className="mt-1 text-sm text-stone">
                Bonjour {user.name} — inspectez le cliché avant paiement (téléchargement bloqué).
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            <ZoomIn className="h-4 w-4" />
            Voir le cliché
          </Button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-aqua-deep/80 p-4 backdrop-blur-md">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-sm border border-gold/30 bg-foam p-4 shadow-pearl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-deep">
                  Prévisualisation membre · non téléchargeable
                </p>
                <h3 className="font-display text-2xl text-aqua-deep">{photo.title}</h3>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-gold/30 bg-white/70 p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProtectedPhoto
              src={photo.imageUrl}
              alt={photo.title}
              className="max-h-[70vh] min-h-[24rem] w-full"
              fit="contain"
              watermark="Aperçu membre · GSES · non commercial"
            />
            <p className="mt-3 text-xs leading-5 text-stone">
              Cet aperçu est réservé aux comptes enregistrés. Pour obtenir le master et le certificat
              blockchain, choisissez un format puis payez par carte ou virement — sans abonnement
              premium.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
