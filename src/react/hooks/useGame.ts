import { useReducer, useEffect, useCallback } from 'react'
import { GameState, GameAction } from '../../core/types'
import {
  createInitialState,
  moveCursor,
  rotateScoop,
  placeCurrentScoop,
  discardCurrentScoop,
  clearServedEvent,
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
    case 'RESTART':
      return createInitialState()
    case 'CLEAR_SERVED_EVENT':
      return clearServedEvent(state)
    default:
      return state
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (state.phase === 'ended') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          dispatch({ type: 'RESTART' })
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
        case ' ':
        case 'Enter':
          event.preventDefault()
          dispatch({ type: 'PLACE' })
          break
        case 'Tab':
          event.preventDefault()
          dispatch({ type: 'DISCARD' })
          break
      }
    },
    [state.phase]
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
