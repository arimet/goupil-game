import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import type { ParticleSystem } from '../scene/Particles';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { playCelebration } from '../audio/SoundEffects';
// Voice phrases removed

export class ResultScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private particles: ParticleSystem;
  private onPlayAgain: () => void;
  private onDone: () => void;
  private container: HTMLDivElement | null = null;
  private _starsEarned = 0;

  constructor(
    appEl: HTMLElement,
    fox: Fox,
    particles: ParticleSystem,
    onPlayAgain: () => void,
    onDone: () => void,
  ) {
    this.appEl = appEl;
    this.fox = fox;
    this.particles = particles;
    this.onPlayAgain = onPlayAgain;
    this.onDone = onDone;
  }

  setStars(count: number) {
    this._starsEarned = count;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';

    const stars = document.createElement('div');
    stars.className = 'result-stars bounce-in';
    stars.textContent = '\u2B50'.repeat(Math.min(this._starsEarned, 10));
    if (this._starsEarned === 0) stars.textContent = '\u2B50';
    this.container.appendChild(stars);

    const msg = document.createElement('div');
    msg.className = 'result-message';
    if (this._starsEarned >= 8) {
      msg.textContent = 'Extraordinaire !';
    } else if (this._starsEarned >= 5) {
      msg.textContent = 'Super travail !';
    } else {
      msg.textContent = 'Bien jou\u00e9 !';
    }
    this.container.appendChild(msg);

    const starsCount = document.createElement('div');
    starsCount.className = 'game-subtitle';
    starsCount.textContent = `${this._starsEarned} \u00e9toile${this._starsEarned > 1 ? 's' : ''} gagn\u00e9e${this._starsEarned > 1 ? 's' : ''} !`;
    this.container.appendChild(starsCount);

    const btnRow = document.createElement('div');
    btnRow.className = 'result-buttons';
    btnRow.style.marginTop = '30px';

    btnRow.appendChild(
      createBigButton('Rejouer !', COLORS.correct, this.onPlayAgain),
    );
    btnRow.appendChild(
      createBigButton('Termin\u00e9', COLORS.secondary, this.onDone),
    );

    this.container.appendChild(btnRow);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Celebration
    playCelebration();
    this.particles.emitConfetti(30);
    this.fox.setState('happy');
    this.fox.speak('Super champion !', 3000);
    // Voice removed - just sound + fox speech bubble
  }

  exit() {
    this.container?.remove();
    this.container = null;
  }
}
