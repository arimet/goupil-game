import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { ensureAudioContext } from '../audio/SoundEffects';

export type GameMode = 'quiz' | 'oral';

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
    title.textContent = "Goupil's ABCs";
    this.container.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'game-subtitle';
    subtitle.textContent = 'Choisis ton jeu !';
    this.container.appendChild(subtitle);

    const btnRow = document.createElement('div');
    btnRow.className = 'choices-row';
    btnRow.style.marginTop = '20px';

    const listenBtn = createBigButton('\uD83D\uDD0A \u00C9coute', COLORS.secondary, () => {
      ensureAudioContext();
      this.onPlay('quiz');
    });

    const readBtn = createBigButton('\uD83D\uDCD6 Lecture', COLORS.correct, () => {
      ensureAudioContext();
      this.onPlay('oral');
    });

    btnRow.appendChild(listenBtn);
    btnRow.appendChild(readBtn);
    this.container.appendChild(btnRow);

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
