interface GameStatsProps {
  customersServed: number
  customersAngry: number
  totalPayment: number
  isEndScreen?: boolean
  onRestart?: () => void
}

export function GameStats({
  customersServed,
  customersAngry,
  totalPayment,
  isEndScreen = false,
  onRestart,
}: GameStatsProps) {
  if (isEndScreen) {
    return (
      <div className="game-stats end-screen">
        <h2>Service Complete!</h2>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-label">Customers Served</span>
            <span className="stat-value success">{customersServed}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Customers Angry</span>
            <span className="stat-value danger">{customersAngry}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Payment</span>
            <span className="stat-value">${totalPayment}</span>
          </div>
        </div>
        <p className="restart-hint">Press Space or Enter to play again</p>
        {onRestart && (
          <button className="restart-button" onClick={onRestart}>
            Play Again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="game-stats inline">
      <span className="stat-item">
        Served: <strong>{customersServed}</strong>
      </span>
      <span className="stat-item">
        Angry: <strong className="danger">{customersAngry}</strong>
      </span>
      <span className="stat-item">
        Payment: <strong>${totalPayment}</strong>
      </span>
    </div>
  )
}
