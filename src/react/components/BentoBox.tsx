import { BentoGrid, Shape, Position } from '../../core/types'
import { getPlacementCells } from '../../core/placement'

interface BentoBoxProps {
  bento: BentoGrid
  isActive: boolean
  cursorPosition: Position | null
  ghostShape: Shape | null
}

export function BentoBox({
  bento,
  isActive,
  cursorPosition,
  ghostShape,
}: BentoBoxProps) {
  // Calculate ghost cells for preview
  const ghostCells =
    isActive && ghostShape && cursorPosition
      ? getPlacementCells(bento, ghostShape, cursorPosition)
      : []

  // Create a map of ghost positions for quick lookup
  const ghostMap = new Map<string, { valid: boolean; wasted: boolean }>()
  for (const cell of ghostCells) {
    ghostMap.set(`${cell.row},${cell.col}`, {
      valid: cell.valid,
      wasted: cell.wasted,
    })
  }

  return (
    <div className={`bento-box ${isActive ? 'active' : ''}`}>
      <div
        className="bento-grid"
        style={{
          gridTemplateColumns: `repeat(${bento.width}, 1fr)`,
          gridTemplateRows: `repeat(${bento.height}, 1fr)`,
        }}
      >
        {bento.cells.map((row, r) =>
          row.map((cell, c) => {
            const ghost = ghostMap.get(`${r},${c}`)
            const isGhost = ghost !== undefined
            const isWasted = ghost?.wasted ?? false

            return (
              <div
                key={`${r}-${c}`}
                className={`bento-cell ${cell} ${isGhost ? 'ghost' : ''} ${isWasted ? 'wasted' : ''}`}
              />
            )
          })
        )}
      </div>

      {/* Render ghost cells outside the grid */}
      {ghostCells
        .filter(cell => !cell.valid)
        .map((cell, i) => (
          <div
            key={`outside-${i}`}
            className="ghost-cell-outside wasted"
            style={{
              left: `calc(${cell.col} * (var(--cell-size) + 2px))`,
              top: `calc(${cell.row} * (var(--cell-size) + 2px))`,
            }}
          />
        ))}
    </div>
  )
}
