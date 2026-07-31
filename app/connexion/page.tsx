import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("replace_me")
  ) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-bullion">
              <LockKeyhole className="h-4 w-4" />
              Secure member access
            </p>
            <h1 className="text-4xl font-semibold text-white md:text-6xl">Connexion Avalon</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Accedez au dashboard personnel, au journal IA, aux trades suggeres, aux alertes et aux preferences
              d&apos;investissement. L&apos;authentification Clerk est prete a activer dans l&apos;environnement.
            </p>
          </div>
          <div className="glass rounded-lg p-6">
            <ShieldCheck className="mb-4 h-8 w-8 text-bullion" />
            <h2 className="text-2xl font-semibold text-white">Mode demo securise</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Clerk n&apos;est pas encore configure. Vous pouvez explorer l&apos;espace membre en demonstration pendant
              que les roles, abonnements et permissions restent prevus dans l&apos;architecture.
            </p>
            <Button asChild className="mt-5 w-full">
              <Link href="/dashboard">Continuer en demo</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignIn routing="path" path="/connexion" signUpUrl="/inscription" />
    </main>
  );
}
