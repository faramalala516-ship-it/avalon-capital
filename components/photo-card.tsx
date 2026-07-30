"use client";

import Link from "next/link";
import { ProtectedPhoto } from "@/components/protected-photo";
import { formatPrice, type GalleryPhoto } from "@/lib/gallery-data";

export function PhotoCard({ photo }: { photo: GalleryPhoto }) {
  return (
    <article className="group animate-fadeRise">
      <Link href={`/galerie/${photo.slug}`} className="block">
        <ProtectedPhoto
          src={photo.imageUrl}
          alt={photo.title}
          className="aspect-[4/5] w-full"
          watermark="Aperçu protégé · GSES"
        />
      </Link>
      <div className="mt-4 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold-deep">{photo.mineral}</p>
        <h3 className="font-display text-2xl text-aqua-deep">{photo.title}</h3>
        <p className="text-sm leading-6 text-stone">{photo.description}</p>
        <div className="flex items-end justify-between gap-3 pt-1">
          <p className="text-sm text-stone-deep">
            <span className="text-xs uppercase tracking-[0.16em] text-stone-soft">À partir de</span>
            <br />
            <span className="font-display text-xl text-ink">{formatPrice(photo.priceEur)}</span>
          </p>
          <Link
            href={`/galerie/${photo.slug}`}
            className="text-sm text-aqua-deep underline-offset-4 hover:underline"
          >
            Voir &amp; choisir le format
          </Link>
        </div>
      </div>
    </article>
  );
}
