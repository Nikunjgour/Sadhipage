// Ye application ka main entry point hai jo React root ko DOM element me mount karta hai
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Root element me ShaadiPage App ko render karte hain
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
