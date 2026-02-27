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
 * Calculate review stars for a served customer
 * Fill ≤ 50%: 1 star (cliff)
 * Fill > 50%: scales from 1.0 to 3.5
 * +0.5 for PERFECTO, +0.5 for DELICIOSO, +1.5 for both
 *   (so technically 4.5* is not possible)
 */
export function calculateReviewStars(
  fillPercentage: number,
  isPerfect: boolean,
  isDelicioso: boolean
): number {
  let stars: number
  if (fillPercentage <= 50) {
    stars = 1.0
  } else {
    stars = 1.0 + ((fillPercentage - 50) / 50) * 2.5
  }

  if (isPerfect) stars += 0.5
  if (isDelicioso) stars += 0.5
  if (isPerfect && isDelicioso) stars += 0.5

  return Math.min(5.0, Math.round(stars * 10) / 10)
}

/**
 * Calculate stats for end-game display
 */
export interface GameStats {
  customersServed: number
  patienceExpired: number
  totalPayment: number
  averageFillPercentage: number
}

export function calculateGameStats(
  customersServed: number,
  patienceExpired: number,
  totalPayment: number,
  fillPercentages: number[]
): GameStats {
  const averageFillPercentage =
    fillPercentages.length > 0
      ? fillPercentages.reduce((a, b) => a + b, 0) / fillPercentages.length
      : 0

  return {
    customersServed,
    patienceExpired,
    totalPayment,
    averageFillPercentage: Math.round(averageFillPercentage * 10) / 10,
  }
}
