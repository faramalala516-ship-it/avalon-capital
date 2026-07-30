import Link from "next/link";
import { ArrowRight, Aperture, Landmark, Sparkles } from "lucide-react";
import { PearlBackground } from "@/components/pearl-background";
import { ProtectedPhoto } from "@/components/protected-photo";
import { Button } from "@/components/ui/button";
import { getCurrentCollection } from "@/lib/gallery-data";

export default function HomePage() {
  const collection = getCurrentCollection();
  const hero = collection.photos.find((p) => p.featured) ?? collection.photos[0];

  return (
    <main>
      <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden">
        <PearlBackground />
        <div className="absolute inset-0">
          <ProtectedPhoto
            src={hero.imageUrl}
            alt={hero.title}
            priority
            className="h-full min-h-[calc(100vh-4.5rem)] w-full"
            watermark="Gem'StonEye · shooting Madagascar"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foam/92 via-foam/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-foam via-transparent to-foam/30" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 md:justify-center md:pb-24">
          <p className="animate-fadeRise text-[11px] uppercase tracking-[0.32em] text-gold-deep">
            Europe · Minerais de Madagascar
          </p>
          <h1 className="mt-4 max-w-3xl animate-fadeRise font-display text-5xl leading-[0.95] text-aqua-deep sm:text-6xl md:text-7xl">
            <span className="nacre-text">Gem&apos;StonEye&apos;Shootin&apos;Gallery</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fadeRise text-lg leading-8 text-stone-deep" style={{ animationDelay: ".12s" }}>
            Photographies minérales pour expositions, foires, livres &amp; magazines de gemmologie — et pour
            les collectionneurs qui souhaitent de beaux tableaux.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fadeRise" style={{ animationDelay: ".22s" }}>
            <Button asChild size="lg">
              <Link href="/galerie">
                Entrer dans la galerie <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/espace">Ouvrir ma page personnelle</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-gold-deep">Présentation</p>
          <h2 className="mt-3 font-display text-4xl text-aqua-deep md:text-5xl">
            Une création physique, époustouflante à regarder
          </h2>
          <p className="mt-5 text-base leading-8 text-stone">
            Chaque cliché est un objet d&apos;édition : lumière aquatique, grain pierreux, or nacré. Le
            concierge IA — gallériste gemmologue et photographe — vous oriente vers le format juste, la
            collection du mois, ou le salon privé des enchères.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Aperture,
              title: "Formats licenciés",
              text: "Éditorial A4, exposition, Fine Art tableau, double page livre — tarif selon le rendu."
            },
            {
              icon: Sparkles,
              title: "Concierge IA",
              text: "Pilotage du parcours : gemmologie, photographie, archives mensuelles, salle privée."
            },
            {
              icon: Landmark,
              title: "Preuve d'appartenance",
              text: "Virement SEPA/SWIFT, certificat blockchain GSES-Ledger et QR pour chaque vente."
            }
          ].map((item) => (
            <div key={item.title} className="pearl-panel rounded-sm p-6">
              <item.icon className="h-6 w-6 text-gold-deep" />
              <h3 className="mt-4 font-display text-2xl text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-gold/20 bg-aqua-deep py-20 text-foam">
        <div className="stone-grain absolute inset-0 opacity-25" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 md:grid md:grid-cols-2 md:items-center md:gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">Collection du mois</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">
              {collection.label} — {collection.theme}
            </h2>
            <p className="mt-4 max-w-md text-base leading-8 text-aqua-mist">{collection.intro}</p>
            <Button asChild size="lg" variant="gold" className="mt-8">
              <Link href="/galerie">Voir les clichés à la vente</Link>
            </Button>
          </div>
          <div className="mt-10 md:mt-0">
            <ProtectedPhoto
              src={collection.photos[1]?.imageUrl ?? hero.imageUrl}
              alt={collection.theme}
              className="aspect-[5/4] w-full"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
