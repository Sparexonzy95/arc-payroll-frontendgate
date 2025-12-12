import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import { App } from './App'
import { AppProviders } from './lib/wagmi'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
)
