import { useGame } from './hooks/useGame'
import { Counter } from './components/Counter'

function App() {
  const { state, restart } = useGame()

  return (
    <div className="app">
      <Counter state={state} onRestart={restart} />
    </div>
  )
}

export default App
