import { deleteDoc, serverTimestamp } from 'firebase/firestore'
import { TOPIC_STATUSES, type Topic, type TopicStatus, type Unit } from '../types/academic.ts'
import { asNumber, asString, createRecord, recordsWhere, removeRecord, stamp, updateRecord, watchRecords } from './records.ts'

function mapUnit(id: string, data: Record<string, unknown>): Unit {
  return { id, subjectId: asString(data.subjectId), title: asString(data.title), order: asNumber(data.order) }
}

function statusOf(value: unknown): TopicStatus {
  return TOPIC_STATUSES.includes(value as TopicStatus) ? (value as TopicStatus) : 'pending'
}

function mapTopic(id: string, data: Record<string, unknown>): Topic {
  return {
    id,
    subjectId: asString(data.subjectId),
    unitId: asString(data.unitId),
    title: asString(data.title),
    status: statusOf(data.status),
    order: asNumber(data.order),
    updatedAt: stamp(data.updatedAt),
  }
}

export function watchUnits(uid: string, onData: (rows: Unit[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'units', mapUnit, onData, onError)
}

export function watchTopics(uid: string, onData: (rows: Topic[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'topics', mapTopic, onData, onError)
}

export async function createUnit(uid: string, subjectId: string, title: string, order: number) {
  return createRecord(uid, 'units', { subjectId, title, order })
}

export async function updateUnit(uid: string, id: string, title: string) {
  await updateRecord(uid, 'units', id, { title })
}

export async function deleteUnit(uid: string, id: string) {
  const topics = await recordsWhere(uid, 'topics', 'unitId', id)
  await Promise.all(topics.map((item) => deleteDoc(item.ref)))
  await removeRecord(uid, 'units', id)
}

export async function createTopic(uid: string, subjectId: string, unitId: string, title: string, order: number) {
  return createRecord(uid, 'topics', { subjectId, unitId, title, status: 'pending', order, updatedAt: serverTimestamp() })
}

export async function updateTopic(uid: string, id: string, title: string) {
  await updateRecord(uid, 'topics', id, { title, updatedAt: serverTimestamp() })
}

export async function setTopicStatus(uid: string, id: string, status: TopicStatus) {
  await updateRecord(uid, 'topics', id, { status, updatedAt: serverTimestamp() })
}

export async function deleteTopic(uid: string, id: string) {
  await removeRecord(uid, 'topics', id)
}
