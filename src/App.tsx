// src/App.tsx
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { DashboardPage } from './pages/DashboardPage'
import { PayrollsPage } from './pages/PayrollsPage'
import { PayrollDetailPage } from './pages/PayrollDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Toaster } from 'react-hot-toast'
import { LandingPage } from './pages/LandingPage'

// NEW: escrow routes
import { EscrowTool } from './features/escrow/EscrowTool'
import { EscrowRoomPage } from './features/escrow/EscrowRoomPage'

function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/payrolls" element={<PayrollsPage />} />
            <Route path="/payrolls/new" element={<PayrollsPage />} />
            <Route path="/payrolls/:id" element={<PayrollDetailPage />} />

            {/* Escrow */}
            <Route path="/escrow" element={<EscrowTool />} />
            <Route path="/escrow/room/:escrowId" element={<EscrowRoomPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0b1b64ff',
              color: '#e5e7eb',
              border: '1px solid #1f2937',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
