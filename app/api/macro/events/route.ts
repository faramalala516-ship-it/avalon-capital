import { NextResponse } from "next/server";
import { macroIndicators } from "@/lib/data";

export function GET() {
  return NextResponse.json({
    indicators: macroIndicators,
    centralBanks: [
      { bank: "FED", stance: "Restrictive pause", nextMeeting: "2026-07-29" },
      { bank: "BCE", stance: "Selective easing", nextMeeting: "2026-07-23" },
      { bank: "BoJ", stance: "Gradual normalisation", nextMeeting: "2026-07-31" }
    ]
  });
}
