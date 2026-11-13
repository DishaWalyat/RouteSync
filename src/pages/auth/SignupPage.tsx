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
      setError('Enter your name.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid email.')
      return
    }
    if (password.length < 6) {
      setError('Use at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(email.trim(), password, displayName.trim())
      notify('Account created.')
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
        <h1 className="font-display text-3xl text-ink">Create your archive</h1>
        <p className="mt-2 text-sm text-muted">Your memories stay private to your account.</p>
      </div>
      <div>
        <Label htmlFor="name">Display name</Label>
        <TextInput id="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <TextInput id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <TextInput
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" loading={loading}>
        Create account
      </Button>
      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent">
          Sign in
        </Link>
      </p>
    </form>
  )
}
