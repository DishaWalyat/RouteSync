import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Brand } from '../../components/Brand.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { getErrorMessage } from '../../utils/errors.ts'

export function LoginPage() {
  const { signin } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signin(email.trim(), password)
      notify('Signed in successfully! Welcome to RouteSync.', 'success')
      navigate('/manufacturer')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EDF3FA] p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
        {/* Left Half: Supply Chain Trucks Image & Blue Gradient Overlay */}
        <div className="relative hidden md:flex flex-col justify-between p-10 text-white overflow-hidden bg-slate-900">
          {/* Background image */}
          <img
            src="/warehouse-trucks.jpg"
            alt="Logistics Fleet & Warehouse Depot"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F1E4A]/95 via-[#1E40AF]/85 to-[#2563EB]/70 mix-blend-multiply" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Brand theme="dark" />
          </div>

          {/* Center Title */}
          <div className="relative z-10 max-w-sm">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Supply Chain <br />
              Management System
            </h2>
            <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
              Real-time consignment traceability, multi-node custody verification, and automated billing.
            </p>
          </div>

          {/* Bottom metadata */}
          <div className="relative z-10 text-xs text-blue-200/70 font-medium">
            RouteSync Enterprise Cloud Platform v2.0
          </div>
        </div>

        {/* Right Half: Sign In Form */}
        <div className="relative flex flex-col justify-center px-8 sm:px-12 py-10 bg-white">
          {/* Subtle curved background graphic in top right */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/60 rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50/40 rounded-tr-full pointer-events-none" />

          <div className="relative z-10 max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="md:hidden mb-4">
                <Brand theme="light" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Welcome to RouteSync
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                Sign in to manage your supply chain
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input with Mail Icon */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Password Input with Lock & Eye Icon */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-11 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#2563EB] py-3 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-60 active:scale-[0.99] mt-2"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-[#2563EB] hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
