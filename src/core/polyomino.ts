import { Shape, Rotation } from './types'

/**
 * Rotate a shape 90° clockwise once
 */
function rotateOnce(shape: Shape): Shape {
  const rows = shape.length
  const cols = shape[0]?.length ?? 0

  // New dimensions: cols become rows, rows become cols
  const rotated: Shape = []
  for (let c = 0; c < cols; c++) {
    rotated[c] = []
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(shape[r][c])
    }
  }
  return rotated
}

/**
 * Rotate shape 90° clockwise N times
 */
export function rotateShape(shape: Shape, times: Rotation): Shape {
  let result = shape
  for (let i = 0; i < times; i++) {
    result = rotateOnce(result)
  }
  return result
}

/**
 * Trim empty rows and columns from shape edges
 */
export function normalizeShape(shape: Shape): Shape {
  if (shape.length === 0) return shape

  // Find bounds
  let minRow = shape.length
  let maxRow = -1
  let minCol = shape[0].length
  let maxCol = -1

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        minRow = Math.min(minRow, r)
        maxRow = Math.max(maxRow, r)
        minCol = Math.min(minCol, c)
        maxCol = Math.max(maxCol, c)
      }
    }
  }

  // Empty shape
  if (maxRow === -1) return [[false]]

  // Extract bounded region
  const normalized: Shape = []
  for (let r = minRow; r <= maxRow; r++) {
    const row: boolean[] = []
    for (let c = minCol; c <= maxCol; c++) {
      row.push(shape[r][c])
    }
    normalized.push(row)
  }

  return normalized
}

/**
 * Get dimensions of a shape
 */
export function getShapeDimensions(shape: Shape): { width: number; height: number } {
  const height = shape.length
  const width = shape[0]?.length ?? 0
  return { width, height }
}

/**
 * Count filled cells in a shape
 */
export function countFilledCells(shape: Shape): number {
  let count = 0
  for (const row of shape) {
    for (const cell of row) {
      if (cell) count++
    }
  }
  return count
}

/**
 * Get the rotated and normalized shape for display/placement
 */
export function getRotatedShape(shape: Shape, rotation: Rotation): Shape {
  return normalizeShape(rotateShape(shape, rotation))
}
