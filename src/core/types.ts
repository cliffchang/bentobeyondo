// Premium ingredients provide bonuses when matching customer preferences
export interface PremiumIngredient {
  id: string
  name: string
  bonusPercent: number  // 10-50% based on rarity
  emoji: string
}

// Shape represented as 2D boolean grid (true = filled cell)
export type Shape = boolean[][]

export interface Scoop {
  id: string
  shape: Shape
  shapeName: string  // Which tetromino (e.g., 'I', 'T', 'L')
  ingredient: PremiumIngredient | null  // null = plain scoop
}

// Upgrade state for non-scoop upgrades
export interface UpgradeState {
  decor: string[]  // IDs of purchased decor items (each = +1 patience)
  purchasedUpgradeIds: string[]  // All purchased kitchen upgrade IDs
}

// Shop offerings (discriminated union)
export type ShopOffering =
  | {
      type: 'scoop'
      id: string
      name: string
      cost: number
      emoji: string
      shape: Shape
      shapeName: string
      ingredient: PremiumIngredient | null
    }
  | {
      type: 'kitchen'
      id: string
      name: string
      description: string
      cost: number
      emoji: string
    }

export type CellState = 'empty' | 'filled' | 'blocked'

export class BentoGrid {
  cells: CellState[][]
  width: number
  height: number
  size: number  // count of non-blocked cells

  constructor(cells: CellState[][]) {
    this.cells = cells
    this.height = cells.length
    this.width = cells[0]?.length ?? 0
    this.size = cells.flat().filter(c => c !== 'blocked').length
  }
}

export interface Customer {
  id: string
  name: string
  patience: number
  maxPatience: number
  bento: BentoGrid
  scoopsUsed: number
  preferences: PremiumIngredient[]  // 0-3 requested ingredients
  ingredientsReceived: PremiumIngredient[]  // Track what they've been given
}

export interface Position {
  row: number
  col: number
}

export type Rotation = 0 | 1 | 2 | 3  // 0°, 90°, 180°, 270°

export interface ServedEvent {
  slotIndex: number
  payment: number
  isPerfect: boolean
  perfectStreak: number  // Streak count at time of serve (for displaying bonus)
  isDelicioso: boolean   // True if any preferences matched
  matchedIngredients: PremiumIngredient[]  // Which preferences were satisfied
  reviewStars: number    // 1.0-5.0 star review from this customer
  patienceExpired: boolean  // True if customer ran out of patience (auto-served)
}

export interface GameState {
  // Day/run progression
  day: number                     // Current day (1-indexed)
  dayPayment: number              // Payment earned this day (upgrade currency)
  totalMoney: number              // Money accumulated across days (upgrade currency)

  // Reputation
  rating: number | null           // Current star rating (1.0-5.0), null = unrated
  dayReviews: number[]            // Star values collected this day

  // Deck & bag
  deck: Scoop[]                   // Master list of all owned scoops (persistent)
  bag: Scoop[]                    // Remaining scoops this cycle
  currentScoop: Scoop | null
  nextScoop: Scoop | null
  nextDeckId: number              // Counter for unique scoop IDs

  // Upgrades & shop
  upgrades: UpgradeState          // Non-scoop upgrades (decor)
  shopOfferings: ShopOffering[]   // 3 items available this shopping phase

  // Active gameplay
  customers: Customer[]           // Active customers
  cursor: { bentoIndex: number; position: Position }
  rotation: Rotation
  turn: number
  customersServed: number         // Served this day (bento full)
  patienceExpired: number         // Patience expired this day (auto-served)
  phase: 'playing' | 'day_end' | 'shopping' | 'game_over'
  lastServedEvent: ServedEvent | null
  washEvent: boolean              // True when deck just reshuffled (wash animation)
  discardEvent: boolean           // True when a scoop was just discarded
  perfectStreak: number           // Current consecutive perfect serves
  maxPerfectBonusPercent: number  // Max streak bonus (default 30%, upgradeable)
}

export type GameAction =
  | { type: 'MOVE_CURSOR'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'ROTATE' }
  | { type: 'PLACE' }
  | { type: 'DISCARD' }
  | { type: 'SWAP' }
  | { type: 'ENTER_SHOP' }
  | { type: 'BUY_UPGRADE'; offeringId: string }
  | { type: 'START_DAY' }
  | { type: 'RESTART' }
  | { type: 'CLEAR_SERVED_EVENT' }
  | { type: 'CLEAR_WASH_EVENT' }
  | { type: 'CLEAR_DISCARD_EVENT' }
