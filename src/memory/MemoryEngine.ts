import { shuffle } from '../utils/shuffle';

const EMOJIS = ['\uD83D\uDC36', '\uD83D\uDC31', '\uD83D\uDC3B', '\uD83E\uDD8A', '\uD83D\uDC30', '\uD83D\uDC38', '\uD83D\uDC35', '\uD83E\uDD81', '\uD83D\uDC3C', '\uD83D\uDC2F', '\uD83D\uDC28', '\uD83E\uDD8B', '\uD83D\uDC19', '\uD83D\uDC22', '\uD83E\uDD84', '\uD83D\uDC18'];

export interface Card {
  id: number;
  emoji: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export class MemoryEngine {
  cards: Card[] = [];
  pairs: number;
  playerScore = 0;
  aiScore = 0;
  isPlayerTurn = true;
  firstFlipped: number | null = null;
  secondFlipped: number | null = null;
  isChecking = false;
  isGameOver = false;

  constructor(pairs: number) {
    this.pairs = pairs;
    const emojis = shuffle(EMOJIS).slice(0, pairs);
    const allCards: Card[] = [];
    let id = 0;
    for (let i = 0; i < pairs; i++) {
      allCards.push({ id: id++, emoji: emojis[i], pairId: i, flipped: false, matched: false });
      allCards.push({ id: id++, emoji: emojis[i], pairId: i, flipped: false, matched: false });
    }
    this.cards = shuffle(allCards);
  }

  flipCard(cardId: number): boolean {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched || this.isChecking) return false;
    card.flipped = true;

    if (this.firstFlipped === null) {
      this.firstFlipped = cardId;
      return true;
    } else {
      this.secondFlipped = cardId;
      this.isChecking = true;
      return true;
    }
  }

  checkMatch(): { matched: boolean; card1: number; card2: number } | null {
    if (this.firstFlipped === null || this.secondFlipped === null) return null;

    const c1 = this.cards.find((c) => c.id === this.firstFlipped)!;
    const c2 = this.cards.find((c) => c.id === this.secondFlipped)!;
    const matched = c1.pairId === c2.pairId;

    if (matched) {
      c1.matched = true;
      c2.matched = true;
      if (this.isPlayerTurn) this.playerScore++;
      else this.aiScore++;
    } else {
      c1.flipped = false;
      c2.flipped = false;
      this.isPlayerTurn = !this.isPlayerTurn;
    }

    const result = { matched, card1: this.firstFlipped, card2: this.secondFlipped };
    this.firstFlipped = null;
    this.secondFlipped = null;
    this.isChecking = false;

    if (this.cards.every((c) => c.matched)) {
      this.isGameOver = true;
    }

    return result;
  }

  get gridCols(): number {
    const total = this.cards.length;
    if (total <= 8) return 4;
    if (total <= 12) return 4;
    if (total <= 16) return 4;
    return 5;
  }
}
