import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memberModules } from "@/lib/data";

export default function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-bullion">
            <UserCog className="h-4 w-4" />
            Investor profile
          </p>
          <h1 className="text-4xl font-semibold text-white md:text-6xl">Profil membre</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Profil demo pour previsualiser les permissions, preferences d&apos;investissement, alertes et modules
            disponibles apres connexion.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div className="glass rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white">Compte demo</h2>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ["Plan", "Premium Gold"],
                  ["Profil risque", "Equilibre dynamique"],
                  ["Horizon", "Daily + swing trade"],
                  ["Permissions", "Agents macro, sentiment, risque"]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-semibold text-white">{value}</dd>
                  </div>
                ))}
              </dl>
              <Button asChild className="mt-6 w-full">
                <Link href="/dashboard">Retour au dashboard</Link>
              </Button>
            </div>
            <div className="glass rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white">Modules rattaches au profil</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {memberModules.map((module) => (
                  <div key={module} className="rounded-md border border-white/10 bg-black/25 p-3 text-sm text-slate-300">
                    {module}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center px-4 py-10">
      <UserProfile path="/profil" routing="path" />
    </main>
  );
}
