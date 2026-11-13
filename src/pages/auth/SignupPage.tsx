import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button.tsx'
import { FieldError, Label, TextInput } from '../../components/ui/Field.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { getErrorMessage } from '../../utils/errors.ts'

export function SignupPage() {
  const { signup } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (displayName.trim().length < 2) {
      setError('Enter your full name.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid institutional email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(email.trim(), password, displayName.trim())
      notify('Account created successfully.')
      navigate('/')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not create your account.')
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Create Account</h1>
        <p className="mt-2 text-sm text-muted">Join LifeLog to organize your academic coursework in the cloud.</p>
      </div>
      <div>
        <Label htmlFor="name">Full Name</Label>
        <TextInput
          id="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="e.g. Alyssa Jones"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alyssa@institution.edu"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password (min. 6 characters)</Label>
        <TextInput
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" loading={loading}>
        Create Free Account
      </Button>
      <p className="text-center text-xs font-medium text-muted pt-1">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-[#FF6433] hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
