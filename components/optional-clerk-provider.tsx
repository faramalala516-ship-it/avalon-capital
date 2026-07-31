import { ClerkProvider } from "@clerk/nextjs";

function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  if (!key) return false;
  if (key.includes("placeholder") || key.includes("replace_me")) return false;
  return key.startsWith("pk_");
}

export function OptionalClerkProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
