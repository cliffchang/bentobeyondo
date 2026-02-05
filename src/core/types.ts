export type IngredientType = 'rice' | 'protein' | 'vegetable'

// Shape represented as 2D boolean grid (true = filled cell)
export type Shape = boolean[][]

export interface Scoop {
  id: string
  shape: Shape
  ingredient: IngredientType
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
}

export interface Position {
  row: number
  col: number
}

export type Rotation = 0 | 1 | 2 | 3  // 0°, 90°, 180°, 270°

export interface GameState {
  customers: Customer[]           // Active customers (2 for MVP)
  bag: Scoop[]                    // Remaining scoops
  currentScoop: Scoop | null
  nextScoop: Scoop | null
  cursor: { bentoIndex: number; position: Position }
  rotation: Rotation
  turn: number
  customersServed: number
  customersAngry: number
  totalPayment: number
  phase: 'playing' | 'ended'
}

export type GameAction =
  | { type: 'MOVE_CURSOR'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'ROTATE' }
  | { type: 'PLACE' }
  | { type: 'DISCARD' }
  | { type: 'RESTART' }
