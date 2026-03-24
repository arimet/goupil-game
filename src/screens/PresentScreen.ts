import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import type { LetterMesh } from '../scene/LetterMesh';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { sayLetter } from '../audio/SpeechManager';
import { playTap } from '../audio/SoundEffects';

export class PresentScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private letterMesh: LetterMesh;
  private onNext: () => void;
  private container: HTMLDivElement | null = null;
  private _letter = 'A';

  constructor(
    appEl: HTMLElement,
    fox: Fox,
    letterMesh: LetterMesh,
    onNext: () => void,
  ) {
    this.appEl = appEl;
    this.fox = fox;
    this.letterMesh = letterMesh;
    this.onNext = onNext;
  }

  setLetter(letter: string) {
    this._letter = letter;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen';
    this.container.style.justifyContent = 'flex-end';
    this.container.style.paddingBottom = '80px';

    const prompt = document.createElement('div');
    prompt.className = 'letter-prompt';
    prompt.textContent = `Voici la lettre ${this._letter} !`;
    this.container.appendChild(prompt);

    const nextBtn = createBigButton('Suivant', COLORS.secondary, () => {
      playTap();
      this.onNext();
    });
    nextBtn.style.marginTop = '30px';
    this.container.appendChild(nextBtn);

    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Show 3D letter
    this.letterMesh.setLetter(this._letter).then(() => {
      this.letterMesh.animateIn();
    });

    // Fox speaks
    this.fox.setState('happy');
    this.fox.speak(`${this._letter} !`, 3000);
    sayLetter(this._letter);
  }

  exit() {
    this.letterMesh.clear();
    this.container?.remove();
    this.container = null;
  }
}
