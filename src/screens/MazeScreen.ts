import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { generateMaze } from '../maze/MazeGenerator';
import { MazeRenderer } from '../maze/MazeRenderer';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { playCelebration, playCorrect, playTap } from '../audio/SoundEffects';

export class MazeScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private renderer: MazeRenderer | null = null;
  private animFrameId = 0;
  private drawing = false;
  private currentCell: { row: number; col: number } | null = null;
  private cellPath: { row: number; col: number }[] = [];

  private pointerDownH: ((e: PointerEvent) => void) | null = null;
  private pointerMoveH: ((e: PointerEvent) => void) | null = null;
  private pointerUpH: ((e: PointerEvent) => void) | null = null;

  constructor(appEl: HTMLElement, fox: Fox) {
    this.appEl = appEl;
    this.fox = fox;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen puzzle-game-container';
    this.container.style.padding = '0';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'puzzle-canvas';
    this.canvas.style.touchAction = 'none';
    this.container.appendChild(this.canvas);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'puzzle-toolbar';

    const newBtn = createBigButton('\uD83D\uDD04 Nouveau', COLORS.secondary, () => {
      playTap();
      this.startNewMaze();
    });
    newBtn.style.fontSize = '16px';
    newBtn.style.minHeight = '40px';
    newBtn.style.padding = '8px 16px';
    toolbar.appendChild(newBtn);

    this.container.appendChild(toolbar);
    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    this.resizeCanvas();
    this.startNewMaze();

    this.fox.setState('idle');
    this.fox.speak('Trouve la sortie !', 2500);
  }

  private startNewMaze() {
    if (!this.canvas) return;
    const size = 7 + Math.floor(Math.random() * 4); // 7-10
    const maze = generateMaze(size, size);
    this.renderer = new MazeRenderer(this.canvas, maze);
    this.cellPath = [{ ...maze.start }];
    this.currentCell = { ...maze.start };
    this.renderer.path = [this.renderer.getCellCenter(maze.start.row, maze.start.col)];
    this.renderer.completed = false;
    this.drawing = false;

    this.setupInput();
    this.startRenderLoop();
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.width = this.canvas.width + 'px';
    this.canvas.style.height = this.canvas.height + 'px';
  }

  private setupInput() {
    if (!this.canvas) return;
    // Remove old listeners
    if (this.pointerDownH) this.canvas.removeEventListener('pointerdown', this.pointerDownH);
    if (this.pointerMoveH) this.canvas.removeEventListener('pointermove', this.pointerMoveH);
    if (this.pointerUpH) {
      this.canvas.removeEventListener('pointerup', this.pointerUpH);
      this.canvas.removeEventListener('pointerleave', this.pointerUpH);
    }

    this.pointerDownH = (e: PointerEvent) => {
      if (!this.renderer || this.renderer.completed) return;
      const rect = this.canvas!.getBoundingClientRect();
      const cell = this.renderer.getCellAt(e.clientX - rect.left, e.clientY - rect.top);
      if (cell && cell.row === this.currentCell!.row && cell.col === this.currentCell!.col) {
        this.drawing = true;
      }
    };

    this.pointerMoveH = (e: PointerEvent) => {
      if (!this.drawing || !this.renderer || !this.currentCell) return;
      const rect = this.canvas!.getBoundingClientRect();
      const cell = this.renderer.getCellAt(e.clientX - rect.left, e.clientY - rect.top);
      if (!cell) return;

      // Same cell, ignore
      if (cell.row === this.currentCell.row && cell.col === this.currentCell.col) return;

      // Check if backtracking
      if (this.cellPath.length >= 2) {
        const prev = this.cellPath[this.cellPath.length - 2];
        if (cell.row === prev.row && cell.col === prev.col) {
          // Backtrack
          this.cellPath.pop();
          this.renderer.path.pop();
          this.currentCell = { ...prev };
          return;
        }
      }

      // Check if valid move
      if (this.renderer.canMoveBetween(this.currentCell, cell)) {
        // Check not revisiting (except backtrack handled above)
        const alreadyVisited = this.cellPath.some((c) => c.row === cell.row && c.col === cell.col);
        if (alreadyVisited) return;

        this.currentCell = { ...cell };
        this.cellPath.push({ ...cell });
        this.renderer.path.push(this.renderer.getCellCenter(cell.row, cell.col));

        // Check if reached end
        if (cell.row === this.renderer['maze'].end.row && cell.col === this.renderer['maze'].end.col) {
          this.renderer.completed = true;
          this.drawing = false;
          playCorrect();
          playCelebration();
          this.fox.setState('happy');
          this.fox.speak('Bravo, sorti !', 3000);
        }
      }
    };

    this.pointerUpH = () => { this.drawing = false; };

    this.canvas.addEventListener('pointerdown', this.pointerDownH);
    this.canvas.addEventListener('pointermove', this.pointerMoveH);
    this.canvas.addEventListener('pointerup', this.pointerUpH);
    this.canvas.addEventListener('pointerleave', this.pointerUpH);
  }

  private startRenderLoop() {
    cancelAnimationFrame(this.animFrameId);
    const loop = () => {
      this.renderer?.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  exit() {
    cancelAnimationFrame(this.animFrameId);
    if (this.canvas) {
      if (this.pointerDownH) this.canvas.removeEventListener('pointerdown', this.pointerDownH);
      if (this.pointerMoveH) this.canvas.removeEventListener('pointermove', this.pointerMoveH);
      if (this.pointerUpH) {
        this.canvas.removeEventListener('pointerup', this.pointerUpH);
        this.canvas.removeEventListener('pointerleave', this.pointerUpH);
      }
    }
    this.container?.remove();
    this.container = null;
    this.canvas = null;
    this.renderer = null;
  }
}
