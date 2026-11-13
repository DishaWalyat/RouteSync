import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button.tsx'
import { FieldError, Label, TextInput } from '../../components/ui/Field.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { getErrorMessage } from '../../utils/errors.ts'

export function LoginPage() {
  const { signin } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await signin(email.trim(), password)
      navigate('/')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not sign in.')
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Welcome back!</h1>
        <p className="mt-2 text-sm text-muted">Sign in to access your coursework, notes, and timetable.</p>
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@institution.edu"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <TextInput
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" loading={loading}>
        Sign In
      </Button>
      <div className="flex items-center justify-between text-xs font-semibold pt-1">
        <Link to="/forgot-password" className="text-[#5B4BD8] hover:underline">
          Forgot password?
        </Link>
        <Link to="/signup" className="text-[#FF6433] hover:underline">
          Create an Account
        </Link>
      </div>
    </form>
  )
}
