import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { generateQuestion, type CountingMode, type CountingQuestion } from '../counting/CountingEngine';
import { createBigButton } from './components/BigButton';
import { StarCounter } from './components/StarCounter';
import { BUTTON_COLORS, COLORS } from '../utils/constants';
import { playCorrect, playTap } from '../audio/SoundEffects';

export class CountingGameScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onDone: () => void;
  // container managed via appEl.innerHTML
  private _mode: CountingMode = 'count';
  private _max = 10;
  private questionIndex = 0;
  private stars = 0;
  private starCounter: StarCounter;
  private answered = false;

  constructor(appEl: HTMLElement, fox: Fox, onDone: () => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onDone = onDone;
    this.starCounter = new StarCounter();
  }

  setup(mode: CountingMode, max: number) {
    this._mode = mode;
    this._max = max;
    this.questionIndex = 0;
    this.stars = 0;
  }

  enter() {
    this.starCounter.setCount(0);
    this.starCounter.show();
    this.showQuestion();
  }

  private showQuestion() {
    if (this.questionIndex >= 10) {
      this.starCounter.hide();
      this.showResult();
      return;
    }

    this.answered = false;
    const q = generateQuestion(this._mode, this._max);

    this.appEl.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'screen';
    div.style.justifyContent = 'center';

    // Objects display
    const objDiv = document.createElement('div');
    objDiv.className = 'counting-objects';
    if (q.mode === 'count') {
      objDiv.textContent = q.objects;
    } else {
      objDiv.textContent = `${q.objectsA}  +  ${q.objectsB}`;
    }
    div.appendChild(objDiv);

    // Question text
    const prompt = document.createElement('div');
    prompt.className = 'letter-prompt';
    prompt.style.marginTop = '16px';
    if (q.mode === 'count') {
      prompt.textContent = 'Combien y en a-t-il ?';
    } else {
      prompt.textContent = `${q.a} + ${q.b} = ?`;
    }
    div.appendChild(prompt);

    // Choices
    const row = document.createElement('div');
    row.className = 'choices-row';
    row.style.marginTop = '20px';

    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'letter-button bounce-in';
      btn.textContent = String(choice);
      btn.style.backgroundColor = BUTTON_COLORS[i % BUTTON_COLORS.length];
      btn.style.animationDelay = `${i * 0.1}s`;
      btn.addEventListener('click', () => this.handleAnswer(choice, q, btn, row));
      row.appendChild(btn);
    });

    div.appendChild(row);
    this.appEl.appendChild(div);
    requestAnimationFrame(() => div.classList.add('active'));

    this.fox.setState('idle');
  }

  private handleAnswer(choice: number, q: CountingQuestion, btn: HTMLButtonElement, _row: HTMLDivElement) {
    if (this.answered) return;
    playTap();

    if (choice === q.answer) {
      this.answered = true;
      playCorrect();
      this.stars++;
      this.starCounter.increment();
      this.fox.setState('happy');
      this.fox.speak('Bravo !', 1500);
      btn.style.boxShadow = '0 0 20px #51CF66';
      this.questionIndex++;
      setTimeout(() => this.showQuestion(), 1200);
    } else {
      btn.classList.add('shake');
      btn.style.opacity = '0.3';
      btn.style.pointerEvents = 'none';
      this.fox.setState('encourage');
      this.fox.speak('Essaie encore !', 1500);
    }
  }

  private showResult() {
    this.appEl.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'screen';

    const starsDiv = document.createElement('div');
    starsDiv.className = 'result-stars bounce-in';
    starsDiv.textContent = '\u2B50'.repeat(Math.min(this.stars, 10)) || '\u2B50';
    div.appendChild(starsDiv);

    const msg = document.createElement('div');
    msg.className = 'result-message';
    msg.textContent = this.stars >= 8 ? 'Extraordinaire !' : this.stars >= 5 ? 'Super travail !' : 'Bien jou\u00e9 !';
    div.appendChild(msg);

    const row = document.createElement('div');
    row.className = 'result-buttons';
    row.appendChild(createBigButton('Rejouer !', COLORS.correct, () => {
      this.questionIndex = 0;
      this.stars = 0;
      this.starCounter.setCount(0);
      this.starCounter.show();
      this.showQuestion();
    }));
    row.appendChild(createBigButton('Menu', COLORS.secondary, () => this.onDone()));
    div.appendChild(row);

    this.appEl.appendChild(div);
    requestAnimationFrame(() => div.classList.add('active'));

    this.fox.setState('happy');
    this.fox.speak('Super champion !', 3000);
  }

  exit() {
    this.starCounter.hide();
    this.appEl.innerHTML = '';
  }
}
