import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { SimonEngine } from '../simon/SimonEngine';
import { ensureAudioContext, playTap } from '../audio/SoundEffects';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'];
const LIGHT_COLORS = ['#FF9999', '#7EDED4', '#FFF0A0', '#C4B5FD'];
const FREQUENCIES = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

let audioCtx: AudioContext | null = null;

function playSimonTone(index: number, duration = 0.3) {
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = FREQUENCIES[index];
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export class SimonScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private container: HTMLDivElement | null = null;
  private engine = new SimonEngine();
  private buttons: HTMLButtonElement[] = [];
  private scoreEl: HTMLDivElement | null = null;
  private bestEl: HTMLDivElement | null = null;
  private statusEl: HTMLDivElement | null = null;

  constructor(appEl: HTMLElement, fox: Fox) {
    this.appEl = appEl;
    this.fox = fox;
  }

  enter() {
    ensureAudioContext();
    this.engine.reset();
    this.container = document.createElement('div');
    this.container.className = 'screen simon-screen';

    // Score display
    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'game-subtitle';
    this.scoreEl.textContent = 'Score : 0';
    this.container.appendChild(this.scoreEl);

    this.bestEl = document.createElement('div');
    this.bestEl.className = 'game-subtitle';
    this.bestEl.style.fontSize = '16px';
    this.bestEl.style.opacity = '0.7';
    this.bestEl.textContent = `Meilleur : ${this.engine.bestScore}`;
    this.container.appendChild(this.bestEl);

    // Status
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'letter-prompt';
    this.statusEl.style.marginTop = '10px';
    this.statusEl.textContent = 'Regarde bien !';
    this.container.appendChild(this.statusEl);

    // Buttons grid
    const grid = document.createElement('div');
    grid.className = 'simon-grid';
    this.buttons = [];

    for (let i = 0; i < 4; i++) {
      const btn = document.createElement('button');
      btn.className = 'simon-btn';
      btn.style.backgroundColor = COLORS[i];
      btn.addEventListener('click', () => this.handlePress(i));
      grid.appendChild(btn);
      this.buttons.push(btn);
    }

    this.container.appendChild(grid);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.fox.setState('idle');

    // Start first round after a delay
    setTimeout(() => this.nextRound(), 1000);
  }

  private async nextRound() {
    if (!this.container) return;
    this.statusEl!.textContent = 'Regarde bien !';
    this.setButtonsEnabled(false);
    this.engine.addToSequence();

    // Play sequence — longer flash so the child can follow
    await this.wait(400);
    for (let i = 0; i < this.engine.sequence.length; i++) {
      await this.flashButton(this.engine.sequence[i], 700);
      await this.wait(300);
    }

    // Player turn
    this.engine.startPlayerTurn();
    this.statusEl!.textContent = '\u00C0 toi !';
    this.setButtonsEnabled(true);
  }

  private handlePress(index: number) {
    if (!this.engine.isPlayerTurn) return;
    playTap();
    playSimonTone(index, 0.2);
    this.flashButton(index, 200);

    const result = this.engine.checkInput(index);

    if (result === 'correct') {
      // Continue
    } else if (result === 'complete') {
      this.scoreEl!.textContent = `Score : ${this.engine.score}`;
      this.bestEl!.textContent = `Meilleur : ${this.engine.bestScore}`;
      this.fox.setState('happy');
      this.fox.speak('Bien !', 1500);
      setTimeout(() => this.nextRound(), 1000);
    } else {
      // Game over
      this.setButtonsEnabled(false);
      this.statusEl!.textContent = `Perdu ! Score : ${this.engine.score}`;
      this.fox.setState('encourage');
      this.fox.speak('On recommence ?', 2500);

      // Add restart button
      const restartBtn = document.createElement('button');
      restartBtn.className = 'big-button';
      restartBtn.textContent = '\uD83D\uDD04 Rejouer';
      restartBtn.style.backgroundColor = '#51CF66';
      restartBtn.style.marginTop = '20px';
      restartBtn.addEventListener('click', () => {
        restartBtn.remove();
        this.engine.reset();
        this.scoreEl!.textContent = 'Score : 0';
        setTimeout(() => this.nextRound(), 500);
      });
      this.container!.appendChild(restartBtn);
    }
  }

  private async flashButton(index: number, duration: number) {
    const btn = this.buttons[index];
    btn.style.backgroundColor = LIGHT_COLORS[index];
    btn.style.transform = 'scale(1.12)';
    btn.style.boxShadow = `0 0 30px 10px ${LIGHT_COLORS[index]}, 0 4px 0 rgba(0,0,0,0.15)`;
    btn.style.border = '4px solid #fff';
    playSimonTone(index, duration / 1000);
    await this.wait(duration);
    if (btn) {
      btn.style.backgroundColor = COLORS[index];
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 0 rgba(0,0,0,0.15)';
      btn.style.border = 'none';
    }
  }

  private setButtonsEnabled(enabled: boolean) {
    for (const btn of this.buttons) {
      btn.style.pointerEvents = enabled ? 'auto' : 'none';
      btn.style.opacity = enabled ? '1' : '0.7';
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  exit() {
    this.container?.remove();
    this.container = null;
    this.buttons = [];
  }
}
