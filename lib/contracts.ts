export type LotPlatform = "ebay" | "drouot" | "catawiki" | "house";

export type LotEvent = {
  id: string;
  ts: number;
  lotId: string;
  title: string;
  platform: LotPlatform;
  imageUrl?: string;
  currentBid: number;
  currency: string;
  bidCount: number;
  closesInSec: number;
  category: string;
  attributes?: Record<string, string>;
};

export type Comparable = {
  title: string;
  soldPrice: number;
  source: string;
  date: string;
};

export type BidAdvisory = {
  lotId: string;
  suggestedMax: number;
  currency: string;
  confidence: number;
  materialRead?: string;
  comparables: Comparable[];
  advisory: string;
  rationale: string;
  learnsFrom?: string;
};

export type PlaceBidRequest = {
  lotId: string;
  maxBid: number;
};

export type PlaceBidResponse = {
  ok: boolean;
  lotId: string;
  maxBid: number;
};
