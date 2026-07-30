import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "gemstoneyeshootingallery",
    domain: "www.gemstoneyeshootingallery.com",
    timestamp: new Date().toISOString()
  });
}
