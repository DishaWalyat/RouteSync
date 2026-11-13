import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from './firebase.ts'
import type { Announcement, Priority } from '../types/academic.ts'
import { asString, stamp } from './records.ts'

function announcementsCollection() {
  return collection(getDb(), 'announcements')
}

function mapAnnouncement(id: string, data: Record<string, unknown>): Announcement {
  const prio = asString(data.priority) as Priority
  const priority: Priority = prio === 'high' || prio === 'low' ? prio : 'medium'
  const role = asString(data.authorRole) === 'admin' ? 'admin' : 'teacher'

  return {
    id,
    title: asString(data.title),
    content: asString(data.content),
    authorName: asString(data.authorName),
    authorEmail: asString(data.authorEmail),
    authorRole: role,
    subjectId: asString(data.subjectId) || undefined,
    subjectName: asString(data.subjectName) || undefined,
    priority,
    createdAt: stamp(data.createdAt),
  }
}

export function watchAnnouncements(
  onData: (rows: Announcement[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(announcementsCollection(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapAnnouncement(item.id, item.data() as Record<string, unknown>))),
    (error) => onError(error),
  )
}

export async function createAnnouncement(input: {
  title: string
  content: string
  authorName: string
  authorEmail: string
  authorRole: 'teacher' | 'admin'
  subjectId?: string
  subjectName?: string
  priority: Priority
}) {
  const ref = await addDoc(announcementsCollection(), {
    ...input,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(getDb(), 'announcements', id))
}
