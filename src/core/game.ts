import { GameState, Customer, Rotation } from './types'
import { createStartingBag, drawInitialScoops, drawScoop, createRefillBag } from './bag'
import { createRandomBento } from '../data/bentos'
import { placeScoop, isBentoFull, canPlace } from './placement'
import { getRotatedShape } from './polyomino'
import { calculateFillPercentage, calculatePayment } from './scoring'

const CUSTOMER_NAMES = [
  'Tanaka',
  'Suzuki',
  'Yamamoto',
  'Watanabe',
  'Nakamura',
  'Kobayashi',
  'Sato',
  'Kato',
]

const MAX_CUSTOMERS_TOTAL = 8
const ACTIVE_CUSTOMER_SLOTS = 3
const PATIENCE_BUFFER = 2
const AVG_SCOOP_SIZE = 4

let customerIdCounter = 0

function generateCustomerName(): string {
  return CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
}

function createCustomer(): Customer {
  const bento = createRandomBento()
  const patience = Math.ceil(bento.size / AVG_SCOOP_SIZE) * ACTIVE_CUSTOMER_SLOTS + PATIENCE_BUFFER

  return {
    id: `customer-${customerIdCounter++}`,
    name: generateCustomerName(),
    patience,
    maxPatience: patience,
    bento,
    scoopsUsed: 0,
  }
}

/**
 * Create initial game state
 */
export function createInitialState(): GameState {
  const bag = createStartingBag()
  const { current, next, remaining } = drawInitialScoops(bag)

  // Start with initial customers
  const customers = Array.from({ length: ACTIVE_CUSTOMER_SLOTS }, () => createCustomer())

  return {
    customers,
    bag: remaining,
    currentScoop: current,
    nextScoop: next,
    cursor: {
      bentoIndex: 0,
      position: { row: 0, col: 0 },
    },
    rotation: 0,
    turn: 0,
    customersServed: 0,
    customersAngry: 0,
    totalPayment: 0,
    phase: 'playing',
    lastServedEvent: null,
    perfectStreak: 0,
    maxPerfectBonusPercent: 30,
  }
}

/**
 * Move cursor in a direction
 */
export function moveCursor(
  state: GameState,
  direction: 'up' | 'down' | 'left' | 'right'
): GameState {
  const customer = state.customers[state.cursor.bentoIndex]
  if (!customer) return state

  const { row, col } = state.cursor.position
  let newRow = row
  let newCol = col
  let newBentoIndex = state.cursor.bentoIndex

  // Allow cursor to move outside bento bounds for overflow placement
  const minRow = -1
  const maxRow = customer.bento.height
  const minCol = -1
  const maxCol = customer.bento.width

  switch (direction) {
    case 'up':
      newRow = Math.max(minRow, row - 1)
      break
    case 'down':
      newRow = Math.min(maxRow, row + 1)
      break
    case 'left':
      if (col <= minCol && state.customers.length > 1) {
        // Switch to previous bento
        newBentoIndex = (state.cursor.bentoIndex - 1 + state.customers.length) % state.customers.length
        const newBento = state.customers[newBentoIndex].bento
        newCol = newBento.width // Start at right edge of new bento
      } else {
        newCol = Math.max(minCol, col - 1)
      }
      break
    case 'right':
      if (col >= maxCol && state.customers.length > 1) {
        // Switch to next bento
        newBentoIndex = (state.cursor.bentoIndex + 1) % state.customers.length
        newCol = 0  // Start at left edge of new bento
      } else {
        newCol = Math.min(maxCol, col + 1)
      }
      break
  }

  return {
    ...state,
    cursor: {
      bentoIndex: newBentoIndex,
      position: { row: newRow, col: newCol },
    },
  }
}


/**
 * Rotate current scoop 90° clockwise
 */
export function rotateScoop(state: GameState): GameState {
  const newRotation = ((state.rotation + 1) % 4) as Rotation
  return {
    ...state,
    rotation: newRotation,
  }
}

/**
 * Advance to next scoop from bag
 */
function advanceScoop(state: GameState): GameState {
  let bag = state.bag

  // Refill bag if empty
  if (bag.length === 0) {
    bag = createRefillBag()
  }

  const { scoop: newNext, remaining } = drawScoop(bag)

  return {
    ...state,
    currentScoop: state.nextScoop,
    nextScoop: newNext,
    bag: remaining,
    rotation: 0,
  }
}

/**
 * Calculate streak bonus multiplier (e.g., streak 2 with max 30% = 1.2)
 */
function calculateStreakBonus(streak: number, maxBonusPercent: number): number {
  const bonusPercent = Math.min(streak * 10, maxBonusPercent)
  return 1 + bonusPercent / 100
}

/**
 * Check and handle customer completion/anger
 */
function processCustomers(state: GameState): GameState {
  let newState: GameState = { ...state, lastServedEvent: null }
  const customersToRemove: number[] = []
  let newCustomersServed = state.customersServed
  let newCustomersAngry = state.customersAngry
  let newPayment = state.totalPayment
  let newPerfectStreak = state.perfectStreak

  // Track serve results for streak calculation
  let servedImperfect = false
  let customerAngry = false

  // Check each customer
  newState.customers.forEach((customer, index) => {
    // Check if bento is full (served)
    if (isBentoFull(customer.bento)) {
      const fillPercentage = calculateFillPercentage(customer.bento)
      let payment = calculatePayment(fillPercentage)
      const minScoops = Math.ceil(customer.bento.size / AVG_SCOOP_SIZE)
      const isPerfect = customer.scoopsUsed <= minScoops

      if (isPerfect) {
        // Increment streak first, then calculate bonus
        newPerfectStreak = state.perfectStreak + 1
        const bonusMultiplier = calculateStreakBonus(newPerfectStreak, state.maxPerfectBonusPercent)
        payment = Math.round(payment * bonusMultiplier)
      } else {
        servedImperfect = true
      }

      newCustomersServed++
      newPayment += payment
      customersToRemove.push(index)
      // Record served event for animation (include streak at time of serve)
      newState.lastServedEvent = { slotIndex: index, payment, isPerfect, perfectStreak: isPerfect ? newPerfectStreak : 0 }
    }
    // Check if patience depleted (angry)
    else if (customer.patience <= 0) {
      newCustomersAngry++
      customersToRemove.push(index)
      customerAngry = true
    }
  })

  // Update streak based on what happened this turn
  // Angry customer or imperfect serve breaks the streak
  if (customerAngry || servedImperfect) {
    newPerfectStreak = 0
  }
  // If only perfect serve (no angry), streak was already incremented above

  // Check if game should end
  const totalProcessed = newCustomersServed + newCustomersAngry
  const gameEnding = totalProcessed >= MAX_CUSTOMERS_TOTAL

  // Replace served/angry customers in-place (so positions don't jump)
  const updatedCustomers = newState.customers.map((customer, index) => {
    if (!customersToRemove.includes(index)) {
      return customer
    }
    // If the game is ending, remove the slot entirely
    if (gameEnding) {
      return null
    }
    // Check if we can still spawn a replacement
    const slotsAccountedFor = newCustomersServed + newCustomersAngry +
      newState.customers.length - customersToRemove.length
    if (slotsAccountedFor < MAX_CUSTOMERS_TOTAL) {
      return createCustomer()
    }
    return null
  }).filter((c): c is Customer => c !== null)

  newState = {
    ...newState,
    customers: updatedCustomers,
    customersServed: newCustomersServed,
    customersAngry: newCustomersAngry,
    totalPayment: newPayment,
    perfectStreak: newPerfectStreak,
  }

  if (gameEnding) {
    return {
      ...newState,
      phase: 'ended',
    }
  }

  // Fix cursor if it was pointing to a removed customer
  if (newState.cursor.bentoIndex >= newState.customers.length) {
    newState = {
      ...newState,
      cursor: {
        bentoIndex: Math.max(0, newState.customers.length - 1),
        position: { row: 0, col: 0 },
      },
    }
  }

  return newState
}

/**
 * Decrease patience for all customers
 */
function decreasePatience(state: GameState): GameState {
  return {
    ...state,
    customers: state.customers.map(customer => ({
      ...customer,
      patience: customer.patience - 1,
    })),
  }
}

/**
 * Place current scoop on selected bento
 */
export function placeCurrentScoop(state: GameState): GameState {
  if (!state.currentScoop || state.phase !== 'playing') return state

  const customer = state.customers[state.cursor.bentoIndex]
  if (!customer) return state

  const rotatedShape = getRotatedShape(state.currentScoop.shape, state.rotation)

  // Check if placement is valid (at least one cell overlaps)
  if (!canPlace(customer.bento, rotatedShape, state.cursor.position)) {
    return state
  }

  // Place the scoop
  const newBento = placeScoop(
    customer.bento,
    rotatedShape,
    state.cursor.position
  )

  // Update customer's bento and increment scoops used
  let newState: GameState = {
    ...state,
    customers: state.customers.map((c, i) =>
      i === state.cursor.bentoIndex
        ? { ...c, bento: newBento, scoopsUsed: c.scoopsUsed + 1 }
        : c
    ),
    turn: state.turn + 1,
  }

  // Advance to next scoop
  newState = advanceScoop(newState)

  // Decrease patience for all customers
  newState = decreasePatience(newState)

  // Process customer completions/departures
  newState = processCustomers(newState)

  return newState
}

/**
 * Discard current scoop (skip turn)
 */
export function discardCurrentScoop(state: GameState): GameState {
  if (!state.currentScoop || state.phase !== 'playing') return state

  let newState: GameState = {
    ...state,
    turn: state.turn + 1,
  }

  // Advance to next scoop
  newState = advanceScoop(newState)

  // Decrease patience for all customers
  newState = decreasePatience(newState)

  // Process customer completions/departures
  newState = processCustomers(newState)

  return newState
}

/**
 * Clear the last served event (after animation completes)
 */
export function clearServedEvent(state: GameState): GameState {
  return { ...state, lastServedEvent: null }
}
