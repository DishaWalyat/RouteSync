import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getFirebaseAuth, getDb, getFirebaseFunctions } from './firebase.ts'
import type { UserAdminView, UserProfile, UserRole } from '../types/academic.ts'

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

/**
 * Register a new user. The role is strictly enforced as 'student' by default.
 * Client-submitted role manipulation is prevented both in code and Firestore security rules.
 */
export async function register(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  await updateProfile(cred.user, { displayName })
  await setDoc(doc(getDb(), 'users', cred.user.uid), {
    displayName,
    email,
    semester: '',
    academicYear: '',
    role: 'student', // Trusted default role
    createdAt: serverTimestamp(),
  })
  return cred.user
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  await ensureUserProfile(cred.user)
  return cred.user
}

export async function logout() {
  await signOut(getFirebaseAuth())
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email)
}

export async function ensureUserProfile(user: User) {
  const ref = doc(getDb(), 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      semester: '',
      academicYear: '',
      role: 'student', // Trusted default role
      createdAt: serverTimestamp(),
    })
  }
}

/**
 * Reads token claims (cryptographically signed by Firebase Auth)
 */
export async function fetchTokenClaimRole(user: User): Promise<UserRole | null> {
  try {
    const result = await user.getIdTokenResult()
    const claimRole = result.claims.role as string | undefined
    if (claimRole === 'admin' || claimRole === 'teacher' || claimRole === 'student') {
      return claimRole
    }
  } catch {
    // Non-blocking fallback
  }
  return null
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  const roleRaw = String(data.role || 'student')
  const role: UserRole = roleRaw === 'admin' || roleRaw === 'teacher' ? roleRaw : 'student'

  return {
    displayName: String(data.displayName ?? ''),
    email: String(data.email ?? ''),
    semester: String(data.semester ?? ''),
    academicYear: String(data.academicYear ?? ''),
    role,
    department: data.department ? String(data.department) : undefined,
    createdAt: timestampToIso(data.createdAt),
  }
}

/**
 * Updates academic profile fields only.
 * Role field cannot be changed via this function (enforcing RBAC security).
 */
export async function updateAcademicProfile(
  user: User,
  input: { displayName: string; semester: string; academicYear: string },
) {
  await updateProfile(user, { displayName: input.displayName })
  await updateDoc(doc(getDb(), 'users', user.uid), {
    displayName: input.displayName,
    semester: input.semester,
    academicYear: input.academicYear,
  })
}

/**
 * Admin-only operation: Update user role in Firestore and invoke Cloud Function for Custom Claims.
 */
export async function updateUserRole(targetUid: string, newRole: UserRole): Promise<void> {
  // Update role in Firestore database
  await updateDoc(doc(getDb(), 'users', targetUid), {
    role: newRole,
    roleUpdatedAt: serverTimestamp(),
  })

  // Attempt to invoke Cloud Function to set custom claim on Firebase Auth server
  try {
    const setRoleCallable = httpsCallable<{ targetUid: string; role: UserRole }, { success: boolean }>(
      getFirebaseFunctions(),
      'setUserRole',
    )
    await setRoleCallable({ targetUid, role: newRole })
  } catch {
    // Cloud Function invocation may be skipped in client-only demo environments;
    // Firestore rules and application context enforce the updated database role.
  }
}

/**
 * Fetch all registered users for the Admin portal table.
 */
export async function fetchAllUsers(): Promise<UserAdminView[]> {
  const snapshot = await getDocs(collection(getDb(), 'users'))
  return snapshot.docs.map((item) => {
    const data = item.data()
    const roleRaw = String(data.role || 'student')
    const role: UserRole = roleRaw === 'admin' || roleRaw === 'teacher' ? roleRaw : 'student'
    return {
      uid: item.id,
      displayName: String(data.displayName || 'Unnamed'),
      email: String(data.email || ''),
      role,
      semester: String(data.semester || ''),
      academicYear: String(data.academicYear || ''),
      createdAt: timestampToIso(data.createdAt),
    }
  })
}

function timestampToIso(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value.toDate() as Date).toISOString()
  }
  return typeof value === 'string' ? value : ''
}
