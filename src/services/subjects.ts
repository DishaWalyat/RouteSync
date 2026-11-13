import { deleteDoc, serverTimestamp } from 'firebase/firestore'
import type { Subject } from '../types/academic.ts'
import { deleteStoredFiles } from './storage.ts'
import { asString, createRecord, recordsWhere, removeRecord, stamp, updateRecord, watchRecords } from './records.ts'

function mapSubject(id: string, data: Record<string, unknown>): Subject {
  return {
    id,
    name: asString(data.name),
    subjectCode: asString(data.subjectCode),
    teacher: asString(data.teacher),
    semester: asString(data.semester),
    color: asString(data.color) || '#8174C8',
    description: asString(data.description),
    createdAt: stamp(data.createdAt),
  }
}

export function watchSubjects(uid: string, onData: (rows: Subject[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'subjects', mapSubject, onData, onError)
}

export async function createSubject(uid: string, input: Omit<Subject, 'id' | 'createdAt'>) {
  return createRecord(uid, 'subjects', { ...input })
}

export async function updateSubject(uid: string, id: string, input: Omit<Subject, 'id' | 'createdAt'>) {
  await updateRecord(uid, 'subjects', id, { ...input, updatedAt: serverTimestamp() })
}

export async function deleteSubject(uid: string, subjectId: string) {
  const related = ['lectures', 'timetable', 'materials', 'units', 'topics', 'assignments', 'reminders']
  const materials = await recordsWhere(uid, 'materials', 'subjectId', subjectId)
  await deleteStoredFiles(materials.map((item) => asString(item.data().storagePath)))
  for (const name of related) {
    const rows = await recordsWhere(uid, name, 'subjectId', subjectId)
    await Promise.all(rows.map((item) => deleteDoc(item.ref)))
  }
  await removeRecord(uid, 'subjects', subjectId)
}
