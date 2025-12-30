import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Squares from "./components/Squares";
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Squares 
          speed={0.5} 
          squareSize={60}
          direction='diagonal'
          borderColor='#262426ff'
          hoverFillColor='#413d3dff'
        />
      <div clas="center">
        <button>Hello</button>
      </div>

    </>
  )
}

export default App
