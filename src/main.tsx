import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { seedIfEmpty } from './db'
import { useAppStore } from './store'

async function boot() {
  await seedIfEmpty()
  await useAppStore.getState().loadFromDB()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

boot()
