import type { BidAdvisory, LotEvent } from "@/lib/contracts";
import { getComparables, getSuggestedBand } from "@/lib/comparables";
import { callLlm } from "@/lib/agent/llm-client";
import { getTasteContext } from "@/lib/taste";

const ADVISORY_PROMPT = `You are Gavel, a calm live-auction bidding copilot.
Return ONLY valid JSON matching this schema:
{
  "lotId": string,
  "suggestedMax": number,
  "currency": string,
  "confidence": number,
  "materialRead": string,
  "comparables": [{ "title": string, "soldPrice": number, "source": string, "date": string }],
  "advisory": string,
  "rationale": string,
  "learnsFrom": string
}`;

export async function generateAdvisory(lot: LotEvent): Promise<BidAdvisory> {
  const comparables = await getComparables(lot);
  const band = await getSuggestedBand(lot);
  const taste = getTasteContext(lot.lotId);

  const payload = {
    lot,
    comparables,
    band,
    taste,
  };

  try {
    const raw = await callLlm([
      { role: "system", content: ADVISORY_PROMPT },
      { role: "user", content: JSON.stringify(payload) },
    ]);

    const parsed = JSON.parse(raw) as BidAdvisory;
    if (!parsed.lotId || typeof parsed.suggestedMax !== "number") {
      throw new Error("Malformed advisory JSON");
    }
    return parsed;
  } catch {
    return fallbackAdvisory(lot, comparables, band, taste);
  }
}

function fallbackAdvisory(
  lot: LotEvent,
  comparables: BidAdvisory["comparables"],
  band: { suggestedMax: number; currency: string; low: number; high: number },
  taste: string | undefined,
): BidAdvisory {
  const material = lot.attributes?.material ?? "phenolic resin";
  return {
    lotId: lot.lotId,
    suggestedMax: band.suggestedMax,
    currency: band.currency,
    confidence: 0.72,
    materialRead: `Reads as ${material}; verify under warm light.`,
    comparables,
    advisory: `You're at €${lot.currentBid} with ${lot.closesInSec}s left. Comparable ${material} lots sold €${band.low}–${band.high}. Suggested max €${band.suggestedMax}. Bid?`,
    rationale: "Derived from seed comparables and current bid velocity.",
    learnsFrom: taste,
  };
}
