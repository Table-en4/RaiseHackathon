"use client";

import { motion } from "framer-motion";
import type { LotEvent } from "@/lib/contracts";

type LotFeedProps = {
  lots: LotEvent[];
  selectedLotId: string | null;
  onSelect: (lotId: string) => void;
};

export function LotFeed({ lots, selectedLotId, onSelect }: LotFeedProps) {
  return (
    <section className="rounded-2xl border border-stone-800/60 bg-stone-950/70 p-4 backdrop-blur">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
        Watching
      </h2>
      <ul className="space-y-2">
        {lots.map((lot) => {
          const heated = lot.closesInSec <= 90;
          const selected = lot.lotId === selectedLotId;
          return (
            <motion.li
              key={lot.lotId}
              layout
              onClick={() => onSelect(lot.lotId)}
              className={`cursor-pointer rounded-xl border px-3 py-2 transition-colors ${
                selected
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-stone-800 bg-stone-900/50 hover:border-stone-600"
              }`}
              animate={heated ? { scale: [1, 1.01, 1] } : { scale: 1 }}
              transition={{ repeat: heated ? Infinity : 0, duration: 1.2 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-stone-200">{lot.title}</span>
                <span className="text-xs text-amber-400">€{lot.currentBid}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-stone-500">
                <span>{lot.platform}</span>
                <span>{lot.closesInSec}s</span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
