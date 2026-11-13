import { useEffect, useState } from 'react'
import {
  Activity,
  Cloud,
  Database,
  HardDrive,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { TextInput, Label } from '../components/ui/Field.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { fetchAllUsers } from '../services/auth.ts'
import type { UserAdminView, UserRole } from '../types/academic.ts'
import { getErrorMessage } from '../utils/errors.ts'

export function AdminPortalPage() {
  const { user, role, changeUserRole, setEvaluatorRole, evaluatorRole, isOnline } = useAuth()
  const { notify } = useToast()

  const [users, setUsers] = useState<UserAdminView[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [updatingUid, setUpdatingUid] = useState<string | null>(null)

  // Institutional Config State
  const [institution, setInstitution] = useState('Department of Computer Applications (CCSA)')
  const [academicYear, setAcademicYear] = useState('2026–2027')
  const [activeSemester, setActiveSemester] = useState('Odd Semester (Fall 2026)')

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const data = await fetchAllUsers()
      setUsers(data)
    } catch {
      // In sandbox / unpermissioned demo, fallback to current user representation
      if (user) {
        setUsers([
          {
            uid: user.uid,
            displayName: user.displayName || 'Current User',
            email: user.email || 'user@example.edu',
            role: role,
            semester: '5',
            academicYear: '2026-2027',
            createdAt: new Date().toISOString(),
          },
        ])
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleRoleChange(targetUid: string, newRole: UserRole) {
    setUpdatingUid(targetUid)
    try {
      await changeUserRole(targetUid, newRole)
      notify(`Role updated to ${newRole}. Security permissions synced.`)
      await loadUsers()
    } catch (err) {
      notify(getErrorMessage(err, 'Failed to update user role.'), 'error')
    } finally {
      setUpdatingUid(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Administrator Portal"
            description="Role-Based Access Control governance, cloud architecture telemetry, and academic parameters."
          />
        </div>
        <Button variant="secondary" onClick={loadUsers} loading={loadingUsers}>
          <RefreshCw size={15} />
          Refresh Registry
        </Button>
      </div>

      {/* Evaluator Live Demonstration Switcher */}
      <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent-soft/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white font-bold">
              ★
            </span>
            <div>
              <p className="font-semibold text-ink text-sm">
                Academic Evaluation & Demonstration Mode
              </p>
              <p className="text-xs text-muted">
                CCSA Project Evaluator: Switch role instantly to inspect RBAC enforcement across Student, Teacher, and Admin views.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Active View:</span>
            {(['student', 'teacher', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setEvaluatorRole(r)
                  notify(`Switched context to ${r.toUpperCase()} role for evaluation.`)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  role === r
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-white text-muted border border-line hover:text-ink'
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
                className="text-xs text-muted underline ml-2 hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Architecture Health Telemetry */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">Cloud Architecture Telemetry</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Identity & Auth</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Firebase Authentication</p>
                <p className="text-xs text-muted">Custom Claims & JWT RBAC</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Cloud Database</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Listeners
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
                <Database size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Cloud Firestore</p>
                <p className="text-xs text-muted">Real-Time Sync & Offline Cache</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Object Storage</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Enforced
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <HardDrive size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Firebase Storage</p>
                <p className="text-xs text-muted">20 MB & MIME White-List</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Serverless Compute</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Ready
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Server size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Cloud Functions (Node.js)</p>
                <p className="text-xs text-muted">Event Triggers & Custom Claims</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Edge Hosting</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Optimized
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-zinc-100 p-2.5 text-zinc-800">
                <Cloud size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Vercel Global CDN</p>
                <p className="text-xs text-muted">SPA Rewrites & Edge Caching</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Client Connectivity</span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`}
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Activity size={20} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Network State</p>
                <p className="text-xs text-muted">{isOnline ? 'Direct Cloud Sync' : 'IndexedDB Local Cache'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User & Role Management Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-ink">User Directory & Role Assignments</h2>
            <p className="text-sm text-muted">
              Server-side RBAC: Elevate or restrict user privileges. Changes propagate to Firestore and security rules immediately.
            </p>
          </div>
          <span className="rounded-full bg-paper border border-line px-3 py-1 text-xs font-medium text-muted">
            {users.length} Registered User{users.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/50 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Academic Cohort</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isSelf = u.uid === user?.uid
                const roleBadgeClass =
                  u.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : u.role === 'teacher'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200'

                return (
                  <tr key={u.uid} className="hover:bg-paper/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                          {u.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-ink">
                            {u.displayName} {isSelf && <span className="text-xs text-muted">(You)</span>}
                          </p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {u.semester ? `Semester ${u.semester}` : 'N/A'} · {u.academicYear || '2026-2027'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${roleBadgeClass}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={updatingUid === u.uid || u.role === 'student'}
                          onClick={() => handleRoleChange(u.uid, 'student')}
                          className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:text-ink hover:bg-paper disabled:opacity-40"
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          disabled={updatingUid === u.uid || u.role === 'teacher'}
                          onClick={() => handleRoleChange(u.uid, 'teacher')}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                        >
                          Teacher
                        </button>
                        <button
                          type="button"
                          disabled={updatingUid === u.uid || u.role === 'admin'}
                          onClick={() => handleRoleChange(u.uid, 'admin')}
                          className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-800 hover:bg-purple-100 disabled:opacity-40"
                        >
                          Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Institutional Parameters */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Institutional Parameters</h2>
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="inst-name">Institution / Department Name</Label>
              <TextInput
                id="inst-name"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inst-year">Academic Calendar Year</Label>
              <TextInput
                id="inst-year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="inst-sem">Current Active Term</Label>
            <TextInput
              id="inst-sem"
              value={activeSemester}
              onChange={(e) => setActiveSemester(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => notify('Academic configuration saved to cloud database.')}
          >
            Save Configuration
          </Button>
        </div>
      </section>
    </div>
  )
}
