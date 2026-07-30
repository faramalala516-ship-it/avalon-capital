"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { readStoredUser, type GalleryUser } from "@/lib/session";

const links = [
  { href: "/", label: "Présentation" },
  { href: "/galerie", label: "Galerie shooting" },
  { href: "/espace", label: "Espace personnel" },
  { href: "/salle-encheres", label: "Salle des enchères" }
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<GalleryUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener("gses-user-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("gses-user-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-foam/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 flex-col">
          <span className="font-display text-xl leading-none tracking-tight text-aqua-deep sm:text-2xl">
            Gem&apos;StonEye&apos;Shootin&apos;Gallery
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-gold-deep">
            www.gemstoneyeshootingallery.com
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-sm px-3 py-2 text-sm transition",
                pathname === link.href
                  ? "bg-aqua-deep/10 text-aqua-deep"
                  : "text-stone-deep hover:bg-nacre/70 hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/espace"
            className="hidden rounded-sm border border-gold/35 bg-white/50 px-3 py-1.5 text-xs text-stone-deep sm:inline-flex"
          >
            {user ? user.name : "S'enregistrer"}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-gold/30 bg-white/40 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-gold/15 bg-foam/95 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-2 text-sm text-ink hover:bg-nacre/80"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
