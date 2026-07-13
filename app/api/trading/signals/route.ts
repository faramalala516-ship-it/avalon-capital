import { NextResponse } from "next/server";
import { signals } from "@/lib/data";

export function GET() {
  return NextResponse.json({ signals });
}
