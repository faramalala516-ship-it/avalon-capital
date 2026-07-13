import { NextResponse } from "next/server";
import { reports } from "@/lib/data";

export function GET() {
  return NextResponse.json({ reports });
}
