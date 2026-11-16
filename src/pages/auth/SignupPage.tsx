import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button.tsx'
import { FieldError, Label, TextInput } from '../../components/ui/Field.tsx'
import { useAuth } from '../../context/AuthContext.tsx'
import { useToast } from '../../context/ToastContext.tsx'
import { type UserRole } from '../../types/supplyChain.ts'
import { getErrorMessage } from '../../utils/errors.ts'

export function SignupPage() {
  const { signup } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [role, setRole] = useState<UserRole>('transporter')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (displayName.trim().length < 2) {
      setError('Enter your representative name.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid corporate email.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await signup(
        email.trim(),
        password,
        displayName.trim(),
        role,
        organizationName.trim() || 'Logistics Partner',
      )
      notify('Account registered successfully.')
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Register Partner</h1>
        <p className="mt-1 text-sm text-muted">Join RouteSync to connect to the decentralized supply chain network.</p>
      </div>

      <div>
        <Label htmlFor="name">Representative Name</Label>
        <TextInput
          id="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="e.g. Robert Fox"
          required
        />
      </div>

      <div>
        <Label htmlFor="org">Organization / Company Name</Label>
        <TextInput
          id="org"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          placeholder="e.g. Apex Freight Global"
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Supply Chain Node Role</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-2xl border border-line bg-paper px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-accent focus:bg-white focus:outline-none"
        >
          <option value="manufacturer">1. Manufacturer (Production Catalog & Dispatch)</option>
          <option value="transporter">2. Dispatcher / Carrier (Transport to Warehouse)</option>
          <option value="warehouse_manager">3. Warehouse Manager (Inbound Receipt & Retailer Matrix)</option>
          <option value="retailer">4. Retailer (Store Receiver & Billing)</option>
        </select>
        <p className="mt-1 text-[11px] text-muted">
          Note: Root Administrator privilege requires server-side cloud claims or administrative invitation.
        </p>
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="operations@logistics.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <TextInput
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          required
        />
      </div>

      <FieldError message={error} />
      <Button type="submit" variant="primary" loading={loading} className="w-full">
        Register RouteSync Account
      </Button>
      <p className="text-center text-xs text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-accent hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
