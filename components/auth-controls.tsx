import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { ClerkAuthControls } from "@/components/clerk-auth-controls";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <ClerkAuthControls />;
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/connexion">
          <LockKeyhole className="h-4 w-4" />
          Connexion
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/inscription">Inscription</Link>
      </Button>
    </div>
  );
}
