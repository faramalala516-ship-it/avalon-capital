import { NextResponse } from "next/server";
import { z } from "zod";
import { issueCertificate } from "@/lib/blockchain";

const schema = z.object({
  photoId: z.string().min(1),
  photoTitle: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1),
  formatId: z.string().min(1),
  amountEur: z.number().positive()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données certificat invalides" }, { status: 400 });
  }

  const certificate = issueCertificate(parsed.data);
  return NextResponse.json(certificate);
}
