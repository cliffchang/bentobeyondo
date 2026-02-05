import { Shape } from '../core/types'

/**
 * All 7 standard tetrominoes
 * true = filled cell, false = empty
 */
export const TETROMINOES: Record<string, Shape> = {
  // I: Vertical line (4x1)
  I: [
    [true],
    [true],
    [true],
    [true],
  ],

  // O: Square (2x2)
  O: [
    [true, true],
    [true, true],
  ],

  // T: T-shape
  T: [
    [true, true, true],
    [false, true, false],
  ],

  // S: S-zigzag
  S: [
    [false, true, true],
    [true, true, false],
  ],

  // Z: Z-zigzag
  Z: [
    [true, true, false],
    [false, true, true],
  ],

  // L: L-shape
  L: [
    [true, false],
    [true, false],
    [true, true],
  ],

  // J: J-shape (mirrored L)
  J: [
    [false, true],
    [false, true],
    [true, true],
  ],
}

/**
 * Get all tetromino shapes as an array
 */
export function getAllShapes(): Shape[] {
  return Object.values(TETROMINOES)
}

/**
 * Get a random tetromino shape
 */
export function getRandomShape(): Shape {
  const shapes = getAllShapes()
  return shapes[Math.floor(Math.random() * shapes.length)]
}
