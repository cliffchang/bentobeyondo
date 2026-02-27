import { useEffect } from 'react'
import { GameState, GameAction } from '../../core/types'
import { getRotatedShape } from '../../core/polyomino'
import { calculateRating, getNextMilestone } from '../../core/game'
import { BentoBox } from './BentoBox'
import { ScoopPreview } from './ScoopPreview'
import { CustomerInfo } from './CustomerInfo'
import { GameStats } from './GameStats'
import { ShopScreen } from './ShopScreen'
import { BagSummary } from './BagSummary'

interface CounterProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
}

export function Counter({ state, dispatch, onRestart }: CounterProps) {
  // Clear served event after animation
  useEffect(() => {
    if (state.lastServedEvent) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SERVED_EVENT' })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.lastServedEvent, dispatch])

  // Clear wash event after animation
  useEffect(() => {
    if (state.washEvent) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_WASH_EVENT' })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.washEvent, dispatch])

  // Clear discard event after animation
  useEffect(() => {
    if (state.discardEvent) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_DISCARD_EVENT' })
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [state.discardEvent, dispatch])

  // Shopping phase
  if (state.phase === 'shopping') {
    return (
      <div className="counter shopping">
        <ShopScreen state={state} dispatch={dispatch} />
      </div>
    )
  }

  // Day end screen - show earnings and rating
  if (state.phase === 'day_end') {
    const todayAvg = state.dayReviews.length > 0
      ? state.dayReviews.reduce((a, b) => a + b, 0) / state.dayReviews.length
      : 0
    const newRating = calculateRating(state.rating, state.dayReviews)
    const milestone = getNextMilestone(state.day)
    const milestoneCheck = milestone && milestone.day === state.day
    const milestonePass = !milestoneCheck || newRating >= milestone.required

    return (
      <div className="counter day-end">
        <div className="day-end-screen">
          <h2>Day {state.day} Complete!</h2>

          <div className="day-summary">
            <div className="summary-row">
              <span>Customers Served</span>
              <span className="success">{state.customersServed}</span>
            </div>
            {state.patienceExpired > 0 && (
              <div className="summary-row">
                <span>Patience Expired</span>
                <span className="danger">{state.patienceExpired}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Today's Avg Review</span>
              <span className="stars">★ {todayAvg.toFixed(1)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Rating</span>
              <span className="stars">
                {state.rating !== null ? `★ ${state.rating.toFixed(1)}` : '—'}
                {' → '}
                ★ {newRating.toFixed(1)}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row">
              <span>Day's Earnings</span>
              <span className="success">+${state.dayPayment}</span>
            </div>
            {milestoneCheck && (
              <>
                <div className="summary-divider" />
                <div className="summary-row milestone">
                  <span>Milestone Check</span>
                  <span className={milestonePass ? 'success' : 'danger'}>
                    ★ {milestone.required.toFixed(1)} required — {milestonePass ? 'Passed!' : 'Failed!'}
                  </span>
                </div>
              </>
            )}
          </div>

          {milestonePass ? (
            <p className="continue-hint">Press Space or Enter to continue</p>
          ) : (
            <p className="continue-hint danger">Your parents are pulling the plug... Press Space or Enter to continue.</p>
          )}
        </div>
      </div>
    )
  }

  // Game over screen
  if (state.phase === 'game_over') {
    return (
      <div className="counter game-over">
        <div className="game-over-screen">
          <h2>Game Over</h2>
          <p className="game-over-reason">
            Your rating dropped to ★ {state.rating?.toFixed(1) ?? '?'}. Your parents shut down the restaurant.
          </p>

          <div className="final-stats">
            <div className="stat">
              <span className="stat-label">Days Survived</span>
              <span className="stat-value">{state.day}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Final Rating</span>
              <span className="stat-value stars">★ {state.rating?.toFixed(1) ?? '—'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Earned</span>
              <span className="stat-value">${state.totalMoney + state.dayPayment}</span>
            </div>
          </div>

          <p className="restart-hint">Press Space or Enter to play again</p>
          <button className="restart-button" onClick={onRestart}>
            Play Again
          </button>
        </div>
      </div>
    )
  }

  const currentShape = state.currentScoop
    ? getRotatedShape(state.currentScoop.shape, state.rotation)
    : null

  return (
    <div className="counter">
      <div className="counter-header">
        <h1>Bento Beyondo</h1>
        <GameStats
          day={state.day}
          dayPayment={state.dayPayment}
          totalMoney={state.totalMoney}
          perfectStreak={state.perfectStreak}
          rating={state.rating}
        />
      </div>

      <div className="counter-main">
        <div className="bentos-area">
          {state.customers.map((customer, index) => (
            <div key={customer.id} className="customer-station">
              <CustomerInfo
                customer={customer}
                isActive={state.cursor.bentoIndex === index}
              />
              <BentoBox
                bento={customer.bento}
                isActive={state.cursor.bentoIndex === index}
                cursorPosition={
                  state.cursor.bentoIndex === index
                    ? state.cursor.position
                    : null
                }
                ghostShape={
                  state.cursor.bentoIndex === index ? currentShape : null
                }
              />
              {state.lastServedEvent?.slotIndex === index && (
                <div className="served-animation">
                  <div className="served-text">
                    {state.lastServedEvent.patienceExpired && (
                      <span className="patience-expired">Too slow!</span>
                    )}
                    {state.lastServedEvent.isPerfect && (
                      <span className="perfect">
                        Perfecto!
                        {state.lastServedEvent.perfectStreak > 1 && (
                          <span className="streak"> x{state.lastServedEvent.perfectStreak}</span>
                        )}
                      </span>
                    )}
                    {state.lastServedEvent.isDelicioso && (
                      <span className="delicioso">
                        Delicioso!
                        <span className="matched-ingredients">
                          {state.lastServedEvent.matchedIngredients.map(i => i.emoji).join('')}
                        </span>
                      </span>
                    )}
                    <span className="review-stars">★ {state.lastServedEvent.reviewStars.toFixed(1)}</span>
                    <span className="payment">+${state.lastServedEvent.payment}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="scoops-area">
          <div className="scoop-current-wrapper">
            <ScoopPreview
              scoop={state.currentScoop}
              rotation={state.rotation}
              label="Current"
              showRotation={true}
            />
            {state.discardEvent && (
              <div className="discard-animation">Tossed!</div>
            )}
          </div>
          <ScoopPreview scoop={state.nextScoop} label="Next" />
          <BagSummary bag={state.bag} />
        </div>
      </div>

      <div className="controls-help">
        <span>Arrow keys: Move/Switch</span>
        <span>R: Rotate</span>
        {state.upgrades.purchasedUpgradeIds.includes('ambidextrous') && (
          <span>S: Swap</span>
        )}
        <span>Space/Enter: Place</span>
        <span>D: Discard</span>
      </div>

      {state.washEvent && (
        <div className="wash-overlay">
          <div className="wash-text">Washing your scoops...</div>
          <div className="wash-subtext">All customers lose 1 patience</div>
        </div>
      )}
    </div>
  )
}
