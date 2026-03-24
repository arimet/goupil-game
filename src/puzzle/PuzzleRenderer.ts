import type { PuzzleEngine } from './PuzzleEngine';
import type { PuzzlePiece } from './PuzzlePiece';

export class PuzzleRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: PuzzleEngine;
  private pieceCache = new Map<number, HTMLCanvasElement>();
  showHint = false;

  constructor(canvas: HTMLCanvasElement, engine: PuzzleEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    this.prebakePieces();
  }

  private prebakePieces() {
    const imgW = this.engine.image.width;
    const imgH = this.engine.image.height;
    const scaleX = imgW / (this.engine.pieceW * this.engine.cols);
    const scaleY = imgH / (this.engine.pieceH * this.engine.rows);

    for (const piece of this.engine.pieces) {
      this.pieceCache.set(piece.data.id, this.bakePiece(piece, scaleX, scaleY));
    }
  }

  private bakePiece(piece: PuzzlePiece, scaleX: number, scaleY: number): HTMLCanvasElement {
    const srcX = piece.data.col * piece.data.width * scaleX;
    const srcY = piece.data.row * piece.data.height * scaleY;
    const padX = piece.padX;
    const padY = piece.padY;
    const fullW = Math.ceil(piece.fullWidth);
    const fullH = Math.ceil(piece.fullHeight);

    const c = document.createElement('canvas');
    c.width = fullW;
    c.height = fullH;
    const tctx = c.getContext('2d')!;

    // White background clipped to jigsaw shape
    tctx.save();
    tctx.clip(piece.path);
    tctx.fillStyle = '#ffffff';
    tctx.fillRect(0, 0, fullW, fullH);

    // Draw the image region
    tctx.drawImage(
      this.engine.image,
      srcX - padX * scaleX,
      srcY - padY * scaleY,
      fullW * scaleX,
      fullH * scaleY,
      0, 0,
      fullW, fullH,
    );
    tctx.restore();

    // Border
    tctx.strokeStyle = 'rgba(0,0,0,0.5)';
    tctx.lineWidth = 2;
    tctx.stroke(piece.path);

    // Drop shadow effect - draw a slightly offset darker version
    return c;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Fill background
    ctx.fillStyle = '#5BA3C9';
    ctx.fillRect(0, 0, w, h);

    // Target area outline
    const puzzleW = this.engine.pieceW * this.engine.cols;
    const puzzleH = this.engine.pieceH * this.engine.rows;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(this.engine.offsetX, this.engine.offsetY, puzzleW, puzzleH);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(this.engine.offsetX, this.engine.offsetY, puzzleW, puzzleH);
    ctx.setLineDash([]);

    // Hint image
    if (this.showHint) {
      ctx.globalAlpha = 0.25;
      ctx.drawImage(this.engine.image, this.engine.offsetX, this.engine.offsetY, puzzleW, puzzleH);
      ctx.globalAlpha = 1;
    }

    // Sort and draw pieces
    const sorted = [...this.engine.pieces].sort((a, b) => a.data.zIndex - b.data.zIndex);

    for (const piece of sorted) {
      const cached = this.pieceCache.get(piece.data.id);
      if (!cached) continue;

      // Drop shadow for non-placed pieces
      if (!piece.data.isPlaced) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(cached, piece.data.x + 3, piece.data.y + 3);
        ctx.globalAlpha = 1;
      }

      ctx.drawImage(cached, piece.data.x, piece.data.y);
    }

    // Progress counter
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(w - 130, 8, 122, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.engine.placedCount} / ${this.engine.totalCount}`, w - 69, 32);
  }
}
