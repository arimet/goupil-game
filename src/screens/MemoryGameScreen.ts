import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { MemoryEngine } from '../memory/MemoryEngine';
import { MemoryAI, type AIDifficulty } from '../memory/MemoryAI';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { playCorrect, playTap, playCelebration } from '../audio/SoundEffects';

export class MemoryGameScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onDone: () => void;
  private container: HTMLDivElement | null = null;
  private engine: MemoryEngine | null = null;
  private ai: MemoryAI | null = null;
  private _pairs = 6;
  private _difficulty: AIDifficulty = 'easy';
  private cardEls = new Map<number, HTMLDivElement>();
  private scoreEl: HTMLDivElement | null = null;

  constructor(appEl: HTMLElement, fox: Fox, onDone: () => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onDone = onDone;
  }

  setup(pairs: number, difficulty: AIDifficulty) {
    this._pairs = pairs;
    this._difficulty = difficulty;
  }

  enter() {
    this.engine = new MemoryEngine(this._pairs);
    this.ai = new MemoryAI(this._difficulty);

    this.container = document.createElement('div');
    this.container.className = 'screen memory-screen';

    // Score bar
    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'memory-score';
    this.updateScore();
    this.container.appendChild(this.scoreEl);

    // Card grid
    const grid = document.createElement('div');
    grid.className = 'memory-grid';
    grid.style.gridTemplateColumns = `repeat(${this.engine.gridCols}, 1fr)`;

    this.cardEls.clear();
    for (const card of this.engine.cards) {
      const el = document.createElement('div');
      el.className = 'memory-card';
      el.dataset.id = String(card.id);

      const inner = document.createElement('div');
      inner.className = 'memory-card-inner';

      const front = document.createElement('div');
      front.className = 'memory-card-front';
      front.textContent = '?';

      const back = document.createElement('div');
      back.className = 'memory-card-back';
      back.textContent = card.emoji;

      inner.appendChild(front);
      inner.appendChild(back);
      el.appendChild(inner);

      el.addEventListener('click', () => this.handleCardClick(card.id));
      grid.appendChild(el);
      this.cardEls.set(card.id, el);
    }

    this.container.appendChild(grid);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.fox.setState('idle');
    this.fox.speak('\u00C0 toi !', 2000);
  }

  private handleCardClick(cardId: number) {
    if (!this.engine || !this.engine.isPlayerTurn || this.engine.isChecking) return;
    playTap();

    const flipped = this.engine.flipCard(cardId);
    if (!flipped) return;

    this.updateCardVisual(cardId, true);

    // Observe for AI
    const card = this.engine.cards.find((c) => c.id === cardId)!;
    this.ai?.observe(cardId, card.pairId);

    if (this.engine.secondFlipped !== null) {
      // Two cards flipped, check after delay
      setTimeout(() => this.resolveFlip(), 800);
    }
  }

  private resolveFlip() {
    if (!this.engine) return;
    const result = this.engine.checkMatch();
    if (!result) return;

    if (result.matched) {
      playCorrect();
      this.fox.setState('happy');
      this.fox.speak('Paire !', 1500);
      this.updateCardVisual(result.card1, true, true);
      this.updateCardVisual(result.card2, true, true);
    } else {
      this.updateCardVisual(result.card1, false);
      this.updateCardVisual(result.card2, false);
    }

    this.updateScore();

    if (this.engine.isGameOver) {
      this.showGameOver();
      return;
    }

    // AI turn
    if (!this.engine.isPlayerTurn) {
      this.fox.speak('Tour de Goupil !', 1500);
      setTimeout(() => this.aiTurn(), 1000);
    }
  }

  private async aiTurn() {
    if (!this.engine || !this.ai || this.engine.isPlayerTurn || this.engine.isGameOver) return;

    const [first, second] = this.ai.chooseCards(this.engine);

    // Flip first card
    this.engine.flipCard(first);
    this.updateCardVisual(first, true);
    const c1 = this.engine.cards.find((c) => c.id === first)!;
    this.ai.observe(first, c1.pairId);

    await this.wait(600);

    // Flip second card
    this.engine.flipCard(second);
    this.updateCardVisual(second, true);
    const c2 = this.engine.cards.find((c) => c.id === second)!;
    this.ai.observe(second, c2.pairId);

    await this.wait(800);

    this.resolveFlip();
  }

  private updateCardVisual(cardId: number, flipped: boolean, matched = false) {
    const el = this.cardEls.get(cardId);
    if (!el) return;
    if (flipped) {
      el.classList.add('flipped');
    } else {
      el.classList.remove('flipped');
    }
    if (matched) {
      el.classList.add('matched');
    }
  }

  private updateScore() {
    if (!this.scoreEl || !this.engine) return;
    const turn = this.engine.isPlayerTurn ? '\u{1F449} Toi' : '\u{1F449} Goupil';
    this.scoreEl.textContent = `Toi: ${this.engine.playerScore} | Goupil: ${this.engine.aiScore} | ${turn}`;
  }

  private showGameOver() {
    if (!this.engine) return;
    playCelebration();
    const won = this.engine.playerScore > this.engine.aiScore;
    const tie = this.engine.playerScore === this.engine.aiScore;

    const msg = won ? 'Tu as gagn\u00e9 !' : tie ? '\u00c9galit\u00e9 !' : 'Goupil a gagn\u00e9 !';
    this.fox.setState(won || tie ? 'happy' : 'encourage');
    this.fox.speak(msg, 3000);

    const overlay = document.createElement('div');
    overlay.className = 'memory-gameover';

    const text = document.createElement('div');
    text.className = 'result-message';
    text.textContent = msg;
    overlay.appendChild(text);

    const row = document.createElement('div');
    row.className = 'result-buttons';
    row.appendChild(createBigButton('Rejouer !', COLORS.correct, () => {
      overlay.remove();
      this.exit();
      this.enter();
    }));
    row.appendChild(createBigButton('Menu', COLORS.secondary, () => this.onDone()));
    overlay.appendChild(row);

    this.container?.appendChild(overlay);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  exit() {
    this.container?.remove();
    this.container = null;
    this.cardEls.clear();
  }
}
