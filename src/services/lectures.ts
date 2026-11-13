import { arrayRemove, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { ATTENDANCE, type AttendanceStatus, type Lecture } from '../types/academic.ts'
import { deleteStoredFiles } from './storage.ts'
import { asString, asStrings, createRecord, recordsWhere, removeRecord, stamp, updateRecord, watchRecords } from './records.ts'

function statusOf(value: unknown): AttendanceStatus {
  return ATTENDANCE.includes(value as AttendanceStatus) ? (value as AttendanceStatus) : 'unmarked'
}

function mapLecture(id: string, data: Record<string, unknown>): Lecture {
  return {
    id,
    subjectId: asString(data.subjectId),
    date: asString(data.date),
    startTime: asString(data.startTime),
    endTime: asString(data.endTime),
    room: asString(data.room),
    lectureNumber: asString(data.lectureNumber),
    topic: asString(data.topic),
    description: asString(data.description),
    attendanceStatus: statusOf(data.attendanceStatus),
    homework: asString(data.homework),
    attachmentIds: asStrings(data.attachmentIds),
    createdAt: stamp(data.createdAt),
    updatedAt: stamp(data.updatedAt),
  }
}

export type LectureInput = Omit<Lecture, 'id' | 'createdAt' | 'updatedAt' | 'attachmentIds'>

export function watchLectures(uid: string, onData: (rows: Lecture[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'lectures', mapLecture, onData, onError)
}

export async function createLecture(uid: string, input: LectureInput) {
  return createRecord(uid, 'lectures', { ...input, attachmentIds: [], updatedAt: serverTimestamp() })
}

export async function updateLecture(uid: string, id: string, input: Partial<LectureInput>) {
  await updateRecord(uid, 'lectures', id, { ...input, updatedAt: serverTimestamp() })
}

export async function linkLectureFile(uid: string, lectureId: string, materialId: string) {
  await updateRecord(uid, 'lectures', lectureId, { attachmentIds: arrayUnion(materialId), updatedAt: serverTimestamp() })
}

export async function unlinkLectureFile(uid: string, lectureId: string, materialId: string) {
  await updateRecord(uid, 'lectures', lectureId, { attachmentIds: arrayRemove(materialId) })
}

export async function deleteLecture(uid: string, lectureId: string) {
  const materials = await recordsWhere(uid, 'materials', 'lectureId', lectureId)
  await deleteStoredFiles(materials.map((item) => asString(item.data().storagePath)))
  await Promise.all(materials.map((item) => deleteDoc(item.ref)))
  await removeRecord(uid, 'lectures', lectureId)
}
