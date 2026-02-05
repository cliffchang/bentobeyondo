import { Scoop, IngredientType, Shape } from './types'
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
 * Create a single scoop from a shape
 */
function createScoop(
  id: string,
  shape: Shape,
  ingredient: IngredientType
): Scoop {
  return { id, shape, ingredient }
}

/**
 * Create starting bag with 10 scoops of mixed shapes and ingredients
 */
export function createStartingBag(): Scoop[] {
  const shapes = Object.entries(TETROMINOES)
  const ingredients: IngredientType[] = ['rice', 'protein', 'vegetable']

  const scoops: Scoop[] = []
  let scoopId = 0

  // Create 10 scoops with varied shapes and ingredients
  for (let i = 0; i < 10; i++) {
    const [shapeName, shape] = shapes[i % shapes.length]
    const ingredient = ingredients[i % ingredients.length]
    scoops.push(createScoop(`scoop-${scoopId++}`, shape, ingredient))
  }

  return shuffleBag(scoops)
}

/**
 * Create a refill bag when current bag is empty
 * This ensures the game can continue
 */
export function createRefillBag(): Scoop[] {
  return createStartingBag()
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
