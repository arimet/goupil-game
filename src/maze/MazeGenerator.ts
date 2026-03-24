export interface Cell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

export interface Maze {
  rows: number;
  cols: number;
  grid: Cell[][];
  start: { row: number; col: number };
  end: { row: number; col: number };
}

export function generateMaze(rows: number, cols: number): Maze {
  // Initialize grid
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
    }
  }

  // DFS recursive backtracker
  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, rows, cols);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  return {
    rows,
    cols,
    grid,
    start: { row: 0, col: 0 },
    end: { row: rows - 1, col: cols - 1 },
  };
}

function getUnvisitedNeighbors(cell: Cell, grid: Cell[][], rows: number, cols: number): Cell[] {
  const { row, col } = cell;
  const neighbors: Cell[] = [];
  if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
  return neighbors;
}

function removeWall(a: Cell, b: Cell) {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (dr === -1) { a.walls.top = false; b.walls.bottom = false; }
  if (dr === 1) { a.walls.bottom = false; b.walls.top = false; }
  if (dc === -1) { a.walls.left = false; b.walls.right = false; }
  if (dc === 1) { a.walls.right = false; b.walls.left = false; }
}
