import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button.tsx'
import { FieldError, Label, TextInput } from '../../components/ui/Field.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { getErrorMessage } from '../../utils/errors.ts'

export function ForgotPasswordPage() {
  const { sendReset } = useAuth()
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!email.includes('@')) {
      setError('Enter the email for your account.')
      return
    }
    setLoading(true)
    try {
      await sendReset(email.trim())
      notify('Password reset email sent.')
      setEmail('')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not send the reset email.')
      setError(message)
      notify(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-muted">We’ll email you a link to choose a new password.</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <TextInput id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" loading={loading}>
        Send reset link
      </Button>
      <Link to="/login" className="block text-sm text-accent">
        Back to sign in
      </Link>
    </form>
  )
}
