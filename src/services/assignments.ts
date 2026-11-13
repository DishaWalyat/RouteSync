import { arrayRemove, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { ASSIGNMENT_STATUSES, PRIORITIES, type Assignment, type AssignmentStatus, type Priority } from '../types/academic.ts'
import { deleteStoredFiles } from './storage.ts'
import { asString, asStrings, createRecord, recordsWhere, removeRecord, stamp, updateRecord, watchRecords } from './records.ts'

function priorityOf(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : 'medium'
}

function statusOf(value: unknown): AssignmentStatus {
  return ASSIGNMENT_STATUSES.includes(value as AssignmentStatus) ? (value as AssignmentStatus) : 'pending'
}

function mapAssignment(id: string, data: Record<string, unknown>): Assignment {
  return {
    id,
    subjectId: asString(data.subjectId),
    lectureId: asString(data.lectureId),
    title: asString(data.title),
    description: asString(data.description),
    deadline: asString(data.deadline),
    priority: priorityOf(data.priority),
    status: statusOf(data.status),
    attachmentIds: asStrings(data.attachmentIds),
    createdAt: stamp(data.createdAt),
  }
}

export type AssignmentInput = Omit<Assignment, 'id' | 'createdAt' | 'attachmentIds'>

export function watchAssignments(uid: string, onData: (rows: Assignment[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'assignments', mapAssignment, onData, onError)
}

export async function createAssignment(uid: string, input: AssignmentInput) {
  return createRecord(uid, 'assignments', { ...input, attachmentIds: [] })
}

export async function updateAssignment(uid: string, id: string, input: Partial<AssignmentInput>) {
  await updateRecord(uid, 'assignments', id, { ...input, updatedAt: serverTimestamp() })
}

export async function linkAssignmentFile(uid: string, assignmentId: string, materialId: string) {
  await updateRecord(uid, 'assignments', assignmentId, { attachmentIds: arrayUnion(materialId) })
}

export async function unlinkAssignmentFile(uid: string, assignmentId: string, materialId: string) {
  await updateRecord(uid, 'assignments', assignmentId, { attachmentIds: arrayRemove(materialId) })
}

export async function deleteAssignment(uid: string, assignmentId: string) {
  const materials = await recordsWhere(uid, 'materials', 'assignmentId', assignmentId)
  await deleteStoredFiles(materials.map((item) => asString(item.data().storagePath)))
  await Promise.all(materials.map((item) => deleteDoc(item.ref)))
  await removeRecord(uid, 'assignments', assignmentId)
}
