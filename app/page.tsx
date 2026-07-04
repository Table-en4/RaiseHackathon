"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdvisoryHero } from "@/components/AdvisoryHero";
import { LotFeed } from "@/components/LotFeed";
import { PriceBand } from "@/components/PriceBand";
import type { BidAdvisory } from "@/lib/contracts";
import { useLotFeed } from "@/hooks/useLotFeed";

export default function HomePage() {
  const { activeLots, connected, error } = useLotFeed();
  const heatingLotId = useMemo(
    () => activeLots.find((lot) => lot.closesInSec <= 90)?.lotId ?? null,
    [activeLots],
  );
  const [manualLotId, setManualLotId] = useState<string | null>(null);
  const selectedLotId = manualLotId ?? heatingLotId;

  const [advisory, setAdvisory] = useState<BidAdvisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxBid, setMaxBid] = useState(200);
  const [bidPlaced, setBidPlaced] = useState(false);

  const selectedLot = activeLots.find((lot) => lot.lotId === selectedLotId) ?? null;
  const shouldFetchAdvisory = selectedLot !== null && selectedLot.closesInSec <= 120;

  useEffect(() => {
    if (!shouldFetchAdvisory || !selectedLot) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
    }, 0);

    fetch("/api/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot: selectedLot }),
    })
      .then((response) => response.json())
      .then((data: BidAdvisory) => {
        if (!cancelled) {
          setAdvisory(data);
          setMaxBid(data.suggestedMax);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedLot, shouldFetchAdvisory]);

  const displayAdvisory = shouldFetchAdvisory ? advisory : null;

  const placeBid = useCallback(async () => {
    if (!selectedLot) return;
    await fetch("/api/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lotId: selectedLot.lotId, maxBid }),
    });
    setBidPlaced(true);
  }, [selectedLot, maxBid]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Gavel</p>
          <h1 className="text-xl text-stone-200">Live-auction bidding copilot</h1>
        </div>
        <div className="text-right text-xs text-stone-500">
          <p>SSE: {connected ? "connected" : "disconnected"}</p>
          {error && <p className="text-red-400">{error}</p>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <LotFeed
          lots={activeLots}
          selectedLotId={selectedLotId}
          onSelect={(lotId) => {
            setManualLotId(lotId);
            setBidPlaced(false);
          }}
        />
        <div className="space-y-4">
          <AdvisoryHero
            lot={selectedLot}
            advisory={displayAdvisory}
            loading={loading && shouldFetchAdvisory}
            onPlaceBid={placeBid}
            bidPlaced={bidPlaced}
          />
          <PriceBand
            advisory={displayAdvisory}
            currentBid={selectedLot?.currentBid ?? 0}
            maxBid={maxBid}
            onMaxBidChange={setMaxBid}
          />
        </div>
      </div>
    </main>
  );
}
