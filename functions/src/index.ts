import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const VALID_ROLES = ['student', 'teacher', 'admin'] as const
type UserRole = (typeof VALID_ROLES)[number]

/**
 * Cloud Function: setUserRole
 * Enforces Role-Based Access Control (RBAC) securely on the server.
 * Sets cryptographically signed Custom Claims on Firebase Authentication and synchronizes Firestore.
 * Callable only by authenticated administrators.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Caller must be authenticated to invoke this operation.',
    )
  }

  // 2. Verify caller has admin privileges (from custom claims or Firestore profile)
  const callerClaims = context.auth.token
  let callerIsAdmin = callerClaims.role === 'admin'

  if (!callerIsAdmin) {
    const callerSnap = await admin.firestore().collection('users').doc(context.auth.uid).get()
    callerIsAdmin = callerSnap.exists && callerSnap.data()?.role === 'admin'
  }

  // Allow first user or designated administrator
  if (!callerIsAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators are authorized to manage user roles.',
    )
  }

  const { targetUid, role } = data as { targetUid: string; role: UserRole }

  // 3. Validate target parameters
  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Valid targetUid is required.')
  }

  if (!VALID_ROLES.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role must be one of: ${VALID_ROLES.join(', ')}`,
    )
  }

  try {
    // 4. Set Custom User Claims in Firebase Auth (cryptographically signed in the ID token)
    await admin.auth().setCustomUserClaims(targetUid, { role })

    // 5. Update user document in Firestore
    await admin.firestore().collection('users').doc(targetUid).set(
      {
        role,
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedBy: context.auth.uid,
      },
      { merge: true },
    )

    // 6. Record security audit log
    await admin.firestore().collection('securityAuditLogs').add({
      action: 'SET_ROLE',
      targetUid,
      assignedRole: role,
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, targetUid, assignedRole: role }
  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to update custom claims and user role.',
    )
  }
})

/**
 * Cloud Function Auth Trigger: onUserCreated
 * Automatically initializes every newly registered user with the 'student' role.
 * Ensures no user can inject an elevated role at account creation time.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Assign default role claim 'student'
    await admin.auth().setCustomUserClaims(user.uid, { role: 'student' })

    // Create / ensure user profile document in Firestore
    const userRef = admin.firestore().collection('users').doc(user.uid)
    const existing = await userRef.get()

    if (!existing.exists) {
      await userRef.set({
        displayName: user.displayName || '',
        email: user.email || '',
        semester: '',
        academicYear: '',
        role: 'student',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      await userRef.update({
        role: 'student',
      })
    }
  } catch (err) {
    functions.logger.error('Error initializing user profile on creation:', err)
  }
})

/**
 * Cloud Function: getSystemSummary
 * Serverless calculation of institutional metrics without pulling full client collections.
 * Satisfies cloud scalability and privacy requirements.
 */
export const getSystemSummary = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
  }

  const usersSnap = await admin.firestore().collection('users').get()
  let studentsCount = 0
  let teachersCount = 0
  let adminsCount = 0

  usersSnap.forEach((doc) => {
    const role = doc.data().role
    if (role === 'teacher') teachersCount++
    else if (role === 'admin') adminsCount++
    else studentsCount++
  })

  return {
    totalUsers: usersSnap.size,
    studentsCount,
    teachersCount,
    adminsCount,
    timestamp: new Date().toISOString(),
  }
})

