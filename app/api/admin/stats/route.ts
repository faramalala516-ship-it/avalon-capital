import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    users: 1284,
    activeSubscriptions: 412,
    monthlyRecurringRevenue: 286_700,
    reportsPublished: 37,
    gemstonesListed: 64,
    logs: [
      { level: "info", message: "Weekly research generated", at: new Date().toISOString() },
      { level: "info", message: "Trading scanner refreshed", at: new Date().toISOString() }
    ]
  });
}
