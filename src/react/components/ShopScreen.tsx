import { GameState, GameAction, ShopOffering } from '../../core/types'

interface ShopScreenProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

function ScoopMiniPreview({ offering }: { offering: ShopOffering & { type: 'scoop' } }) {
  return (
    <div className="shop-scoop-preview">
      {offering.shape.map((row, ri) => (
        <div key={ri} className="scoop-row">
          {row.map((cell, ci) => (
            <div
              key={ci}
              className={`scoop-cell ${cell ? 'filled' : 'empty'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function ShopItem({
  offering,
  index,
  canAfford,
  onBuy,
}: {
  offering: ShopOffering
  index: number
  canAfford: boolean
  onBuy: () => void
}) {
  return (
    <div className={`shop-item ${!canAfford ? 'unaffordable' : ''}`}>
      <div className="shop-item-header">
        <span className="shop-item-key">[{index + 1}]</span>
        <span className="shop-item-emoji">{offering.emoji}</span>
      </div>
      <div className="shop-item-name">{offering.name}</div>
      {offering.type === 'scoop' && (
        <>
          <ScoopMiniPreview offering={offering} />
          <div className="shop-item-desc">
            {offering.ingredient
              ? `${offering.ingredient.name} +${offering.ingredient.bonusPercent}%`
              : 'Plain scoop'}
          </div>
        </>
      )}
      {offering.type === 'kitchen' && (
        <div className="shop-item-desc">{offering.description}</div>
      )}
      <button
        className="shop-buy-button"
        disabled={!canAfford}
        onClick={onBuy}
      >
        ${offering.cost}
      </button>
    </div>
  )
}

export function ShopScreen({ state, dispatch }: ShopScreenProps) {
  return (
    <div className="shop-screen">
      <h2>Upgrade Shop</h2>
      <div className="shop-budget">
        Budget: <span className="success">${state.totalMoney}</span>
      </div>

      <div className="shop-items">
        {state.shopOfferings.map((offering, index) => (
          <ShopItem
            key={offering.id}
            offering={offering}
            index={index}
            canAfford={state.totalMoney >= offering.cost}
            onBuy={() => dispatch({ type: 'BUY_UPGRADE', offeringId: offering.id })}
          />
        ))}
        {state.shopOfferings.length === 0 && (
          <div className="shop-empty">Sold out!</div>
        )}
      </div>

      <div className="shop-deck-info">
        Deck: {state.deck.length} scoops
        {state.upgrades.decor.length > 0 && (
          <> | Decor: +{state.upgrades.decor.length} patience</>
        )}
      </div>

      <button
        className="shop-start-button"
        onClick={() => dispatch({ type: 'START_DAY' })}
      >
        Start Day {state.day + 1}
      </button>
      <p className="continue-hint">Press Space or Enter to start</p>
    </div>
  )
}
