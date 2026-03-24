import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { ensureAudioContext } from '../audio/SoundEffects';
import type { AIDifficulty } from '../memory/MemoryAI';

export class MemorySetupScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onStart: (pairs: number, difficulty: AIDifficulty) => void;
  private container: HTMLDivElement | null = null;
  private selectedPairs = 6;
  private selectedDifficulty: AIDifficulty = 'easy';

  constructor(appEl: HTMLElement, fox: Fox, onStart: (pairs: number, difficulty: AIDifficulty) => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onStart = onStart;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';

    const title = document.createElement('div');
    title.className = 'game-subtitle';
    title.textContent = 'Memory - Options';
    this.container.appendChild(title);

    // Pairs selection
    const pairsLabel = document.createElement('div');
    pairsLabel.className = 'game-subtitle';
    pairsLabel.style.fontSize = '20px';
    pairsLabel.style.marginTop = '16px';
    pairsLabel.textContent = `Paires : ${this.selectedPairs}`;

    const pairsSlider = document.createElement('input');
    pairsSlider.type = 'range';
    pairsSlider.min = '4';
    pairsSlider.max = '10';
    pairsSlider.value = String(this.selectedPairs);
    pairsSlider.className = 'puzzle-slider';
    pairsSlider.style.maxWidth = '300px';
    pairsSlider.addEventListener('input', () => {
      this.selectedPairs = parseInt(pairsSlider.value);
      pairsLabel.textContent = `Paires : ${this.selectedPairs}`;
    });

    this.container.appendChild(pairsLabel);
    this.container.appendChild(pairsSlider);

    // Difficulty
    const diffLabel = document.createElement('div');
    diffLabel.className = 'game-subtitle';
    diffLabel.style.fontSize = '20px';
    diffLabel.style.marginTop = '20px';
    diffLabel.textContent = 'Difficult\u00e9 :';
    this.container.appendChild(diffLabel);

    const diffRow = document.createElement('div');
    diffRow.className = 'choices-row';
    diffRow.style.marginTop = '8px';

    const easyBtn = createBigButton('\uD83D\uDE0A Facile', COLORS.correct, () => {
      this.selectedDifficulty = 'easy';
      easyBtn.style.opacity = '1';
      mediumBtn.style.opacity = '0.5';
    });
    easyBtn.style.fontSize = '18px';
    easyBtn.style.minHeight = '50px';

    const mediumBtn = createBigButton('\uD83E\uDD14 Moyen', '#FB923C', () => {
      this.selectedDifficulty = 'medium';
      easyBtn.style.opacity = '0.5';
      mediumBtn.style.opacity = '1';
    });
    mediumBtn.style.fontSize = '18px';
    mediumBtn.style.minHeight = '50px';
    mediumBtn.style.opacity = '0.5';

    diffRow.appendChild(easyBtn);
    diffRow.appendChild(mediumBtn);
    this.container.appendChild(diffRow);

    // Play
    const playBtn = createBigButton('Jouer !', COLORS.secondary, () => {
      ensureAudioContext();
      this.onStart(this.selectedPairs, this.selectedDifficulty);
    });
    playBtn.style.marginTop = '24px';
    this.container.appendChild(playBtn);

    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.fox.setState('idle');
    this.fox.speak('Memory !', 2000);
  }

  exit() {
    this.container?.remove();
    this.container = null;
  }
}
