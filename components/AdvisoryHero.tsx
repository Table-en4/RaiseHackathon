"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BidAdvisory, LotEvent } from "@/lib/contracts";

type AdvisoryHeroProps = {
  lot: LotEvent | null;
  advisory: BidAdvisory | null;
  loading: boolean;
  onPlaceBid: () => void;
  bidPlaced: boolean;
};

export function AdvisoryHero({ lot, advisory, loading, onPlaceBid, bidPlaced }: AdvisoryHeroProps) {
  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/30 p-6 shadow-2xl">
      <AnimatePresence mode="wait">
        {!lot ? (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-stone-500"
          >
            Select a lot from the feed. When it heats up, the advisory resolves here.
          </motion.p>
        ) : (
          <motion.div
            key={lot.lotId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs uppercase tracking-[0.25em] text-amber-500/80">
              {lot.closesInSec <= 90 ? "Closing soon" : "Advisory"}
            </p>
            <h1 className="mt-2 text-2xl font-medium text-stone-100">{lot.title}</h1>
            <p className="mt-1 text-sm text-stone-400">
              €{lot.currentBid} · {lot.bidCount} bids · {lot.closesInSec}s left
            </p>

            {loading && (
              <p className="mt-6 animate-pulse text-sm text-stone-500">Resolving advisory…</p>
            )}

            {advisory && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 space-y-4"
              >
                {advisory.materialRead && (
                  <p className="text-sm text-amber-200/90">{advisory.materialRead}</p>
                )}
                <p className="text-lg leading-relaxed text-stone-100">{advisory.advisory}</p>
                <p className="text-sm text-stone-500">{advisory.rationale}</p>
                {advisory.learnsFrom && (
                  <p className="text-xs italic text-stone-500">Learns: {advisory.learnsFrom}</p>
                )}
                <button
                  type="button"
                  onClick={onPlaceBid}
                  disabled={bidPlaced}
                  className="rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {bidPlaced ? "Bid recorded" : "Place Bid"}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
