import { GameState } from '../../core/types'
import { getRotatedShape } from '../../core/polyomino'
import { BentoBox } from './BentoBox'
import { ScoopPreview } from './ScoopPreview'
import { CustomerInfo } from './CustomerInfo'
import { GameStats } from './GameStats'

interface CounterProps {
  state: GameState
  onRestart: () => void
}

export function Counter({ state, onRestart }: CounterProps) {
  if (state.phase === 'ended') {
    return (
      <div className="counter ended">
        <GameStats
          customersServed={state.customersServed}
          customersAngry={state.customersAngry}
          totalPayment={state.totalPayment}
          isEndScreen={true}
          onRestart={onRestart}
        />
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
          customersServed={state.customersServed}
          customersAngry={state.customersAngry}
          totalPayment={state.totalPayment}
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
            </div>
          ))}
        </div>

        <div className="scoops-area">
          <ScoopPreview
            scoop={state.currentScoop}
            rotation={state.rotation}
            label="Current"
            showRotation={true}
          />
          <ScoopPreview scoop={state.nextScoop} label="Next" />
        </div>
      </div>

      <div className="controls-help">
        <span>Arrow keys: Move</span>
        <span>R: Rotate</span>
        <span>Space/Enter: Place</span>
        <span>Tab: Discard</span>
        <span>Q: Switch bento</span>
      </div>
    </div>
  )
}
