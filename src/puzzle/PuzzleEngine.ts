import type { EdgeType } from './JigsawPath';
import { PuzzlePiece, type PieceData } from './PuzzlePiece';

export interface PuzzleConfig {
  image: HTMLCanvasElement;
  totalPieces: number;
  canvasWidth: number;
  canvasHeight: number;
}

export class PuzzleEngine {
  pieces: PuzzlePiece[] = [];
  cols = 0;
  rows = 0;
  pieceW = 0;
  pieceH = 0;
  image: HTMLCanvasElement;
  // Offset for the puzzle target area on canvas
  offsetX = 0;
  offsetY = 0;
  private nextGroupId = 0;

  constructor(config: PuzzleConfig) {
    this.image = config.image;
    this.calculateGrid(config.totalPieces);
    this.calculateLayout(config.canvasWidth, config.canvasHeight);
    this.generatePieces(config.canvasWidth, config.canvasHeight);
  }

  private calculateGrid(total: number) {
    // Find cols x rows closest to the image aspect ratio
    const aspect = this.image.width / this.image.height;
    let bestCols = 1;
    let bestRows = 1;
    let bestDiff = Infinity;

    for (let c = 1; c <= total; c++) {
      const r = Math.round(total / c);
      if (r < 1) continue;
      const actual = c * r;
      if (actual < total * 0.7 || actual > total * 1.3) continue;
      const gridAspect = c / r;
      const diff = Math.abs(gridAspect - aspect) + Math.abs(actual - total) * 0.1;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCols = c;
        bestRows = r;
      }
    }
    this.cols = bestCols;
    this.rows = bestRows;
  }

  private calculateLayout(canvasW: number, canvasH: number) {
    // Scale puzzle to fit in ~70% of canvas
    const maxW = canvasW * 0.7;
    const maxH = canvasH * 0.7;
    const imgAspect = this.image.width / this.image.height;

    let puzzleW: number, puzzleH: number;
    if (maxW / maxH > imgAspect) {
      puzzleH = maxH;
      puzzleW = puzzleH * imgAspect;
    } else {
      puzzleW = maxW;
      puzzleH = puzzleW / imgAspect;
    }

    this.pieceW = puzzleW / this.cols;
    this.pieceH = puzzleH / this.rows;
    this.offsetX = (canvasW - puzzleW) / 2;
    this.offsetY = (canvasH - puzzleH) / 2;
  }

  private generatePieces(canvasW: number, canvasH: number) {
    // hEdge[r][c] = true means there's a tab going DOWN at the boundary between row r and r+1
    // So piece(r,c).bottom = 'tab' and piece(r+1,c).top = 'blank'
    const hEdge: boolean[][] = [];
    for (let r = 0; r < this.rows - 1; r++) {
      hEdge[r] = [];
      for (let c = 0; c < this.cols; c++) {
        hEdge[r][c] = Math.random() > 0.5;
      }
    }

    // vEdge[r][c] = true means there's a tab going RIGHT at the boundary between col c and c+1
    // So piece(r,c).right = 'tab' and piece(r,c+1).left = 'blank'
    const vEdge: boolean[][] = [];
    for (let r = 0; r < this.rows; r++) {
      vEdge[r] = [];
      for (let c = 0; c < this.cols - 1; c++) {
        vEdge[r][c] = Math.random() > 0.5;
      }
    }

    let id = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Top edge
        let top: EdgeType = 'flat';
        if (r > 0) {
          top = hEdge[r - 1][c] ? 'blank' : 'tab'; // complement of piece above's bottom
        }

        // Bottom edge
        let bottom: EdgeType = 'flat';
        if (r < this.rows - 1) {
          bottom = hEdge[r][c] ? 'tab' : 'blank';
        }

        // Left edge
        let left: EdgeType = 'flat';
        if (c > 0) {
          left = vEdge[r][c - 1] ? 'blank' : 'tab'; // complement of piece left's right
        }

        // Right edge
        let right: EdgeType = 'flat';
        if (c < this.cols - 1) {
          right = vEdge[r][c] ? 'tab' : 'blank';
        }

        const targetX = this.offsetX + c * this.pieceW;
        const targetY = this.offsetY + r * this.pieceH;

        // Random scatter position
        const padX = this.pieceW * 0.2;
        const padY = this.pieceH * 0.2;
        const fullW = this.pieceW + padX * 2;
        const fullH = this.pieceH + padY * 2;
        const randX = Math.random() * (canvasW - fullW);
        const randY = Math.random() * (canvasH - fullH);

        const data: PieceData = {
          id: id++,
          col: c,
          row: r,
          x: randX,
          y: randY,
          targetX,
          targetY,
          width: this.pieceW,
          height: this.pieceH,
          edges: [top, right, bottom, left],
          isPlaced: false,
          groupId: this.nextGroupId++,
          zIndex: id,
        };

        this.pieces.push(new PuzzlePiece(data));
      }
    }
  }

  getPieceAt(px: number, py: number): PuzzlePiece | null {
    // Find topmost non-placed piece at position
    let best: PuzzlePiece | null = null;
    for (const piece of this.pieces) {
      if (piece.containsPoint(px, py)) {
        if (!best || piece.data.zIndex > best.data.zIndex) {
          best = piece;
        }
      }
    }
    return best;
  }

  getGroupPieces(groupId: number): PuzzlePiece[] {
    return this.pieces.filter((p) => p.data.groupId === groupId);
  }

  trySnap(piece: PuzzlePiece): boolean {
    const SNAP_THRESHOLD = 30;
    if (piece.distanceToTarget() < SNAP_THRESHOLD) {
      const group = this.getGroupPieces(piece.data.groupId);
      for (const p of group) {
        p.snapToTarget();
      }
      // Merge with adjacent placed groups
      this.mergeAdjacentGroups(piece);
      return true;
    }
    return false;
  }

  private mergeAdjacentGroups(piece: PuzzlePiece) {
    const group = this.getGroupPieces(piece.data.groupId);
    for (const p of group) {
      const neighbors = this.getAdjacentPieces(p);
      for (const neighbor of neighbors) {
        if (neighbor.data.isPlaced && neighbor.data.groupId !== p.data.groupId) {
          // Merge groups
          const oldGroup = neighbor.data.groupId;
          const newGroup = p.data.groupId;
          for (const mp of this.pieces) {
            if (mp.data.groupId === oldGroup) {
              mp.data.groupId = newGroup;
            }
          }
        }
      }
    }
  }

  private getAdjacentPieces(piece: PuzzlePiece): PuzzlePiece[] {
    const { col, row } = piece.data;
    return this.pieces.filter((p) =>
      (p.data.col === col - 1 && p.data.row === row) ||
      (p.data.col === col + 1 && p.data.row === row) ||
      (p.data.col === col && p.data.row === row - 1) ||
      (p.data.col === col && p.data.row === row + 1),
    );
  }

  moveGroup(groupId: number, dx: number, dy: number) {
    for (const p of this.pieces) {
      if (p.data.groupId === groupId && !p.data.isPlaced) {
        p.data.x += dx;
        p.data.y += dy;
      }
    }
  }

  bringToFront(groupId: number) {
    const maxZ = Math.max(...this.pieces.map((p) => p.data.zIndex));
    let z = maxZ + 1;
    for (const p of this.pieces) {
      if (p.data.groupId === groupId) {
        p.data.zIndex = z++;
      }
    }
  }

  scatterOutsideBoard(canvasW: number, canvasH: number) {
    const unplaced = this.pieces.filter((p) => !p.data.isPlaced);
    const boardRight = this.offsetX + this.pieceW * this.cols + 20;

    // Try to place pieces to the right of the board first, then below
    const margin = 10;
    let x = boardRight;
    let y = margin;
    const rowHeight = unplaced.length > 0 ? unplaced[0].fullHeight + margin : 100;

    for (const piece of unplaced) {
      // If we'd go off-screen to the right, try below the board
      if (x + piece.fullWidth > canvasW) {
        x = margin;
        y += rowHeight;
        // If below the board area, wrap from top-left outside
        if (y > canvasH - piece.fullHeight) {
          y = margin;
          x = margin;
        }
      }
      piece.data.x = x;
      piece.data.y = y;
      x += piece.fullWidth + margin;
    }
  }

  get placedCount(): number {
    return this.pieces.filter((p) => p.data.isPlaced).length;
  }

  get totalCount(): number {
    return this.pieces.length;
  }

  get isComplete(): boolean {
    return this.pieces.every((p) => p.data.isPlaced);
  }

  // --- Save / Load ---

  save() {
    const state = {
      cols: this.cols,
      rows: this.rows,
      pieceW: this.pieceW,
      pieceH: this.pieceH,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      imageDataURL: this.image.toDataURL('image/jpeg', 0.8),
      pieces: this.pieces.map((p) => p.data),
    };
    localStorage.setItem('goupil-puzzle-save', JSON.stringify(state));
  }

  clearSave() {
    localStorage.removeItem('goupil-puzzle-save');
  }

  static hasSave(): boolean {
    return localStorage.getItem('goupil-puzzle-save') !== null;
  }

  static async loadSave(): Promise<PuzzleEngine | null> {
    const raw = localStorage.getItem('goupil-puzzle-save');
    if (!raw) return null;
    try {
      const state = JSON.parse(raw);
      const img = await loadImageFromDataURL(state.imageDataURL);
      const engine = Object.create(PuzzleEngine.prototype) as PuzzleEngine;
      engine.image = img;
      engine.cols = state.cols;
      engine.rows = state.rows;
      engine.pieceW = state.pieceW;
      engine.pieceH = state.pieceH;
      engine.offsetX = state.offsetX;
      engine.offsetY = state.offsetY;
      engine.pieces = state.pieces.map((d: PieceData) => new PuzzlePiece(d));
      return engine;
    } catch {
      localStorage.removeItem('goupil-puzzle-save');
      return null;
    }
  }
}

function loadImageFromDataURL(dataURL: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')!.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}
