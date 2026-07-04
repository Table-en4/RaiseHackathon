"use client";

import { useEffect, useState } from "react";
import type { LotEvent } from "@/lib/contracts";

type FeedState = {
  lots: Record<string, LotEvent>;
  connected: boolean;
  error: string | null;
};

export function useLotFeed(): FeedState & { activeLots: LotEvent[] } {
  const [lots, setLots] = useState<Record<string, LotEvent>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/feed");

    source.addEventListener("lot", (message) => {
      const event = JSON.parse(message.data) as LotEvent;
      setLots((current) => ({ ...current, [event.lotId]: event }));
    });

    source.onopen = () => {
      setConnected(true);
      setError(null);
    };

    source.onerror = () => {
      setConnected(false);
      setError("SSE connection lost");
    };

    return () => source.close();
  }, []);

  const activeLots = Object.values(lots).sort((a, b) => a.closesInSec - b.closesInSec);

  return { lots, activeLots, connected, error };
}
