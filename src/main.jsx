import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.refreshed.jsx'
import { bootstrapProgressSync, installProgressAutoSave } from './progressCloud.js'

async function start() {
  await bootstrapProgressSync()
  installProgressAutoSave()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

start()
