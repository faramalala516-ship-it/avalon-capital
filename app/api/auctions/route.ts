import { NextResponse } from "next/server";
import { auctionLots } from "@/lib/gallery-data";

export function GET() {
  return NextResponse.json({
    lots: auctionLots,
    note: "Accès salle réservé aux abonnés Salon Privé"
  });
}
