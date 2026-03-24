export interface LetterCard {
  letter: string;
  state: 'new' | 'learning' | 'review';
  interval: number; // minutes
  repetitions: number;
  nextReviewAt: number; // timestamp ms
  lastReviewedAt: number;
  totalCorrect: number;
  totalAttempts: number;
}

export function createNewCard(letter: string): LetterCard {
  return {
    letter,
    state: 'new',
    interval: 0,
    repetitions: 0,
    nextReviewAt: 0,
    lastReviewedAt: 0,
    totalCorrect: 0,
    totalAttempts: 0,
  };
}
