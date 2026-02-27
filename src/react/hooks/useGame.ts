import { useReducer, useEffect, useCallback } from 'react'
import { GameState, GameAction } from '../../core/types'
import {
  createInitialState,
  moveCursor,
  rotateScoop,
  placeCurrentScoop,
  discardCurrentScoop,
  swapScoops,
  enterShop,
  buyUpgrade,
  startDay,
  clearServedEvent,
  clearWashEvent,
  clearDiscardEvent,
} from '../../core/game'

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE_CURSOR':
      return moveCursor(state, action.direction)
    case 'ROTATE':
      return rotateScoop(state)
    case 'PLACE':
      return placeCurrentScoop(state)
    case 'DISCARD':
      return discardCurrentScoop(state)
    case 'SWAP':
      return swapScoops(state)
    case 'ENTER_SHOP':
      return enterShop(state)
    case 'BUY_UPGRADE':
      return buyUpgrade(state, action.offeringId)
    case 'START_DAY':
      return startDay(state)
    case 'RESTART':
      return createInitialState()
    case 'CLEAR_SERVED_EVENT':
      return clearServedEvent(state)
    case 'CLEAR_WASH_EVENT':
      return clearWashEvent(state)
    case 'CLEAR_DISCARD_EVENT':
      return clearDiscardEvent(state)
    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Game over - restart
      if (state.phase === 'game_over') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatch({ type: 'RESTART' })
        }
        return
      }

      // Day end - proceed to shop
      if (state.phase === 'day_end') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatch({ type: 'ENTER_SHOP' })
        }
        return
      }

      // Shopping phase - buy with 1/2/3, start day with Space/Enter
      if (state.phase === 'shopping') {
        if (event.key === '1' && state.shopOfferings.length >= 1) {
          dispatch({ type: 'BUY_UPGRADE', offeringId: state.shopOfferings[0].id })
        } else if (event.key === '2' && state.shopOfferings.length >= 2) {
          dispatch({ type: 'BUY_UPGRADE', offeringId: state.shopOfferings[1].id })
        } else if (event.key === '3' && state.shopOfferings.length >= 3) {
          dispatch({ type: 'BUY_UPGRADE', offeringId: state.shopOfferings[2].id })
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatch({ type: 'START_DAY' })
        }
        return
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          dispatch({ type: 'MOVE_CURSOR', direction: 'up' })
          break
        case 'ArrowDown':
          event.preventDefault()
          dispatch({ type: 'MOVE_CURSOR', direction: 'down' })
          break
        case 'ArrowLeft':
          event.preventDefault()
          dispatch({ type: 'MOVE_CURSOR', direction: 'left' })
          break
        case 'ArrowRight':
          event.preventDefault()
          dispatch({ type: 'MOVE_CURSOR', direction: 'right' })
          break
        case 'r':
        case 'R':
          dispatch({ type: 'ROTATE' })
          break
        case 's':
        case 'S':
          dispatch({ type: 'SWAP' })
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          dispatch({ type: 'PLACE' })
          break
        case 'd':
        case 'D':
        case 'Tab':
          event.preventDefault()
          dispatch({ type: 'DISCARD' })
          break
      }
    },
    [state.phase, state.shopOfferings]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  return { state, dispatch, restart }
}
