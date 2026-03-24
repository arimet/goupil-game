import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { ensureAudioContext } from '../audio/SoundEffects';

export type GameMode = 'quiz' | 'oral' | 'puzzle' | 'maze' | 'memory' | 'simon' | 'counting';

interface GameOption {
  mode: GameMode;
  emoji: string;
  label: string;
  color: string;
}

const GAMES: GameOption[] = [
  { mode: 'quiz', emoji: '\uD83D\uDD0A', label: '\u00C9coute', color: '#4ECDC4' },
  { mode: 'oral', emoji: '\uD83D\uDCD6', label: 'Lecture', color: '#51CF66' },
  { mode: 'puzzle', emoji: '\uD83E\uDDE9', label: 'Puzzle', color: '#A78BFA' },
  { mode: 'maze', emoji: '\uD83C\uDFF0', label: 'Labyrinthe', color: '#FB923C' },
  { mode: 'memory', emoji: '\uD83C\uDCCF', label: 'Memory', color: '#FF6B6B' },
  { mode: 'simon', emoji: '\uD83C\uDFB5', label: 'Simon', color: '#F472B6' },
  { mode: 'counting', emoji: '\uD83D\uDD22', label: 'Compter', color: '#38BDF8' },
];

export class WelcomeScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onPlay: (mode: GameMode) => void;
  private container: HTMLDivElement | null = null;

  constructor(appEl: HTMLElement, fox: Fox, onPlay: (mode: GameMode) => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onPlay = onPlay;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';

    const title = document.createElement('div');
    title.className = 'game-title';
    title.style.marginBottom = '16px';
    title.textContent = 'Goupil Games';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'welcome-grid';

    for (const game of GAMES) {
      const btn = document.createElement('button');
      btn.className = 'welcome-game-btn';
      btn.style.backgroundColor = game.color;
      btn.innerHTML = `<span class="welcome-emoji">${game.emoji}</span><span>${game.label}</span>`;
      btn.addEventListener('click', () => {
        ensureAudioContext();
        this.onPlay(game.mode);
      });
      grid.appendChild(btn);
    }

    this.container.appendChild(grid);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.fox.setState('wave');
    this.fox.speak('Salut ! On joue ?', 3000);
  }

  exit() {
    this.container?.remove();
    this.container = null;
  }
}
