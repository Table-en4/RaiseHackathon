import type { LotEvent } from "@/lib/contracts";
import { DEMO_LOTS, type LotSeed } from "@/lib/simulator/seeds";

type InternalLot = LotSeed & {
  currentBid: number;
  bidCount: number;
  closesInSec: number;
  heatMultiplier: number;
  sequence: number;
};

const TICK_MS = 1000;

function createInternalLot(seed: LotSeed): InternalLot {
  return {
    ...seed,
    currentBid: seed.startingBid,
    bidCount: Math.floor(Math.random() * 4),
    closesInSec: seed.initialClosesInSec,
    heatMultiplier: 1,
    sequence: 0,
  };
}

class AuctionSimulator {
  private lots: Map<string, InternalLot>;
  private listeners = new Set<(event: LotEvent) => void>();
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.lots = new Map(DEMO_LOTS.map((seed) => [seed.lotId, createInternalLot(seed)]));
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }

  subscribe(listener: (event: LotEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): LotEvent[] {
    return Array.from(this.lots.values()).map((lot) => this.toLotEvent(lot));
  }

  heatUp(lotId: string) {
    const lot = this.lots.get(lotId);
    if (!lot) return false;
    lot.heatMultiplier = 4;
    lot.closesInSec = Math.min(lot.closesInSec, 90);
    return true;
  }

  getLot(lotId: string): LotEvent | null {
    const lot = this.lots.get(lotId);
    return lot ? this.toLotEvent(lot) : null;
  }

  private tick() {
    for (const lot of this.lots.values()) {
      this.advanceLot(lot);
      const event = this.toLotEvent(lot);
      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }

  private advanceLot(lot: InternalLot) {
    lot.sequence += 1;
    const heated = lot.heatMultiplier > 1;

    if (heated && Math.random() < 0.55 * lot.heatMultiplier) {
      const increment = 5 + Math.floor(Math.random() * 20);
      lot.currentBid += increment;
      lot.bidCount += 1;
    } else if (Math.random() < 0.12) {
      lot.currentBid += 2 + Math.floor(Math.random() * 8);
      lot.bidCount += 1;
    }

    const countdown = heated ? 2 * lot.heatMultiplier : 1;
    lot.closesInSec = Math.max(0, lot.closesInSec - countdown);

    if (lot.closesInSec === 0) {
      lot.closesInSec = lot.initialClosesInSec;
      lot.currentBid = lot.startingBid;
      lot.bidCount = 0;
      lot.heatMultiplier = 1;
    }
  }

  private toLotEvent(lot: InternalLot): LotEvent {
    return {
      id: `${lot.lotId}-${lot.sequence}-${Date.now()}`,
      ts: Date.now(),
      lotId: lot.lotId,
      title: lot.title,
      platform: lot.platform,
      imageUrl: lot.imageUrl,
      currentBid: lot.currentBid,
      currency: lot.currency,
      bidCount: lot.bidCount,
      closesInSec: lot.closesInSec,
      category: lot.category,
      attributes: lot.attributes,
    };
  }
}

declare global {
  var __gavelSimulator: AuctionSimulator | undefined;
}

export function getSimulator(): AuctionSimulator {
  if (!globalThis.__gavelSimulator) {
    globalThis.__gavelSimulator = new AuctionSimulator();
    globalThis.__gavelSimulator.start();
  }
  return globalThis.__gavelSimulator;
}

export type { AuctionSimulator };
