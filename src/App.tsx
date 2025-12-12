// src/App.tsx
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { PayrollsPage } from './pages/PayrollsPage'
import { PayrollDetailPage } from './pages/PayrollDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Toaster } from 'react-hot-toast'
import { LandingPage } from './pages/LandingPage'

function AppShell() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          {/* Marketing landing */}
          <Route path="/" element={<LandingPage />} />

          {/* App routes with navbar */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/payrolls" element={<PayrollsPage />} />
            <Route path="/payrolls/new" element={<PayrollsPage />} />
            <Route path="/payrolls/:id" element={<PayrollDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#020617',
              color: '#e5e7eb',
              border: '1px solid #1f2937',
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
