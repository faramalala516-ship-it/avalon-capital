import { NextResponse } from "next/server";
import { gems } from "@/lib/data";

export function GET() {
  return NextResponse.json({ gemstones: gems });
}
