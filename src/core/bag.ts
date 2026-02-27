import { Scoop } from './types'
import { TETROMINOES } from '../data/shapes'

/**
 * Fisher-Yates shuffle
 */
export function shuffleBag<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Create the starting deck: 2 of each tetromino (14 plain scoops)
 */
export function createStartingDeck(): { deck: Scoop[]; nextDeckId: number } {
  const shapes = Object.entries(TETROMINOES)
  const deck: Scoop[] = []
  let id = 0

  for (const [shapeName, shape] of shapes) {
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `deck-${id}`,
        shape,
        shapeName,
        ingredient: null,
      })
      id++
    }
  }

  return { deck, nextDeckId: id }
}

/**
 * Create a bag by shuffling a copy of the deck
 */
export function createBagFromDeck(deck: Scoop[]): Scoop[] {
  return shuffleBag([...deck])
}

/**
 * Draw a scoop from the bag
 */
export function drawScoop(bag: Scoop[]): {
  scoop: Scoop | null
  remaining: Scoop[]
} {
  if (bag.length === 0) {
    return { scoop: null, remaining: [] }
  }

  const [scoop, ...remaining] = bag
  return { scoop, remaining }
}

/**
 * Draw two scoops (current and next)
 */
export function drawInitialScoops(bag: Scoop[]): {
  current: Scoop | null
  next: Scoop | null
  remaining: Scoop[]
} {
  const first = drawScoop(bag)
  const second = drawScoop(first.remaining)

  return {
    current: first.scoop,
    next: second.scoop,
    remaining: second.remaining,
  }
}
