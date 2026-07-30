import { NextResponse } from "next/server";
import { collections, IMAGE_FORMATS, SUBSCRIPTION, BANK_TRANSFER } from "@/lib/gallery-data";

export function GET() {
  return NextResponse.json({
    collections,
    formats: IMAGE_FORMATS,
    subscription: SUBSCRIPTION,
    payment: {
      method: "international_bank_transfer",
      ...BANK_TRANSFER
    }
  });
}
