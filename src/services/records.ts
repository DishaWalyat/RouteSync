import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDb } from './firebase.ts'

export function userCollection(uid: string, name: string) {
  return collection(getDb(), 'users', uid, name)
}

export function watchRecords<T>(
  uid: string,
  name: string,
  mapRow: (id: string, data: Record<string, unknown>) => T,
  onData: (rows: T[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    userCollection(uid, name),
    (snapshot) => onData(snapshot.docs.map((item) => mapRow(item.id, item.data() as Record<string, unknown>))),
    (error) => onError(error),
  )
}

export async function createRecord(uid: string, name: string, data: Record<string, unknown>) {
  const ref = await addDoc(userCollection(uid, name), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateRecord(uid: string, name: string, id: string, data: Record<string, unknown>) {
  await updateDoc(doc(getDb(), 'users', uid, name, id), data)
}

export async function removeRecord(uid: string, name: string, id: string) {
  await deleteDoc(doc(getDb(), 'users', uid, name, id))
}

export async function recordsWhere(uid: string, name: string, field: string, value: string) {
  const snapshot = await getDocs(query(userCollection(uid, name), where(field, '==', value)))
  return snapshot.docs
}

export function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function asNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value) || 0
}

export function asStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : []
}

export function stamp(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value.toDate() as Date).toISOString()
  }
  return typeof value === 'string' ? value : ''
}
