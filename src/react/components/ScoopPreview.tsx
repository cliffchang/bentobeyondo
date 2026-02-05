import { Scoop, Rotation } from '../../core/types'
import { getRotatedShape } from '../../core/polyomino'

interface ScoopPreviewProps {
  scoop: Scoop | null
  rotation?: Rotation
  label: string
  showRotation?: boolean
}

export function ScoopPreview({
  scoop,
  rotation = 0,
  label,
  showRotation = false,
}: ScoopPreviewProps) {
  if (!scoop) {
    return (
      <div className="scoop-preview">
        <div className="scoop-label">{label}</div>
        <div className="scoop-empty">Empty</div>
      </div>
    )
  }

  const shape = showRotation
    ? getRotatedShape(scoop.shape, rotation)
    : scoop.shape

  return (
    <div className="scoop-preview">
      <div className="scoop-label">{label}</div>
      <div className={`scoop-shape ingredient-${scoop.ingredient}`}>
        {shape.map((row, r) => (
          <div key={r} className="scoop-row">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`scoop-cell ${cell ? 'filled' : 'empty'}`}
              />
            ))}
          </div>
        ))}
      </div>
      {showRotation && (
        <div className="rotation-indicator">
          R: {rotation * 90}°
        </div>
      )}
    </div>
  )
}
