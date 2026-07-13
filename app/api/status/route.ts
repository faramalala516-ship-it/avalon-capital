import { NextResponse } from "next/server";
import { getApiStatus } from "@/lib/api-status";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getApiStatus());
}
