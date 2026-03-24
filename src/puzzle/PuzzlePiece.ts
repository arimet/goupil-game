import type { EdgeType } from './JigsawPath';
import { buildPiecePath } from './JigsawPath';

export interface PieceData {
  id: number;
  col: number;
  row: number;
  // Current position (top-left of the piece bounding box including tab padding)
  x: number;
  y: number;
  // Target position (where the piece should snap to)
  targetX: number;
  targetY: number;
  // Piece dimensions (without padding)
  width: number;
  height: number;
  // Edge types: [top, right, bottom, left]
  edges: [EdgeType, EdgeType, EdgeType, EdgeType];
  // State
  isPlaced: boolean;
  groupId: number;
  zIndex: number;
}

export class PuzzlePiece {
  data: PieceData;
  path: Path2D;
  // Padding for tabs
  padX: number;
  padY: number;
  // Full bounding box size (including padding for tabs)
  fullWidth: number;
  fullHeight: number;

  constructor(data: PieceData) {
    this.data = data;
    this.padX = data.width * 0.2;
    this.padY = data.height * 0.2;
    this.fullWidth = data.width + this.padX * 2;
    this.fullHeight = data.height + this.padY * 2;
    this.path = buildPiecePath(data.width, data.height, data.edges);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    sourceImage: HTMLCanvasElement | HTMLImageElement,
    sourceX: number,
    sourceY: number,
  ) {
    ctx.save();
    ctx.translate(this.data.x, this.data.y);

    // Clip to jigsaw shape
    ctx.beginPath();
    ctx.clip(this.path);

    // Draw image portion (offset by padding to align with clip path)
    ctx.drawImage(
      sourceImage,
      sourceX - this.padX,
      sourceY - this.padY,
      this.fullWidth,
      this.fullHeight,
      0, 0,
      this.fullWidth,
      this.fullHeight,
    );

    // Draw border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke(this.path);

    ctx.restore();
  }

  containsPoint(px: number, py: number): boolean {
    // Quick bounding box check
    const x = px - this.data.x;
    const y = py - this.data.y;
    if (x < 0 || y < 0 || x > this.fullWidth || y > this.fullHeight) return false;

    // Precise path check using offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(-px + this.data.x, -py + this.data.y);
    // Doesn't work perfectly - use bounding box for now
    return true;
  }

  distanceToTarget(): number {
    const dx = (this.data.x + this.padX) - (this.data.targetX);
    const dy = (this.data.y + this.padY) - (this.data.targetY);
    return Math.sqrt(dx * dx + dy * dy);
  }

  snapToTarget() {
    this.data.x = this.data.targetX - this.padX;
    this.data.y = this.data.targetY - this.padY;
    this.data.isPlaced = true;
  }
}
