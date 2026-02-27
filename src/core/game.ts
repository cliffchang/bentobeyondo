import { GameState, Customer, Rotation, PremiumIngredient, Scoop } from './types'
import { createStartingDeck, createBagFromDeck, drawInitialScoops, drawScoop, shuffleBag } from './bag'
import { createRandomBento } from '../data/bentos'
import { placeScoop, isBentoFull, canPlace } from './placement'
import { getRotatedShape } from './polyomino'
import { calculateFillPercentage, calculatePayment, calculateReviewStars } from './scoring'
import { getAllIngredients } from '../data/ingredients'
import { generateShopOfferings } from '../data/upgrades'
import { DEBUG } from './debug'

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

const MAX_CUSTOMERS_PER_DAY = 8
const ACTIVE_CUSTOMER_SLOTS = 3
const PATIENCE_BUFFER = 2
const AVG_SCOOP_SIZE = 4

// EMA weight for daily rating: 30% today, 70% history
const RATING_EMA_WEIGHT = 0.3

// Milestone checkpoints: must reach required rating by this day or game over
export const MILESTONES = [
  { day: 5, required: 2.5 },
  { day: 10, required: 3.0 },
  { day: 15, required: 3.5 },
  { day: 20, required: 4.0 },
  { day: 25, required: 4.5 },
]

/**
 * Calculate new rating from current rating and today's reviews
 * Day 1 (rating is null): raw average
 * Day 2+: exponential moving average
 */
export function calculateRating(currentRating: number | null, dayReviews: number[]): number {
  if (dayReviews.length === 0) return currentRating ?? 3.0

  const todayAvg = dayReviews.reduce((a, b) => a + b, 0) / dayReviews.length

  if (currentRating === null) {
    return Math.round(todayAvg * 10) / 10
  }

  const newRating = RATING_EMA_WEIGHT * todayAvg + (1 - RATING_EMA_WEIGHT) * currentRating
  return Math.round(newRating * 10) / 10
}

/**
 * Get the next milestone for a given day, or null if past all milestones
 */
export function getNextMilestone(day: number): { day: number; required: number } | null {
  return MILESTONES.find(m => m.day >= day) ?? null
}

let customerIdCounter = 0

function generateCustomerName(): string {
  return CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
}

/**
 * Derive menu ingredients from the deck (unique ingredients across all scoops)
 */
function getMenuIngredients(deck: Scoop[]): PremiumIngredient[] {
  const seen = new Set<string>()
  const menu: PremiumIngredient[] = []
  for (const scoop of deck) {
    if (scoop.ingredient && !seen.has(scoop.ingredient.id)) {
      seen.add(scoop.ingredient.id)
      menu.push(scoop.ingredient)
    }
  }
  return menu
}

function generateCustomerPreferences(menuIngredients: PremiumIngredient[]): PremiumIngredient[] {
  // Debug mode overrides: use all ingredients
  if (DEBUG.enabled) {
    if (Math.random() > DEBUG.customerPreferenceChance) return []
    const allIngredients = getAllIngredients()
    const shuffled = shuffleBag([...allIngredients])
    const count = 1 + Math.floor(Math.random() * DEBUG.maxPreferences)
    return shuffled.slice(0, count)
  }

  // No ingredients on menu = no preferences possible
  if (menuIngredients.length === 0) return []

  // 50% chance of 1 preference from menu
  if (Math.random() < 0.5) {
    const pick = menuIngredients[Math.floor(Math.random() * menuIngredients.length)]
    return [pick]
  }

  return []
}

function createCustomer(menuIngredients: PremiumIngredient[], patienceBonus: number): Customer {
  const bento = createRandomBento()
  const basePat = Math.ceil(bento.size / AVG_SCOOP_SIZE) * ACTIVE_CUSTOMER_SLOTS + PATIENCE_BUFFER
  const patience = basePat + patienceBonus

  return {
    id: `customer-${customerIdCounter++}`,
    name: generateCustomerName(),
    patience,
    maxPatience: patience,
    bento,
    scoopsUsed: 0,
    preferences: generateCustomerPreferences(menuIngredients),
    ingredientsReceived: [],
  }
}

/**
 * Create initial game state
 */
export function createInitialState(): GameState {
  const { deck, nextDeckId } = createStartingDeck()
  const bag = createBagFromDeck(deck)
  const { current, next, remaining } = drawInitialScoops(bag)
  const menuIngredients = getMenuIngredients(deck)

  const customers = Array.from({ length: ACTIVE_CUSTOMER_SLOTS }, () =>
    createCustomer(menuIngredients, 0)
  )

  return {
    day: 1,
    dayPayment: 0,
    totalMoney: 0,
    rating: null,
    dayReviews: [],
    deck,
    bag: remaining,
    currentScoop: current,
    nextScoop: next,
    nextDeckId,
    upgrades: { decor: [], purchasedUpgradeIds: [] },
    shopOfferings: [],
    customers,
    cursor: {
      bentoIndex: 0,
      position: { row: 0, col: 0 },
    },
    rotation: 0,
    turn: 0,
    customersServed: 0,
    patienceExpired: 0,
    phase: 'playing',
    lastServedEvent: null,
    washEvent: false,
    discardEvent: false,
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
 * Advance to next scoop from bag.
 * If nextScoop exists: promote it to current, draw a new next (may be null if bag empty).
 * If nextScoop is null: the player just used the last piece — wash! Reshuffle deck,
 * penalize patience, draw fresh current + next.
 */
function advanceScoop(state: GameState): GameState {
  // Normal case: there's a next scoop to promote
  if (state.nextScoop !== null) {
    const { scoop: newNext, remaining } = drawScoop(state.bag)
    return {
      ...state,
      currentScoop: state.nextScoop,
      nextScoop: newNext, // may be null if bag is now empty — wash comes next turn
      bag: remaining,
      rotation: 0,
    }
  }

  // Wash! nextScoop was null, so the player just placed the very last piece.
  // Reshuffle deck, penalize patience, draw fresh current + next.
  const bag = createBagFromDeck(state.deck)
  const customers = state.customers.map(c => ({
    ...c,
    patience: c.patience - 1,
  }))
  const { current, next, remaining } = drawInitialScoops(bag)

  return {
    ...state,
    currentScoop: current,
    nextScoop: next,
    bag: remaining,
    customers,
    washEvent: true,
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
 * Calculate DELICIOSO bonus from matched preferences
 * Returns matched ingredients and the bonus multiplier
 */
function calculateDeliciosoBonus(
  preferences: PremiumIngredient[],
  received: PremiumIngredient[]
): { matched: PremiumIngredient[]; multiplier: number } {
  const receivedIds = new Set(received.map(i => i.id))
  const matched = preferences.filter(p => receivedIds.has(p.id))
  const bonusPercent = matched.reduce((sum, ing) => sum + ing.bonusPercent, 0)
  return {
    matched,
    multiplier: 1 + bonusPercent / 100,
  }
}

/**
 * Process a single customer departure (served or patience expired)
 * Returns payment, review stars, and bonus info
 */
function processCustomerDeparture(
  customer: Customer,
  perfectStreak: number,
  maxPerfectBonusPercent: number
) {
  const fillPercentage = calculateFillPercentage(customer.bento)
  let payment = calculatePayment(fillPercentage)
  const bentoFull = isBentoFull(customer.bento)
  const minScoops = Math.ceil(customer.bento.size / AVG_SCOOP_SIZE)
  const isPerfect = bentoFull && customer.scoopsUsed <= minScoops

  // Calculate DELICIOSO bonus from matched preferences
  const { matched: matchedIngredients, multiplier: deliciosoMultiplier } =
    calculateDeliciosoBonus(customer.preferences, customer.ingredientsReceived)
  const isDelicioso = matchedIngredients.length > 0

  // Calculate PERFECTO bonus
  let perfectoMultiplier = 1
  let newStreak = perfectStreak
  if (isPerfect) {
    newStreak = perfectStreak + 1
    perfectoMultiplier = calculateStreakBonus(newStreak, maxPerfectBonusPercent)
  }

  // Apply bonuses multiplicatively
  payment = Math.round(payment * perfectoMultiplier * deliciosoMultiplier)

  // Calculate review
  const reviewStars = calculateReviewStars(fillPercentage, isPerfect, isDelicioso)

  return { payment, isPerfect, isDelicioso, matchedIngredients, reviewStars, newStreak }
}

/**
 * Check and handle customer departures (bento full or patience expired)
 */
function processCustomers(state: GameState): GameState {
  let newState: GameState = { ...state, lastServedEvent: null }
  const customersToRemove: number[] = []
  let newCustomersServed = state.customersServed
  let newPatienceExpired = state.patienceExpired
  let newDayPayment = state.dayPayment
  let newDayReviews = [...state.dayReviews]
  let newPerfectStreak = state.perfectStreak

  // Track whether streak should break
  let streakBroken = false

  // Derive menu + patience bonus for replacement customers
  const menuIngredients = getMenuIngredients(state.deck)
  const patienceBonus = state.upgrades.decor.length

  // Check each customer
  newState.customers.forEach((customer, index) => {
    const bentoFull = isBentoFull(customer.bento)
    const patienceOut = customer.patience <= 0

    if (!bentoFull && !patienceOut) return

    const wasPatienceExpired = !bentoFull && patienceOut

    const result = processCustomerDeparture(customer, newPerfectStreak, state.maxPerfectBonusPercent)

    if (result.isPerfect) {
      newPerfectStreak = result.newStreak
    } else {
      streakBroken = true
    }

    if (wasPatienceExpired) {
      newPatienceExpired++
      streakBroken = true
    } else {
      newCustomersServed++
    }

    newDayPayment += result.payment
    newDayReviews.push(result.reviewStars)
    customersToRemove.push(index)

    // Record event for animation
    newState.lastServedEvent = {
      slotIndex: index,
      payment: result.payment,
      isPerfect: result.isPerfect,
      perfectStreak: result.isPerfect ? newPerfectStreak : 0,
      isDelicioso: result.isDelicioso,
      matchedIngredients: result.matchedIngredients,
      reviewStars: result.reviewStars,
      patienceExpired: wasPatienceExpired,
    }
  })

  // Break streak if any non-perfect serve or patience expiry
  if (streakBroken) {
    newPerfectStreak = 0
  }

  // Check if day should end
  const totalProcessed = newCustomersServed + newPatienceExpired
  const dayEnding = totalProcessed >= MAX_CUSTOMERS_PER_DAY

  // Replace departed customers in-place (so positions don't jump)
  const updatedCustomers = newState.customers.map((customer, index) => {
    if (!customersToRemove.includes(index)) {
      return customer
    }
    if (dayEnding) {
      return null
    }
    const slotsAccountedFor = newCustomersServed + newPatienceExpired +
      newState.customers.length - customersToRemove.length
    if (slotsAccountedFor < MAX_CUSTOMERS_PER_DAY) {
      return createCustomer(menuIngredients, patienceBonus)
    }
    return null
  }).filter((c): c is Customer => c !== null)

  newState = {
    ...newState,
    customers: updatedCustomers,
    customersServed: newCustomersServed,
    patienceExpired: newPatienceExpired,
    dayPayment: newDayPayment,
    dayReviews: newDayReviews,
    perfectStreak: newPerfectStreak,
  }

  if (dayEnding) {
    return {
      ...newState,
      phase: 'day_end',
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

  // Track ingredient if scoop has one
  const ingredient = state.currentScoop.ingredient

  // Update customer's bento, scoops used, and ingredients received
  let newState: GameState = {
    ...state,
    customers: state.customers.map((c, i) =>
      i === state.cursor.bentoIndex
        ? {
            ...c,
            bento: newBento,
            scoopsUsed: c.scoopsUsed + 1,
            ingredientsReceived: ingredient
              ? [...c.ingredientsReceived, ingredient]
              : c.ingredientsReceived,
          }
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
    discardEvent: true,
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
 * Swap current and next scoops
 */
export function swapScoops(state: GameState): GameState {
  if (!state.currentScoop || !state.nextScoop || state.phase !== 'playing') {
    return state
  }

  // Requires Ambidextrous upgrade
  if (!state.upgrades.purchasedUpgradeIds.includes('ambidextrous')) {
    return state
  }

  return {
    ...state,
    currentScoop: state.nextScoop,
    nextScoop: state.currentScoop,
    rotation: 0,  // Reset rotation when swapping
  }
}

/**
 * Clear the last served event (after animation completes)
 */
export function clearServedEvent(state: GameState): GameState {
  return { ...state, lastServedEvent: null }
}

/**
 * Clear the wash event (after animation completes)
 */
export function clearWashEvent(state: GameState): GameState {
  return { ...state, washEvent: false }
}

/**
 * Clear the discard event (after animation completes)
 */
export function clearDiscardEvent(state: GameState): GameState {
  return { ...state, discardEvent: false }
}

/**
 * Enter the shop after day ends: calculate rating, check milestones, generate offerings
 */
export function enterShop(state: GameState): GameState {
  if (state.phase !== 'day_end') return state

  // Calculate new rating
  const newRating = calculateRating(state.rating, state.dayReviews)

  // Check milestone: if this day matches a milestone and rating is too low, game over
  const milestone = MILESTONES.find(m => m.day === state.day)
  if (milestone && newRating < milestone.required) {
    return {
      ...state,
      rating: newRating,
      phase: 'game_over',
    }
  }

  // Move dayPayment to totalMoney
  const totalMoney = state.totalMoney + state.dayPayment

  // Generate shop offerings
  const offerings = generateShopOfferings(
    state.day,
    state.deck,
    state.upgrades.purchasedUpgradeIds
  )

  return {
    ...state,
    rating: newRating,
    totalMoney,
    dayPayment: 0,
    shopOfferings: offerings,
    phase: 'shopping',
  }
}

/**
 * Buy an upgrade from the shop
 */
export function buyUpgrade(state: GameState, offeringId: string): GameState {
  if (state.phase !== 'shopping') return state

  const offeringIndex = state.shopOfferings.findIndex(o => o.id === offeringId)
  if (offeringIndex === -1) return state

  const offering = state.shopOfferings[offeringIndex]
  if (state.totalMoney < offering.cost) return state

  let newDeck = state.deck
  let newUpgrades = state.upgrades
  let newNextDeckId = state.nextDeckId

  if (offering.type === 'scoop') {
    // Create a new scoop and add to deck
    const newScoop: Scoop = {
      id: `deck-${newNextDeckId}`,
      shape: offering.shape,
      shapeName: offering.shapeName,
      ingredient: offering.ingredient,
    }
    newDeck = [...state.deck, newScoop]
    newNextDeckId++
  } else {
    // Kitchen upgrade: add to purchased list; decor items also grant +1 patience
    const isDecor = ['bonsai', 'koi', 'zen'].includes(offering.id)
    newUpgrades = {
      decor: isDecor ? [...state.upgrades.decor, offering.id] : state.upgrades.decor,
      purchasedUpgradeIds: [...state.upgrades.purchasedUpgradeIds, offering.id],
    }
  }

  // Remove purchased offering from shop
  const newOfferings = state.shopOfferings.filter((_, i) => i !== offeringIndex)

  return {
    ...state,
    totalMoney: state.totalMoney - offering.cost,
    deck: newDeck,
    nextDeckId: newNextDeckId,
    upgrades: newUpgrades,
    shopOfferings: newOfferings,
  }
}

/**
 * Start a new day from the shop
 */
export function startDay(state: GameState): GameState {
  if (state.phase !== 'shopping') return state

  const bag = createBagFromDeck(state.deck)
  const { current, next, remaining } = drawInitialScoops(bag)
  const menuIngredients = getMenuIngredients(state.deck)
  const patienceBonus = state.upgrades.decor.length
  const customers = Array.from({ length: ACTIVE_CUSTOMER_SLOTS }, () =>
    createCustomer(menuIngredients, patienceBonus)
  )

  return {
    ...state,
    day: state.day + 1,
    dayPayment: 0,
    dayReviews: [],
    bag: remaining,
    currentScoop: current,
    nextScoop: next,
    shopOfferings: [],
    customers,
    cursor: {
      bentoIndex: 0,
      position: { row: 0, col: 0 },
    },
    rotation: 0,
    turn: 0,
    customersServed: 0,
    patienceExpired: 0,
    phase: 'playing',
    lastServedEvent: null,
    // Keep perfectStreak across days as a reward for consistency
  }
}
