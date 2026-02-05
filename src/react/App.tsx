import { useGame } from './hooks/useGame'
import { Counter } from './components/Counter'

function App() {
  const { state, dispatch, restart } = useGame()

  return (
    <div className="app">
      <Counter state={state} dispatch={dispatch} onRestart={restart} />
    </div>
  )
}

export default App
