import { ALPHABET, SRS_INTERVALS, INITIAL_ACTIVE_LETTERS, SESSION_SIZE } from '../utils/constants';
import { createNewCard, type LetterCard } from './LetterCard';
import { loadState, saveState, type SRSState } from './Storage';
import { shuffle } from '../utils/shuffle';

export class SRSEngine {
  private state: SRSState;

  constructor() {
    const saved = loadState();
    if (saved) {
      this.state = saved;
    } else {
      this.state = {
        version: 1,
        cards: ALPHABET.map(createNewCard),
        totalStars: 0,
        sessionsCompleted: 0,
      };
      saveState(this.state);
    }
  }

  get totalStars() {
    return this.state.totalStars;
  }

  get sessionsCompleted() {
    return this.state.sessionsCompleted;
  }

  private save() {
    saveState(this.state);
  }

  private getActiveCount(): number {
    return this.state.cards.filter((c) => c.state !== 'new').length;
  }

  private getMaxActiveLetters(): number {
    // Start with INITIAL_ACTIVE_LETTERS, +2 each time all active letters are at interval >= 60min
    const active = this.state.cards.filter((c) => c.state !== 'new');
    if (active.length === 0) return INITIAL_ACTIVE_LETTERS;

    const allMastered = active.every((c) => c.interval >= 60);
    if (allMastered && active.length >= INITIAL_ACTIVE_LETTERS) {
      return active.length + 2;
    }
    return Math.max(INITIAL_ACTIVE_LETTERS, active.length);
  }

  getSessionCards(): LetterCard[] {
    const now = Date.now();
    this.justIntroduced.clear();

    // Due cards first
    const dueCards = this.state.cards
      .filter((c) => c.state !== 'new' && c.nextReviewAt <= now)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);

    const result = [...dueCards];

    // Introduce new letters if needed
    if (result.length < SESSION_SIZE) {
      const maxActive = this.getMaxActiveLetters();
      const activeCount = this.getActiveCount();
      const canIntroduce = Math.min(
        SESSION_SIZE - result.length,
        maxActive - activeCount,
      );

      if (canIntroduce > 0) {
        const newCards = this.state.cards.filter((c) => c.state === 'new');
        const toIntroduce = newCards.slice(0, Math.max(0, canIntroduce));
        for (const card of toIntroduce) {
          card.state = 'learning';
          card.nextReviewAt = now;
          this.justIntroduced.add(card.letter);
        }
        result.push(...toIntroduce);
        this.save();
      }
    }

    return shuffle(result.slice(0, SESSION_SIZE));
  }

  private justIntroduced = new Set<string>();

  isNewLetter(letter: string): boolean {
    return this.justIntroduced.has(letter);
  }

  recordCorrect(letter: string) {
    const card = this.state.cards.find((c) => c.letter === letter);
    if (!card) return;

    card.repetitions += 1;
    card.totalCorrect += 1;
    card.totalAttempts += 1;
    card.lastReviewedAt = Date.now();

    const stepIndex = Math.min(card.repetitions, SRS_INTERVALS.length - 1);
    card.interval = SRS_INTERVALS[stepIndex];
    card.nextReviewAt = Date.now() + card.interval * 60 * 1000;
    card.state = card.repetitions >= 2 ? 'review' : 'learning';

    this.save();
  }

  recordWrong(letter: string) {
    const card = this.state.cards.find((c) => c.letter === letter);
    if (!card) return;

    card.repetitions = 0;
    card.totalAttempts += 1;
    card.lastReviewedAt = Date.now();
    card.interval = SRS_INTERVALS[0];
    card.nextReviewAt = Date.now() + SRS_INTERVALS[0] * 60 * 1000;
    card.state = 'learning';

    this.save();
  }

  getDistractors(correctLetter: string, count: number): string[] {
    const seen = this.state.cards.filter(
      (c) => c.state !== 'new' && c.letter !== correctLetter,
    );
    let pool = seen.map((c) => c.letter);

    if (pool.length < count) {
      const unseen = this.state.cards
        .filter((c) => c.state === 'new' && c.letter !== correctLetter)
        .map((c) => c.letter);
      pool = [...pool, ...shuffle(unseen).slice(0, count - pool.length)];
    }

    return shuffle(pool).slice(0, count);
  }

  addStars(count: number) {
    this.state.totalStars += count;
    this.save();
  }

  completeSession() {
    this.state.sessionsCompleted += 1;
    this.save();
  }

  reset() {
    this.state = {
      version: 1,
      cards: ALPHABET.map(createNewCard),
      totalStars: 0,
      sessionsCompleted: 0,
    };
    this.save();
  }
}
