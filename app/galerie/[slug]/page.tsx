import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedPhoto } from "@/components/protected-photo";
import { FormatPurchase } from "@/components/format-purchase";
import { RegisteredPreview } from "@/components/registered-preview";
import { formatPrice, getPhotoBySlug } from "@/lib/gallery-data";

type Props = { params: Promise<{ slug: string }> };

export default async function PhotoDetailPage({ params }: Props) {
  const { slug } = await params;
  const match = getPhotoBySlug(slug);
  if (!match) notFound();

  const { photo, collection } = match;

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-deep">
        <Link href="/galerie" className="hover:underline">
          Galerie
        </Link>{" "}
        / {collection.label}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <ProtectedPhoto
            src={photo.imageUrl}
            alt={photo.title}
            priority
            className="aspect-[4/5] w-full"
          />
          <RegisteredPreview photo={photo} />
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">{photo.mineral}</p>
            <h1 className="mt-2 font-display text-4xl text-aqua-deep md:text-5xl">{photo.title}</h1>
            <p className="mt-2 text-sm text-stone">{photo.locality}</p>
            <p className="mt-5 text-base leading-8 text-stone-deep">{photo.description}</p>
            <p className="mt-4 text-sm italic text-stone">{photo.technicalNote}</p>
            <p className="mt-6 font-display text-3xl text-ink">
              à partir de {formatPrice(photo.priceEur)}
            </p>
          </div>
          <FormatPurchase photo={photo} />
        </div>
      </div>
    </main>
  );
}
