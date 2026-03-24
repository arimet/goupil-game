export type EdgeType = 'flat' | 'tab' | 'blank';

/**
 * Build a complete jigsaw piece outline as a Path2D.
 * The piece body occupies (padX, padY) to (padX+pieceW, padY+pieceH).
 * Tabs extend into the padding area.
 *
 * edges: [top, right, bottom, left]
 * - 'tab' = protrusion outward (away from piece center)
 * - 'blank' = indentation inward (into the piece)
 * - 'flat' = straight edge (border of puzzle)
 */
export function buildPiecePath(
  pieceW: number,
  pieceH: number,
  edges: [EdgeType, EdgeType, EdgeType, EdgeType],
): Path2D {
  const padX = pieceW * 0.2;
  const padY = pieceH * 0.2;
  const path = new Path2D();

  // Start at top-left of piece body
  path.moveTo(padX, padY);

  // TOP edge: left to right, tab goes UP (negative Y)
  drawEdge(path, padX, padY, pieceW, edges[0], 'right', 'up');

  // RIGHT edge: top to bottom, tab goes RIGHT (positive X)
  drawEdge(path, padX + pieceW, padY, pieceH, edges[1], 'down', 'right');

  // BOTTOM edge: right to left, tab goes DOWN (positive Y)
  drawEdge(path, padX + pieceW, padY + pieceH, pieceW, edges[2], 'left', 'down');

  // LEFT edge: bottom to top, tab goes LEFT (negative X)
  drawEdge(path, padX, padY + pieceH, pieceH, edges[3], 'up', 'left');

  path.closePath();
  return path;
}

type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Draw one edge of a jigsaw piece.
 * @param path - Path2D to draw on
 * @param sx, sy - start point
 * @param len - length of the edge
 * @param type - flat, tab, or blank
 * @param along - direction we're traveling along the edge
 * @param tabDir - direction the tab protrudes
 */
function drawEdge(
  path: Path2D,
  sx: number,
  sy: number,
  len: number,
  type: EdgeType,
  along: Direction,
  tabDir: Direction,
) {
  // Unit vectors for "along" and "tab" directions
  const a = dirVec(along);
  const t = dirVec(tabDir);

  // End point
  const ex = sx + a.x * len;
  const ey = sy + a.y * len;

  if (type === 'flat') {
    path.lineTo(ex, ey);
    return;
  }

  // For 'blank', flip the tab direction
  const sign = type === 'tab' ? 1 : -1;
  const tabSize = len * 0.2;
  const neckW = len * 0.06;

  // Points along the edge
  // neck start: 35% along
  const n1 = 0.35;
  // neck end: 65% along
  const n2 = 0.65;

  const nsx = sx + a.x * len * n1;
  const nsy = sy + a.y * len * n1;
  const nex = sx + a.x * len * n2;
  const ney = sy + a.y * len * n2;

  // Straight to neck start
  path.lineTo(
    nsx - a.x * neckW,
    nsy - a.y * neckW,
  );

  // Neck indent toward tab
  path.lineTo(
    nsx - a.x * neckW + t.x * sign * neckW * 2,
    nsy - a.y * neckW + t.y * sign * neckW * 2,
  );

  // Tab bulge - bezier curve
  const midX = sx + a.x * len * 0.5;
  const midY = sy + a.y * len * 0.5;

  // Control point 1: near neck start, extended toward tab
  path.bezierCurveTo(
    nsx - a.x * len * 0.15 + t.x * sign * tabSize,
    nsy - a.y * len * 0.15 + t.y * sign * tabSize,
    // Control point 2: before midpoint, full tab extension
    midX - a.x * len * 0.1 + t.x * sign * tabSize * 1.1,
    midY - a.y * len * 0.1 + t.y * sign * tabSize * 1.1,
    // End: midpoint at full tab extension
    midX + t.x * sign * tabSize,
    midY + t.y * sign * tabSize,
  );

  path.bezierCurveTo(
    // Control point 1: after midpoint, full tab extension
    midX + a.x * len * 0.1 + t.x * sign * tabSize * 1.1,
    midY + a.y * len * 0.1 + t.y * sign * tabSize * 1.1,
    // Control point 2: near neck end, extended toward tab
    nex + a.x * len * 0.15 + t.x * sign * tabSize,
    ney + a.y * len * 0.15 + t.y * sign * tabSize,
    // End: neck end indent
    nex + a.x * neckW + t.x * sign * neckW * 2,
    ney + a.y * neckW + t.y * sign * neckW * 2,
  );

  // Back from neck to edge line
  path.lineTo(
    nex + a.x * neckW,
    ney + a.y * neckW,
  );

  // Straight to end
  path.lineTo(ex, ey);
}

function dirVec(d: Direction): { x: number; y: number } {
  switch (d) {
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
  }
}
