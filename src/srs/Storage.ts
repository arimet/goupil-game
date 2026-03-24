import type { LetterCard } from './LetterCard';

const STORAGE_KEY = 'goupil-srs-v1';

export interface SRSState {
  version: number;
  cards: LetterCard[];
  totalStars: number;
  sessionsCompleted: number;
}

export function loadState(): SRSState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SRSState;
  } catch {
    return null;
  }
}

export function saveState(state: SRSState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}
