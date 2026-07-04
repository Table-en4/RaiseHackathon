"use client";

import type { BidAdvisory } from "@/lib/contracts";

type PriceBandProps = {
  advisory: BidAdvisory | null;
  currentBid: number;
  maxBid: number;
  onMaxBidChange: (value: number) => void;
};

export function PriceBand({ advisory, currentBid, maxBid, onMaxBidChange }: PriceBandProps) {
  if (!advisory) {
    return (
      <div className="rounded-xl border border-dashed border-stone-700 p-4 text-sm text-stone-500">
        Advisory band appears when a lot heats up.
      </div>
    );
  }

  const low = advisory.comparables.length
    ? Math.min(...advisory.comparables.map((item) => item.soldPrice))
    : currentBid;
  const high = advisory.comparables.length
    ? Math.max(...advisory.comparables.map((item) => item.soldPrice))
    : advisory.suggestedMax;

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4">
      <div className="mb-2 flex justify-between text-xs uppercase tracking-wider text-stone-500">
        <span>Comparable band</span>
        <span>{Math.round(advisory.confidence * 100)}% confidence</span>
      </div>
      <div className="relative h-2 rounded-full bg-stone-800">
        <div
          className="absolute inset-y-0 rounded-full bg-amber-500/30"
          style={{ left: "10%", right: "20%" }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-400"
          style={{ left: `${Math.min(90, (currentBid / high) * 80 + 10)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-400">
        <span>€{low}</span>
        <span>€{high}</span>
      </div>
      <label className="mt-4 block text-xs text-stone-500">
        Your max bid
        <input
          type="range"
          min={currentBid}
          max={Math.max(advisory.suggestedMax + 50, currentBid + 10)}
          value={maxBid}
          onChange={(event) => onMaxBidChange(Number(event.target.value))}
          className="mt-2 w-full accent-amber-500"
        />
        <span className="mt-1 block text-sm text-amber-300">€{maxBid}</span>
      </label>
    </div>
  );
}
