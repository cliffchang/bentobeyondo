interface GameStatsProps {
  day: number
  dayPayment: number
  totalMoney: number
  perfectStreak: number
  rating: number | null
}

export function GameStats({
  day,
  dayPayment,
  totalMoney,
  perfectStreak,
  rating,
}: GameStatsProps) {
  return (
    <div className="game-stats inline">
      <span className="stat-item">
        Day: <strong>{day}</strong>
      </span>
      <span className="stat-item">
        Today: <strong className="success">${dayPayment}</strong>
      </span>
      <span className="stat-item">
        Savings: <strong>${totalMoney}</strong>
      </span>
      <span className="stat-item rating">
        <strong className="stars">{rating !== null ? `★ ${rating.toFixed(1)}` : '★ —'}</strong>
      </span>
      {perfectStreak > 0 && (
        <span className="stat-item streak">
          Streak: <strong>{perfectStreak}</strong>
        </span>
      )}
    </div>
  )
}
