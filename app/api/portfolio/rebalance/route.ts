import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  riskProfile: z.enum(["conservative", "balanced", "growth"]).default("balanced"),
  aum: z.number().positive().default(1_000_000)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const weights =
    parsed.data.riskProfile === "conservative"
      ? { equities: 0.28, bonds: 0.32, gold: 0.14, gemstones: 0.06, alternatives: 0.1, cash: 0.1 }
      : parsed.data.riskProfile === "growth"
        ? { equities: 0.48, bonds: 0.12, gold: 0.1, gemstones: 0.08, alternatives: 0.17, cash: 0.05 }
        : { equities: 0.34, bonds: 0.18, gold: 0.12, gemstones: 0.08, alternatives: 0.16, cash: 0.12 };

  return NextResponse.json({
    weights,
    orders: Object.entries(weights).map(([assetClass, weight]) => ({
      assetClass,
      targetAmount: Math.round(parsed.data.aum * weight)
    })),
    risk: {
      var95: 0.042,
      expectedDrawdown: 0.087,
      averageCorrelation: 0.31
    }
  });
}
