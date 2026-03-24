import type { MemoryEngine } from './MemoryEngine';

export type AIDifficulty = 'easy' | 'medium';

export class MemoryAI {
  private memory = new Map<number, number>(); // cardId -> pairId
  private memoryChance: number;

  constructor(difficulty: AIDifficulty) {
    this.memoryChance = difficulty === 'easy' ? 0.3 : 0.6;
  }

  // Record a card the AI has "seen"
  observe(cardId: number, pairId: number) {
    if (Math.random() < this.memoryChance) {
      this.memory.set(cardId, pairId);
    }
  }

  // Choose two cards to flip
  chooseCards(engine: MemoryEngine): [number, number] {
    const available = engine.cards.filter((c) => !c.matched && !c.flipped);

    // Check if AI remembers a pair
    const remembered = new Map<number, number[]>(); // pairId -> cardIds
    for (const [cardId, pairId] of this.memory) {
      const card = engine.cards.find((c) => c.id === cardId);
      if (card && !card.matched) {
        if (!remembered.has(pairId)) remembered.set(pairId, []);
        remembered.get(pairId)!.push(cardId);
      }
    }

    // If we remember a complete pair, play it
    for (const [, ids] of remembered) {
      if (ids.length >= 2) {
        return [ids[0], ids[1]];
      }
    }

    // Random picks from available
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const first = shuffled[0]?.id ?? available[0]?.id ?? 0;
    const second = shuffled[1]?.id ?? available[1]?.id ?? 1;
    return [first, second];
  }
}
