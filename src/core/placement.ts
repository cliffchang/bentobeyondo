import { BentoGrid, Shape, Position, CellState } from './types'

/**
 * Check if at least one cell of the shape overlaps the bento grid
 * Note: Overflow and overlap are allowed per the design
 */
export function canPlace(bento: BentoGrid, shape: Shape, position: Position): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gridRow = position.row + r
        const gridCol = position.col + c

        // Check if this cell is within the bento grid
        if (
          gridRow >= 0 &&
          gridRow < bento.height &&
          gridCol >= 0 &&
          gridCol < bento.width
        ) {
          // At least one cell overlaps - placement is valid
          return true
        }
      }
    }
  }

  // No cells overlap the bento grid
  return false
}

/**
 * Place a scoop on the bento grid
 * Returns new grid with filled cells
 * Cells outside grid or already filled are ignored (wasted)
 */
export function placeScoop(
  bento: BentoGrid,
  shape: Shape,
  position: Position
): BentoGrid {
  // Deep copy cells
  const newCells: CellState[][] = bento.cells.map(row => [...row])

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gridRow = position.row + r
        const gridCol = position.col + c

        // Only fill if within bounds and currently empty
        if (
          gridRow >= 0 &&
          gridRow < bento.height &&
          gridCol >= 0 &&
          gridCol < bento.width &&
          newCells[gridRow][gridCol] === 'empty'
        ) {
          newCells[gridRow][gridCol] = 'filled'
        }
        // Cells outside grid or already filled are wasted (ignored)
      }
    }
  }

  return new BentoGrid(newCells)
}

/**
 * Check if all non-blocked cells in the bento are filled
 */
export function isBentoFull(bento: BentoGrid): boolean {
  for (const row of bento.cells) {
    for (const cell of row) {
      if (cell === 'empty') {
        return false
      }
    }
  }
  return true
}

/**
 * Get cells that would be affected by placing a shape at a position
 * Used for preview/ghost display
 */
export function getPlacementCells(
  bento: BentoGrid,
  shape: Shape,
  position: Position
): { row: number; col: number; valid: boolean; wasted: boolean }[] {
  const cells: { row: number; col: number; valid: boolean; wasted: boolean }[] = []

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gridRow = position.row + r
        const gridCol = position.col + c

        const inBounds =
          gridRow >= 0 &&
          gridRow < bento.height &&
          gridCol >= 0 &&
          gridCol < bento.width

        const wasted =
          !inBounds ||
          (inBounds && bento.cells[gridRow][gridCol] !== 'empty')

        cells.push({
          row: gridRow,
          col: gridCol,
          valid: inBounds,
          wasted,
        })
      }
    }
  }

  return cells
}
