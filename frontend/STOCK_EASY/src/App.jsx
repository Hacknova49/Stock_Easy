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
          squareSize={40}
          direction='diagonal'
          borderColor='#662a75ff'
          hoverFillColor='#413d3dff'
        />
      <div className='backgroundcolour' >
        <h1 className="text-6xl font-bold text-blue-500">
          hello
        </h1>
      </div>

    </>
  )
}

export default App
