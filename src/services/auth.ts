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
import {
  USER_ROLES,
  type UserAdminView,
  type UserProfile,
  type UserRole,
} from '../types/supplyChain.ts'

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

/**
 * Register a new supply chain participant.
 * Non-admin roles (Manufacturer, Distributor, Warehouse, Transporter, Retailer) can be requested,
 * but Admin elevation is strictly prevented both in code and Firestore security rules.
 */
export async function register(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'transporter',
  organizationName: string = '',
) {
  // Disallow direct admin registration from frontend
  const sanitizedRole: UserRole =
    role === 'admin' || !USER_ROLES.includes(role) ? 'transporter' : role

  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  await updateProfile(cred.user, { displayName })
  await setDoc(doc(getDb(), 'users', cred.user.uid), {
    displayName,
    email,
    organizationName: organizationName || 'Logistics Partner',
    phone: '',
    location: '',
    role: sanitizedRole,
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
      organizationName: 'Primary Partner',
      phone: '',
      location: '',
      role: 'transporter',
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
    if (claimRole && USER_ROLES.includes(claimRole as UserRole)) {
      return claimRole as UserRole
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
  const roleRaw = String(data.role || 'transporter')
  const role: UserRole = USER_ROLES.includes(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : 'transporter'

  return {
    displayName: String(data.displayName ?? ''),
    email: String(data.email ?? ''),
    organizationName: String(data.organizationName ?? 'Logistics Node'),
    phone: String(data.phone ?? ''),
    location: String(data.location ?? ''),
    role,
    createdAt: timestampToIso(data.createdAt),
  }
}

/**
 * Updates participant profile fields only.
 * Role field cannot be changed via this function (enforcing RBAC security).
 */
export async function updateParticipantProfile(
  user: User,
  input: { displayName: string; organizationName: string; phone?: string; location?: string },
) {
  await updateProfile(user, { displayName: input.displayName })
  await updateDoc(doc(getDb(), 'users', user.uid), {
    displayName: input.displayName,
    organizationName: input.organizationName,
    phone: input.phone || '',
    location: input.location || '',
  })
}

/**
 * Admin-only operation: Update user role in Firestore and invoke Cloud Function for Custom Claims.
 */
export async function updateUserRole(targetUid: string, newRole: UserRole): Promise<void> {
  await updateDoc(doc(getDb(), 'users', targetUid), {
    role: newRole,
    roleUpdatedAt: serverTimestamp(),
  })

  try {
    const setRoleCallable = httpsCallable<{ targetUid: string; role: UserRole }, { success: boolean }>(
      getFirebaseFunctions(),
      'setUserRole',
    )
    await setRoleCallable({ targetUid, role: newRole })
  } catch {
    // Non-blocking in client-only demo environments;
    // Firestore rules and application context enforce the updated database role.
  }
}

/**
 * Fetch all registered users for the Admin portal directory table.
 */
export async function fetchAllUsers(): Promise<UserAdminView[]> {
  const snapshot = await getDocs(collection(getDb(), 'users'))
  return snapshot.docs.map((item) => {
    const data = item.data()
    const roleRaw = String(data.role || 'transporter')
    const role: UserRole = USER_ROLES.includes(roleRaw as UserRole)
      ? (roleRaw as UserRole)
      : 'transporter'
    return {
      uid: item.id,
      displayName: String(data.displayName || 'Operator'),
      email: String(data.email || ''),
      role,
      organizationName: String(data.organizationName || 'Logistics Node'),
      phone: String(data.phone || ''),
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
