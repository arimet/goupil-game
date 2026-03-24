import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { PuzzleEngine } from '../puzzle/PuzzleEngine';
import { PuzzleRenderer } from '../puzzle/PuzzleRenderer';
import type { PuzzlePiece } from '../puzzle/PuzzlePiece';
import { playCorrect, playCelebration, playTap } from '../audio/SoundEffects';

export class PuzzleGameScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onComplete: () => void;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private engine: PuzzleEngine | null = null;
  private renderer: PuzzleRenderer | null = null;
  private animFrameId = 0;
  private _image: HTMLCanvasElement | null = null;
  private _pieces = 12;
  private _savedEngine: PuzzleEngine | null = null;

  // Drag state
  private dragging: PuzzlePiece | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Bound handlers for cleanup
  private pointerDownHandler: ((e: PointerEvent) => void) | null = null;
  private pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
  private pointerUpHandler: ((e: PointerEvent) => void) | null = null;

  constructor(appEl: HTMLElement, fox: Fox, onComplete: () => void) {
    this.appEl = appEl;
    this.fox = fox;
    this.onComplete = onComplete;
  }

  setup(image: HTMLCanvasElement, pieces: number) {
    this._image = image;
    this._pieces = pieces;
    this._savedEngine = null;
  }

  setupFromSave(engine: PuzzleEngine) {
    this._savedEngine = engine;
    this._image = engine.image;
  }

  enter() {
    if (!this._image) return;

    this.container = document.createElement('div');
    this.container.className = 'screen puzzle-game-container';
    this.container.style.padding = '0';

    // Create puzzle canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'puzzle-canvas';
    this.canvas.style.touchAction = 'none';
    this.container.appendChild(this.canvas);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'puzzle-toolbar';

    const hintBtn = document.createElement('button');
    hintBtn.className = 'big-button';
    hintBtn.textContent = '\uD83D\uDCA1 Indice';
    hintBtn.style.backgroundColor = '#A78BFA';
    hintBtn.style.fontSize = '16px';
    hintBtn.style.minHeight = '40px';
    hintBtn.style.minWidth = '100px';
    hintBtn.style.padding = '8px 16px';
    hintBtn.addEventListener('click', () => {
      if (this.renderer) {
        this.renderer.showHint = !this.renderer.showHint;
        hintBtn.style.opacity = this.renderer.showHint ? '1' : '0.6';
      }
    });
    hintBtn.style.opacity = '0.6';
    toolbar.appendChild(hintBtn);

    const scatterBtn = document.createElement('button');
    scatterBtn.className = 'big-button';
    scatterBtn.textContent = '\u2194 Trier';
    scatterBtn.style.backgroundColor = '#FB923C';
    scatterBtn.style.fontSize = '16px';
    scatterBtn.style.minHeight = '40px';
    scatterBtn.style.minWidth = '100px';
    scatterBtn.style.padding = '8px 16px';
    scatterBtn.addEventListener('click', () => {
      if (this.engine && this.canvas) {
        this.engine.scatterOutsideBoard(this.canvas.width, this.canvas.height);
      }
    });
    toolbar.appendChild(scatterBtn);

    this.container.appendChild(toolbar);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Size canvas
    this.resizeCanvas();

    // Create or restore engine
    if (this._savedEngine) {
      this.engine = this._savedEngine;
      this._savedEngine = null;
    } else {
      this.engine = new PuzzleEngine({
        image: this._image,
        totalPieces: this._pieces,
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
      });
      this.engine.save();
    }

    this.renderer = new PuzzleRenderer(this.canvas, this.engine);

    // Setup input
    this.setupInput();

    // Render loop
    const loop = () => {
      this.renderer?.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);

    this.fox.setState('idle');
    this.fox.speak('C\'est parti !', 2000);
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  }

  private setupInput() {
    if (!this.canvas || !this.engine) return;

    this.pointerDownHandler = (e: PointerEvent) => {
      if (!this.engine) return;
      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const piece = this.engine.getPieceAt(x, y);
      if (piece && !piece.data.isPlaced) {
        this.dragging = piece;
        this.dragOffsetX = x - piece.data.x;
        this.dragOffsetY = y - piece.data.y;
        this.engine.bringToFront(piece.data.groupId);
        playTap();
      }
    };

    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.dragging || !this.engine) return;
      const rect = this.canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - this.dragOffsetX - this.dragging.data.x;
      const dy = y - this.dragOffsetY - this.dragging.data.y;

      this.engine.moveGroup(this.dragging.data.groupId, dx, dy);
      this.dragOffsetX = x - this.dragging.data.x;
      this.dragOffsetY = y - this.dragging.data.y;
    };

    this.pointerUpHandler = (_e: PointerEvent) => {
      if (!this.dragging || !this.engine) return;

      // Try snap for all pieces in the group
      const group = this.engine.getGroupPieces(this.dragging.data.groupId);
      let snapped = false;
      for (const p of group) {
        if (this.engine.trySnap(p)) {
          snapped = true;
          break;
        }
      }

      if (snapped) {
        playCorrect();
        this.fox.setState('happy');
        this.fox.speak('Bien !', 1500);

        if (this.engine.isComplete) {
          this.engine.clearSave();
          playCelebration();
          this.fox.speak('Bravo, puzzle termin\u00e9 !', 4000);
          setTimeout(() => this.onComplete(), 2000);
        } else {
          this.engine.save();
        }
      }

      this.dragging = null;
    };

    this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.addEventListener('pointerup', this.pointerUpHandler);
    this.canvas.addEventListener('pointerleave', this.pointerUpHandler);
  }

  exit() {
    cancelAnimationFrame(this.animFrameId);
    if (this.canvas) {
      if (this.pointerDownHandler) this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
      if (this.pointerMoveHandler) this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
      if (this.pointerUpHandler) {
        this.canvas.removeEventListener('pointerup', this.pointerUpHandler);
        this.canvas.removeEventListener('pointerleave', this.pointerUpHandler);
      }
    }
    this.container?.remove();
    this.container = null;
    this.canvas = null;
    this.engine = null;
    this.renderer = null;
    this.dragging = null;
  }
}
