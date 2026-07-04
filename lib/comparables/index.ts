import type { LotEvent } from "@/lib/contracts";

export type ComparableResult = {
  title: string;
  soldPrice: number;
  source: string;
  date: string;
};

export type SuggestedBand = {
  low: number;
  high: number;
  suggestedMax: number;
  currency: string;
};

const SEED_COMPARABLES: ComparableResult[] = [
  {
    title: "Faturan sphere 48mm — honey",
    soldPrice: 245,
    source: "Catawiki",
    date: "2025-11-12",
  },
  {
    title: "Catalin sphere 50mm — amber",
    soldPrice: 210,
    source: "Drouot",
    date: "2025-09-03",
  },
  {
    title: "Bakelite sphere lot — mixed tones",
    soldPrice: 175,
    source: "eBay",
    date: "2026-01-18",
  },
];

export async function getComparables(lot: LotEvent): Promise<ComparableResult[]> {
  return SEED_COMPARABLES.filter((item) =>
    item.title.toLowerCase().includes(lot.category.split("-")[0] ?? "resin"),
  ).slice(0, 3);
}

export async function getSuggestedBand(lot: LotEvent): Promise<SuggestedBand> {
  const comparables = await getComparables(lot);
  const prices = comparables.map((item) => item.soldPrice);
  const low = prices.length ? Math.min(...prices) : lot.currentBid * 1.2;
  const high = prices.length ? Math.max(...prices) : lot.currentBid * 1.8;
  const suggestedMax = Math.round((low + high) / 2);

  return {
    low,
    high,
    suggestedMax,
    currency: lot.currency,
  };
}
