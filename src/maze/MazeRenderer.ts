import type { Maze } from './MazeGenerator';

export class MazeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maze: Maze;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  path: { x: number; y: number }[] = [];
  completed = false;

  constructor(canvas: HTMLCanvasElement, maze: Maze) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.maze = maze;

    // Calculate cell size to fit canvas
    const maxW = canvas.width * 0.85;
    const maxH = canvas.height * 0.75;
    this.cellSize = Math.floor(Math.min(maxW / maze.cols, maxH / maze.rows));
    this.offsetX = (canvas.width - this.cellSize * maze.cols) / 2;
    this.offsetY = (canvas.height - this.cellSize * maze.rows) / 2;
  }

  getCellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + row * this.cellSize + this.cellSize / 2,
    };
  }

  getCellAt(px: number, py: number): { row: number; col: number } | null {
    const col = Math.floor((px - this.offsetX) / this.cellSize);
    const row = Math.floor((py - this.offsetY) / this.cellSize);
    if (row < 0 || row >= this.maze.rows || col < 0 || col >= this.maze.cols) return null;
    return { row, col };
  }

  canMoveBetween(from: { row: number; col: number }, to: { row: number; col: number }): boolean {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    if (Math.abs(dr) + Math.abs(dc) !== 1) return false;
    const cell = this.maze.grid[from.row][from.col];
    if (dr === -1 && cell.walls.top) return false;
    if (dr === 1 && cell.walls.bottom) return false;
    if (dc === -1 && cell.walls.left) return false;
    if (dc === 1 && cell.walls.right) return false;
    return true;
  }

  render() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#5BA3C9';
    ctx.fillRect(0, 0, w, h);

    // Maze background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.offsetX, this.offsetY, cs * this.maze.cols, cs * this.maze.rows);

    // Draw path
    if (this.path.length > 1) {
      ctx.strokeStyle = this.completed ? '#51CF66' : '#4ECDC4';
      ctx.lineWidth = cs * 0.35;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.path[0].x, this.path[0].y);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i].x, this.path[i].y);
      }
      ctx.stroke();
    }

    // Draw walls
    ctx.strokeStyle = '#2D3436';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let r = 0; r < this.maze.rows; r++) {
      for (let c = 0; c < this.maze.cols; c++) {
        const x = this.offsetX + c * cs;
        const y = this.offsetY + r * cs;
        const cell = this.maze.grid[r][c];

        if (cell.walls.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke(); }
        if (cell.walls.right) { ctx.beginPath(); ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); ctx.stroke(); }
        if (cell.walls.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x + cs, y + cs); ctx.stroke(); }
        if (cell.walls.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cs); ctx.stroke(); }
      }
    }

    // Start marker
    const startCenter = this.getCellCenter(this.maze.start.row, this.maze.start.col);
    ctx.fillStyle = '#51CF66';
    ctx.beginPath();
    ctx.arc(startCenter.x, startCenter.y, cs * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // End marker (star emoji via text)
    const endCenter = this.getCellCenter(this.maze.end.row, this.maze.end.col);
    ctx.font = `${cs * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2B50', endCenter.x, endCenter.y);
  }
}
