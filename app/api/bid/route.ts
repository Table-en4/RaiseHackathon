import { NextRequest, NextResponse } from "next/server";
import type { PlaceBidRequest } from "@/lib/contracts";
import { recordTasteDecision } from "@/lib/taste";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PlaceBidRequest;

  if (!body.lotId || typeof body.maxBid !== "number") {
    return NextResponse.json({ error: "lotId and maxBid required" }, { status: 400 });
  }

  recordTasteDecision(body.lotId, body.maxBid);

  return NextResponse.json({
    ok: true,
    lotId: body.lotId,
    maxBid: body.maxBid,
  });
}
