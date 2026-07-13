import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/api-status";

export function GET() {
  const integrations = getIntegrationStatus();

  return NextResponse.json({
    status: "ok",
    service: "avalon-capital",
    timestamp: new Date().toISOString(),
    checks: {
      openai: integrations.openai.status,
      stripe: integrations.stripe.status,
      clerk: integrations.clerk.status,
      antiHallucinationProtocol: "enabled"
    }
  });
}
