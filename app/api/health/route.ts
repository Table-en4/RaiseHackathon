import { NextResponse } from "next/server";
import { checkLlmHealth } from "@/lib/agent/llm-client";

export async function GET() {
  const llmOk = await checkLlmHealth();

  return NextResponse.json({
    status: "ok",
    llm: llmOk ? "reachable" : "unreachable",
    ts: Date.now(),
  });
}
