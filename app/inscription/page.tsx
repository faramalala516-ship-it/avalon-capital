import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="glass max-w-md rounded-lg p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Inscription</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Clerk est pret a connecter. Ajoutez les cles dans `.env` pour activer l&apos;inscription et Google OAuth.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard">Explorer la demo</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <SignUp routing="path" path="/inscription" signInUrl="/connexion" />
    </main>
  );
}
