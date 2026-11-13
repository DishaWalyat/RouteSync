import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { FieldError, Label, TextInput } from '../components/ui/Field.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { getErrorMessage } from '../utils/errors.ts'

export function SettingsPage() {
  const { user, profile, role, saveProfile, signout, setEvaluatorRole, evaluatorRole } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [semester, setSemester] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const email = profile?.email || user?.email || ''

  useEffect(() => {
    setDisplayName(profile?.displayName || user?.displayName || '')
    setSemester(profile?.semester || '')
    setAcademicYear(profile?.academicYear || '')
  }, [profile, user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (displayName.trim().length < 2) {
      setError('Enter your name.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveProfile({
        displayName: displayName.trim(),
        semester: semester.trim(),
        academicYear: academicYear.trim(),
      })
      notify('Profile updated.')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not update your profile.')
      setError(message)
      notify(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : role === 'teacher'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Account Settings" description="Your academic identity and cloud access configuration." />

      {/* Role & Cloud Security Card */}
      <div className="rounded-2xl border border-line bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <h3 className="font-semibold text-sm text-ink">Role-Based Access Control (RBAC)</h3>
          </div>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${roleBadgeStyle}`}>
            {role}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Your permissions are authenticated through Firebase Auth and verified by Firestore server-side security rules.
          Client-side role tampering is blocked.
        </p>

        {/* Academic Evaluator Mode Switcher */}
        <div className="pt-2 border-t border-line">
          <p className="text-xs font-medium text-ink mb-1.5">Academic Viva / Evaluator Role Testing:</p>
          <div className="flex items-center gap-2">
            {(['student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setEvaluatorRole(r)
                  notify(`Active role switched to ${r.toUpperCase()} for testing.`)
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize border transition ${
                  role === r
                    ? 'bg-accent text-white border-accent'
                    : 'bg-paper text-muted border-line hover:text-ink'
                }`}
              >
                {r}
              </button>
            ))}
            {evaluatorRole && (
              <button
                type="button"
                onClick={() => {
                  setEvaluatorRole(null)
                  notify('Reset to persistent account role.')
                }}
                className="text-xs text-muted underline ml-1 hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-line bg-white p-6">
        <div>
          <Label htmlFor="name">Display name</Label>
          <TextInput id="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <TextInput id="email" value={email} readOnly />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="semester">Semester</Label>
            <TextInput
              id="semester"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              placeholder="5"
            />
          </div>
          <div>
            <Label htmlFor="year">Academic year</Label>
            <TextInput
              id="year"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              placeholder="2026–27"
            />
          </div>
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={saving}>
          Save profile
        </Button>
      </form>

      <Button
        variant="secondary"
        className="w-full"
        onClick={async () => {
          await signout()
          navigate('/login')
        }}
      >
        Log out
      </Button>
    </div>
  )
}
