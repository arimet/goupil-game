import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import type { LetterMesh } from '../scene/LetterMesh';
import type { ParticleSystem } from '../scene/Particles';
import type { StarCounter } from './components/StarCounter';
import type { SRSEngine } from '../srs/SRSEngine';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { playCorrect, playTap } from '../audio/SoundEffects';
import * as THREE from 'three';

export class OralScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private letterMesh: LetterMesh;
  private particles: ParticleSystem;
  private starCounter: StarCounter;
  private srsEngine: SRSEngine;
  private onNext: (correct: boolean) => void;
  private container: HTMLDivElement | null = null;
  private _letter = 'A';
  private answered = false;

  constructor(
    appEl: HTMLElement,
    fox: Fox,
    letterMesh: LetterMesh,
    particles: ParticleSystem,
    starCounter: StarCounter,
    srsEngine: SRSEngine,
    onNext: (correct: boolean) => void,
  ) {
    this.appEl = appEl;
    this.fox = fox;
    this.letterMesh = letterMesh;
    this.particles = particles;
    this.starCounter = starCounter;
    this.srsEngine = srsEngine;
    this.onNext = onNext;
  }

  setLetter(letter: string) {
    this._letter = letter;
    this.answered = false;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';
    this.container.style.justifyContent = 'flex-end';
    this.container.style.paddingBottom = '80px';

    const prompt = document.createElement('div');
    prompt.className = 'letter-prompt';
    prompt.textContent = 'Dis cette lettre !';
    this.container.appendChild(prompt);

    const btnRow = document.createElement('div');
    btnRow.className = 'choices-row';
    btnRow.style.marginTop = '20px';

    const correctBtn = createBigButton('Correct \u2713', COLORS.correct, () => {
      if (this.answered) return;
      this.answered = true;
      playTap();
      playCorrect();
      this.fox.setState('happy');
      this.fox.speak('Bravo !', 2000);
      this.srsEngine.recordCorrect(this._letter);
      this.srsEngine.addStars(1);
      this.starCounter.increment();
      this.particles.emitStars(new THREE.Vector3(0, 1, 0));
      this.letterMesh.celebrateWiggle();
      setTimeout(() => this.onNext(true), 1200);
    });

    const wrongBtn = createBigButton('Faux \u2717', COLORS.primary, () => {
      if (this.answered) return;
      this.answered = true;
      playTap();
      this.fox.setState('encourage');
      this.fox.speak('On r\u00e9essaiera !', 2000);
      this.srsEngine.recordWrong(this._letter);
      setTimeout(() => this.onNext(false), 1200);
    });

    btnRow.appendChild(correctBtn);
    btnRow.appendChild(wrongBtn);
    this.container.appendChild(btnRow);

    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Show 3D letter
    this.letterMesh.setLetter(this._letter).then(() => {
      this.letterMesh.animateIn();
    });

    this.fox.setState('idle');
    this.fox.speak('Quelle lettre est-ce ?', 2500);
  }

  exit() {
    this.letterMesh.clear();
    this.container?.remove();
    this.container = null;
  }
}
