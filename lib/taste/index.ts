type TasteDecision = {
  lotId: string;
  maxBid: number;
  recordedAt: number;
};

const tasteMemory = new Map<string, TasteDecision>();

export function recordTasteDecision(lotId: string, maxBid: number) {
  tasteMemory.set(lotId, { lotId, maxBid, recordedAt: Date.now() });
}

export function getTasteContext(currentLotId: string): string | undefined {
  const prior = Array.from(tasteMemory.values())
    .filter((entry) => entry.lotId !== currentLotId)
    .sort((a, b) => b.recordedAt - a.recordedAt)[0];

  if (!prior) return undefined;
  return `you held firm under €${prior.maxBid} on lot ${prior.lotId}`;
}

export function getTasteMemory(): TasteDecision[] {
  return Array.from(tasteMemory.values());
}
