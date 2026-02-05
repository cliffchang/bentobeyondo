import { BentoGrid } from './types'

/**
 * Calculate fill percentage of a bento grid
 * Only counts non-blocked cells
 */
export function calculateFillPercentage(bento: BentoGrid): number {
  let totalCells = 0
  let filledCells = 0

  for (const row of bento.cells) {
    for (const cell of row) {
      if (cell !== 'blocked') {
        totalCells++
        if (cell === 'filled') {
          filledCells++
        }
      }
    }
  }

  if (totalCells === 0) return 0
  return (filledCells / totalCells) * 100
}

/**
 * Calculate payment based on fill percentage
 * Full bento (100%) = base payment
 * Partial fill = proportional payment
 */
export function calculatePayment(fillPercentage: number): number {
  const basePayment = 100
  return Math.round((fillPercentage / 100) * basePayment)
}

/**
 * Calculate stats for end-game display
 */
export interface GameStats {
  customersServed: number
  customersAngry: number
  totalPayment: number
  averageFillPercentage: number
}

export function calculateGameStats(
  customersServed: number,
  customersAngry: number,
  totalPayment: number,
  fillPercentages: number[]
): GameStats {
  const averageFillPercentage =
    fillPercentages.length > 0
      ? fillPercentages.reduce((a, b) => a + b, 0) / fillPercentages.length
      : 0

  return {
    customersServed,
    customersAngry,
    totalPayment,
    averageFillPercentage: Math.round(averageFillPercentage * 10) / 10,
  }
}
