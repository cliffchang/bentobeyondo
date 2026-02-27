import { Scoop } from '../../core/types'
import { TETROMINOES } from '../../data/shapes'

interface BagSummaryProps {
  bag: Scoop[]
}

/**
 * Group bag scoops by shapeName + ingredient for display.
 * Shows mini tetromino icons with counts, not in bag order.
 */
export function BagSummary({ bag }: BagSummaryProps) {
  // Group by shapeName + ingredient id
  const groups = new Map<string, { shapeName: string; emoji: string | null; count: number }>()

  for (const scoop of bag) {
    const key = `${scoop.shapeName}:${scoop.ingredient?.id ?? 'plain'}`
    const existing = groups.get(key)
    if (existing) {
      existing.count++
    } else {
      groups.set(key, {
        shapeName: scoop.shapeName,
        emoji: scoop.ingredient?.emoji ?? null,
        count: 1,
      })
    }
  }

  // Sort: by shape name, then plain before ingredient
  const sorted = [...groups.values()].sort((a, b) => {
    if (a.shapeName !== b.shapeName) return a.shapeName.localeCompare(b.shapeName)
    if (!a.emoji && b.emoji) return -1
    if (a.emoji && !b.emoji) return 1
    return 0
  })

  return (
    <div className="bag-summary">
      <div className="scoop-label">Bag ({bag.length})</div>
      <div className="bag-pieces">
        {sorted.map(({ shapeName, emoji, count }) => (
          <BagPiece key={`${shapeName}:${emoji ?? 'plain'}`} shapeName={shapeName} emoji={emoji} count={count} />
        ))}
        {bag.length === 0 && <span className="bag-empty">Empty</span>}
      </div>
    </div>
  )
}

function BagPiece({ shapeName, emoji, count }: { shapeName: string; emoji: string | null; count: number }) {
  const shape = TETROMINOES[shapeName]
  if (!shape) return null

  return (
    <div className="bag-piece">
      <div className="bag-piece-shape">
        {shape.map((row, r) => (
          <div key={r} className="bag-piece-row">
            {row.map((cell, c) => (
              <div key={c} className={`bag-piece-cell ${cell ? 'filled' : 'empty'}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="bag-piece-info">
        {emoji && <span className="bag-piece-emoji">{emoji}</span>}
        {count > 1 && <span className="bag-piece-count">×{count}</span>}
      </div>
    </div>
  )
}
