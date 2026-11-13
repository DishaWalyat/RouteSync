import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Brand } from '../components/Brand.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <p className="py-24 text-center text-sm font-medium text-muted">Loading LifeLog…</p>
  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF3EC] via-[#FAF7F2] to-[#F1EDFC] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand to="/login" />
        </div>
        <div className="rounded-3xl border border-line bg-white/95 p-7 sm:p-9 shadow-lg backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
