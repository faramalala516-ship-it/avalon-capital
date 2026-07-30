import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { AiConcierge } from "@/components/ai-concierge";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display"
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gemstoneyeshootingallery.com"),
  title: {
    default: "Gem'StonEye'Shootin'Gallery",
    template: "%s · Gem'StonEye'Shootin'Gallery"
  },
  description:
    "Galerie européenne de photographies de minerais de Madagascar — expositions, foires, livres de gemmologie et tableaux Fine Art. Concierge IA, formats licenciés, certificats blockchain.",
  keywords: [
    "photographie minerais",
    "Madagascar",
    "gemmologie",
    "foire aux minerais",
    "Fine Art",
    "Gem'StonEye'Shootin'Gallery"
  ],
  openGraph: {
    title: "Gem'StonEye'Shootin'Gallery",
    description: "La beauté minérale de Madagascar, photographiée pour l'Europe.",
    type: "website",
    url: "https://www.gemstoneyeshootingallery.com"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <SiteNav />
        {children}
        <SiteFooter />
        <AiConcierge />
      </body>
    </html>
  );
}
