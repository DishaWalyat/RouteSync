import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured } from '../services/firebase.ts'
import {
  ensureUserProfile,
  fetchProfile,
  fetchTokenClaimRole,
  login,
  logout,
  register,
  resetPassword,
  updateAcademicProfile,
  updateUserRole,
  watchAuth,
} from '../services/auth.ts'
import type { UserProfile, UserRole } from '../types/academic.ts'

type AuthContextValue = {
  configured: boolean
  user: User | null
  profile: UserProfile | null
  role: UserRole
  isAdmin: boolean
  isTeacher: boolean
  isStudent: boolean
  isOnline: boolean
  loading: boolean
  signup: (email: string, password: string, displayName: string) => Promise<void>
  signin: (email: string, password: string) => Promise<void>
  signout: () => Promise<void>
  sendReset: (email: string) => Promise<void>
  saveProfile: (input: { displayName: string; semester: string; academicYear: string }) => Promise<void>
  changeUserRole: (targetUid: string, newRole: UserRole) => Promise<void>
  setEvaluatorRole: (overrideRole: UserRole | null) => void
  evaluatorRole: UserRole | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [claimRole, setClaimRole] = useState<UserRole | null>(null)
  const [evaluatorRole, setEvaluatorRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(firebaseConfigured)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const refreshProfile = async (nextUser = user) => {
    if (!nextUser) {
      setProfile(null)
      setClaimRole(null)
      return
    }
    const [nextProfile, nextClaim] = await Promise.all([
      fetchProfile(nextUser.uid),
      fetchTokenClaimRole(nextUser),
    ])
    setProfile(nextProfile)
    setClaimRole(nextClaim)
  }

  useEffect(() => {
    if (!firebaseConfigured) return
    return watchAuth((nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setClaimRole(null)
        setLoading(false)
        return
      }
      ensureUserProfile(nextUser)
        .then(() => Promise.all([fetchProfile(nextUser.uid), fetchTokenClaimRole(nextUser)]))
        .then(([nextProfile, nextClaim]) => {
          setProfile(nextProfile)
          setClaimRole(nextClaim)
        })
        .catch(() => {
          setProfile(null)
          setClaimRole(null)
        })
        .finally(() => setLoading(false))
    })
  }, [])

  // Effective role hierarchy:
  // 1. Evaluator quick-switch mode (if explicitly set in UI for viva demonstration)
  // 2. Custom claim in Auth token (cryptographically signed by Firebase Auth server)
  // 3. User document profile role in Firestore
  // 4. Default: 'student'
  const effectiveRole: UserRole = useMemo(() => {
    if (evaluatorRole) return evaluatorRole
    if (claimRole) return claimRole
    if (profile?.role) return profile.role
    return 'student'
  }, [evaluatorRole, claimRole, profile?.role])

  const isAdmin = effectiveRole === 'admin'
  const isTeacher = effectiveRole === 'teacher' || effectiveRole === 'admin'
  const isStudent = effectiveRole === 'student'

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: firebaseConfigured,
      user,
      profile,
      role: effectiveRole,
      isAdmin,
      isTeacher,
      isStudent,
      isOnline,
      loading,
      evaluatorRole,
      setEvaluatorRole,
      signup: async (email, password, displayName) => {
        await register(email, password, displayName)
      },
      signin: async (email, password) => {
        await login(email, password)
      },
      signout: async () => {
        setEvaluatorRole(null)
        await logout()
      },
      sendReset: async (email) => {
        await resetPassword(email)
      },
      saveProfile: async (input) => {
        if (!user) throw new Error('You need to be signed in.')
        await updateAcademicProfile(user, input)
        await refreshProfile(user)
      },
      changeUserRole: async (targetUid, newRole) => {
        if (!user) throw new Error('You need to be signed in.')
        await updateUserRole(targetUid, newRole)
        if (targetUid === user.uid) {
          await refreshProfile(user)
        }
      },
      refreshProfile: () => refreshProfile(user),
    }),
    [user, profile, effectiveRole, isAdmin, isTeacher, isStudent, isOnline, loading, evaluatorRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
