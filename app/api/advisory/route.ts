import { NextRequest, NextResponse } from "next/server";
import type { LotEvent } from "@/lib/contracts";
import { generateAdvisory } from "@/lib/agent";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { lot?: LotEvent };
  if (!body.lot?.lotId) {
    return NextResponse.json({ error: "lot required" }, { status: 400 });
  }

  const advisory = await generateAdvisory(body.lot);
  return NextResponse.json(advisory);
}
