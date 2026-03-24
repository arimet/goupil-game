import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import type { LetterMesh } from '../scene/LetterMesh';
import type { ParticleSystem } from '../scene/Particles';
import type { StarCounter } from './components/StarCounter';
import type { SRSEngine } from '../srs/SRSEngine';
import { createLetterButton, shakeButton, disableButton } from './components/LetterButton';
import { shuffle } from '../utils/shuffle';
import { sayLetter, sayPhrase } from '../audio/SpeechManager';
import { playCorrect, playTap } from '../audio/SoundEffects';
import * as THREE from 'three';

export class QuizScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private letterMesh: LetterMesh;
  private particles: ParticleSystem;
  private starCounter: StarCounter;
  private srsEngine: SRSEngine;
  private onNext: (correct: boolean) => void;
  private container: HTMLDivElement | null = null;
  private _letter = 'A';
  private _choices: string[] = [];
  private firstAttempt = true;
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

  setQuestion(letter: string, distractors: string[]) {
    this._letter = letter;
    this._choices = shuffle([letter, ...distractors]);
    this.firstAttempt = true;
    this.answered = false;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';
    this.container.style.justifyContent = 'flex-end';
    this.container.style.paddingBottom = '80px';

    const prompt = document.createElement('div');
    prompt.className = 'letter-prompt';
    prompt.textContent = `Trouve la lettre ${this._letter}`;
    this.container.appendChild(prompt);

    const choicesRow = document.createElement('div');
    choicesRow.className = 'choices-row';

    this._choices.forEach((letter, i) => {
      const btn = createLetterButton(letter, i, (chosen) => this.handleChoice(chosen, btn));
      choicesRow.appendChild(btn);
    });

    this.container.appendChild(choicesRow);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Show target letter in 3D
    this.letterMesh.setLetter(this._letter).then(() => {
      this.letterMesh.animateIn();
    });

    this.fox.setState('idle');
    sayLetter(this._letter);
  }

  private handleChoice(chosen: string, btn: HTMLButtonElement) {
    if (this.answered) return;
    playTap();

    if (chosen === this._letter) {
      // Correct!
      this.answered = true;
      playCorrect();
      this.fox.setState('happy');
      this.fox.speak('Bravo !', 2000);
      sayPhrase('Bravo !');
      this.letterMesh.celebrateWiggle();

      // Particles
      this.particles.emitStars(new THREE.Vector3(0, 1, 0));

      // Record in SRS
      if (this.firstAttempt) {
        this.srsEngine.recordCorrect(this._letter);
        this.srsEngine.addStars(1);
        this.starCounter.increment();
      } else {
        this.srsEngine.recordWrong(this._letter);
      }

      // Auto-advance after delay
      setTimeout(() => {
        this.onNext(this.firstAttempt);
      }, 1500);
    } else {
      // Wrong
      this.firstAttempt = false;
      shakeButton(btn);
      disableButton(btn);
      this.fox.setState('encourage');
      this.fox.speak('Essaie encore !', 2000);
    }
  }

  exit() {
    this.letterMesh.clear();
    this.container?.remove();
    this.container = null;
  }
}
