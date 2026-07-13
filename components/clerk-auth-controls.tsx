"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClerkAuthControls() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <Button asChild variant="ghost" size="sm">
          <Link href="/connexion">
            <LockKeyhole className="h-4 w-4" />
            Connexion
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/inscription">Inscription</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
