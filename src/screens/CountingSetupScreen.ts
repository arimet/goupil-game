import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { ensureAudioContext } from '../audio/SoundEffects';
import type { CountingMode } from '../counting/CountingEngine';

export class CountingSetupScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onStart: (mode: CountingMode, max: number) => void;
  private container: HTMLDivElement | null = null;

  constructor(appEl: HTMLElement, fox: Fox, onStart: (mode: CountingMode, max: number) => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onStart = onStart;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';

    const title = document.createElement('div');
    title.className = 'game-subtitle';
    title.textContent = 'Choisis ton exercice !';
    this.container.appendChild(title);

    const row1 = document.createElement('div');
    row1.className = 'choices-row';
    row1.style.marginTop = '16px';

    row1.appendChild(createBigButton('\uD83D\uDD22 Compter 1-10', COLORS.secondary, () => {
      ensureAudioContext();
      this.onStart('count', 10);
    }));
    row1.appendChild(createBigButton('\uD83D\uDD22 Compter 1-20', '#A78BFA', () => {
      ensureAudioContext();
      this.onStart('count', 20);
    }));
    this.container.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'choices-row';
    row2.style.marginTop = '12px';

    row2.appendChild(createBigButton('\u2795 Additionner 1-10', COLORS.correct, () => {
      ensureAudioContext();
      this.onStart('add', 10);
    }));
    row2.appendChild(createBigButton('\u2795 Additionner 1-20', COLORS.primary, () => {
      ensureAudioContext();
      this.onStart('add', 20);
    }));
    this.container.appendChild(row2);

    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.fox.setState('idle');
    this.fox.speak('On compte !', 2000);
  }

  exit() {
    this.container?.remove();
    this.container = null;
  }
}
