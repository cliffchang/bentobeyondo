import { BentoGrid, CellState } from '../core/types'

// Row patterns: each number is cells in that row, left-aligned
// These get randomly rotated/reflected for variety
const BENTO_8_PATTERNS = [
  [4, 4],           // classic 2x4
  [3, 3, 2],        // staircase
  [3, 2, 3],        // hourglass
  [4, 3, 1],        // 
  [4, 2, 2],        // 
]

const BENTO_12_PATTERNS = [
  [4, 4, 4],        // classic 3x4
  [4, 4, 3, 1],     // staircase
  [2, 4, 4, 2],     // hexagon-ish
  [3, 3, 3, 3],     // square-ish
  [5, 5, 2],        // wide top
]

// Work with raw cells internally, wrap in BentoGrid at the end
function createCellsFromPattern(rowWidths: number[]): CellState[][] {
  const maxWidth = Math.max(...rowWidths)
  return rowWidths.map(width => {
    const row: CellState[] = []
    for (let c = 0; c < maxWidth; c++) {
      row.push(c < width ? 'empty' : 'blocked')
    }
    return row
  })
}

function flipHorizontal(cells: CellState[][]): CellState[][] {
  return cells.map(row => [...row].reverse())
}

function flipVertical(cells: CellState[][]): CellState[][] {
  return [...cells].reverse()
}

function rotate90(cells: CellState[][]): CellState[][] {
  const height = cells.length
  const width = cells[0].length
  const newCells: CellState[][] = []
  for (let c = 0; c < width; c++) {
    const newRow: CellState[] = []
    for (let r = height - 1; r >= 0; r--) {
      newRow.push(cells[r][c])
    }
    newCells.push(newRow)
  }
  return newCells
}

function randomTransform(cells: CellState[][]): CellState[][] {
  let result = cells
  // Random rotation (0, 90, 180, or 270)
  const rotations = Math.floor(Math.random() * 4)
  for (let i = 0; i < rotations; i++) {
    result = rotate90(result)
  }
  // Random horizontal flip
  if (Math.random() > 0.5) {
    result = flipHorizontal(result)
  }
  // Random vertical flip
  if (Math.random() > 0.5) {
    result = flipVertical(result)
  }
  return result
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function createBento8(): BentoGrid {
  const cells = randomTransform(createCellsFromPattern(pickRandom(BENTO_8_PATTERNS)))
  return new BentoGrid(cells)
}

export function createBento12(): BentoGrid {
  const cells = randomTransform(createCellsFromPattern(pickRandom(BENTO_12_PATTERNS)))
  return new BentoGrid(cells)
}

export function createRandomBento(): BentoGrid {
  return Math.random() > 0.5 ? createBento8() : createBento12()
}

