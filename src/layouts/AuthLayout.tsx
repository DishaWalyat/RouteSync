import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Brand } from '../components/Brand.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <p className="py-24 text-center text-sm text-muted">Loading…</p>
  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Brand to="/login" />
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </div>
  )
}
