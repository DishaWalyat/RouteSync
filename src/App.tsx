import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.tsx'
import { AppLayout } from './layouts/AppLayout.tsx'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx'
import { LoginPage } from './pages/auth/LoginPage.tsx'
import { SignupPage } from './pages/auth/SignupPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { ManufacturerPage } from './pages/ManufacturerPage.tsx'
import { DispatcherPage } from './pages/DispatcherPage.tsx'
import { WarehousePage } from './pages/WarehousePage.tsx'
import { RetailerPage } from './pages/RetailerPage.tsx'
import { ShipmentTrackingPage } from './pages/ShipmentTrackingPage.tsx'
import type { UserRole } from './types/supplyChain.ts'

function Protected({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: UserRole[]
}) {
  const { user, loading, configured, role } = useAuth()
  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <p className="py-24 text-center text-sm text-slate-400">Loading RouteSync Cloud…</p>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/manufacturer" replace />
  }
  return children
}

export function App() {
  return (
    <Routes>
      {/* Slide 1: Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Slide 2: Login Page */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated / Core 4 Supply Chain Slides (Wrapped in Dark Navy Sidebar Layout) */}
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        {/* Slide 3: Manufacturer Dashboard */}
        <Route path="manufacturer" element={<ManufacturerPage />} />

        {/* Slide 4: Dispatcher / Carrier Hub */}
        <Route path="dispatcher" element={<DispatcherPage />} />

        {/* Slide 5: Warehouse Hub */}
        <Route path="warehouse" element={<WarehousePage />} />

        {/* Slide 6: Retailer Orders & Billing */}
        <Route path="retailer" element={<RetailerPage />} />

        {/* Live Order Tracking */}
        <Route path="track" element={<ShipmentTrackingPage />} />
        <Route path="track/:id" element={<ShipmentTrackingPage />} />

        {/* Aliases for quick navigation */}
        <Route path="dashboard" element={<Navigate to="/manufacturer" replace />} />
        <Route path="products" element={<Navigate to="/manufacturer" replace />} />
        <Route path="shipments" element={<Navigate to="/dispatcher" replace />} />
        <Route path="inventory" element={<Navigate to="/warehouse" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
