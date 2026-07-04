import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { getSimulator } from "@/lib/simulator";

export async function POST(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_TOKEN not configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-admin-token");
  if (provided !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`admin-heat-up:${clientIp}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSec: limit.retryAfterSec },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { lotId?: string };
  if (!body.lotId) {
    return NextResponse.json({ error: "lotId required" }, { status: 400 });
  }

  const simulator = getSimulator();
  const heated = simulator.heatUp(body.lotId);
  if (!heated) {
    return NextResponse.json({ error: `Unknown lotId: ${body.lotId}` }, { status: 404 });
  }

  return NextResponse.json({ ok: true, lotId: body.lotId });
}
