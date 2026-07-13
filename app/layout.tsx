import type { Metadata } from "next";
import { OptionalClerkProvider } from "@/components/optional-clerk-provider";
import { AppNavigation } from "@/components/app-navigation";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://avalon-capital.vercel.app"),
  title: {
    default: "Avalon Capital | AI Financial Intelligence",
    template: "%s | Avalon Capital"
  },
  description:
    "Plateforme premium d'intelligence financiere assistee par IA: sentiment de marche, politique monetaire, agents IA, signaux de trading et gestion du risque.",
  keywords: [
    "Avalon Capital",
    "market sentiment intelligence",
    "IA trading",
    "agents IA finance",
    "politique monetaire",
    "macro research",
    "gestion du risque",
    "trading assiste par IA"
  ],
  openGraph: {
    title: "Avalon Capital",
    description: "AI financial intelligence terminal for global markets.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <OptionalClerkProvider>
      <html lang="fr" className="dark">
        <body className="font-sans antialiased">
          <AppNavigation />
          {children}
        </body>
      </html>
    </OptionalClerkProvider>
  );
}
