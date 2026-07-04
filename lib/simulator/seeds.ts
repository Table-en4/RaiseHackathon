import type { LotEvent } from "@/lib/contracts";

export type LotSeed = {
  lotId: string;
  title: string;
  platform: LotEvent["platform"];
  imageUrl?: string;
  startingBid: number;
  currency: string;
  category: string;
  attributes?: Record<string, string>;
  initialClosesInSec: number;
};

export const DEMO_LOTS: LotSeed[] = [
  {
    lotId: "41",
    title: "Bakelite bangle — butterscotch swirl",
    platform: "ebay",
    startingBid: 45,
    currency: "EUR",
    category: "phenolic-resin",
    attributes: { material: "bakelite", era: "1930s" },
    initialClosesInSec: 420,
  },
  {
    lotId: "42",
    title: "Catalin desk set — green marbleized",
    platform: "catawiki",
    startingBid: 120,
    currency: "EUR",
    category: "phenolic-resin",
    attributes: { material: "catalin" },
    initialClosesInSec: 360,
  },
  {
    lotId: "43",
    title: "Faturan prayer beads — amber tone",
    platform: "drouot",
    startingBid: 180,
    currency: "EUR",
    category: "phenolic-resin",
    attributes: { material: "faturan", provenance: "Levant" },
    initialClosesInSec: 300,
  },
  {
    lotId: "44",
    title: "Galalith brooch — art deco floral",
    platform: "house",
    startingBid: 65,
    currency: "EUR",
    category: "phenolic-resin",
    initialClosesInSec: 480,
  },
  {
    lotId: "47",
    title: "Faturan sphere — 52mm, honey amber",
    platform: "drouot",
    imageUrl: "/lots/faturan-sphere.jpg",
    startingBid: 120,
    currency: "EUR",
    category: "phenolic-resin",
    attributes: { material: "faturan", diameter: "52mm", read: "catalin-like translucency" },
    initialClosesInSec: 180,
  },
];
