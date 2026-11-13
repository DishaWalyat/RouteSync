import { REMINDER_TYPES, type Reminder, type ReminderType } from '../types/academic.ts'
import { asString, createRecord, removeRecord, stamp, updateRecord, watchRecords } from './records.ts'

function typeOf(value: unknown): ReminderType {
  return REMINDER_TYPES.includes(value as ReminderType) ? (value as ReminderType) : 'custom'
}

function mapReminder(id: string, data: Record<string, unknown>): Reminder {
  return {
    id,
    title: asString(data.title),
    description: asString(data.description),
    type: typeOf(data.type),
    subjectId: asString(data.subjectId),
    dateTime: asString(data.dateTime),
    isCompleted: Boolean(data.isCompleted),
    createdAt: stamp(data.createdAt),
  }
}

export type ReminderInput = Omit<Reminder, 'id' | 'createdAt'>

export function watchReminders(uid: string, onData: (rows: Reminder[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'reminders', mapReminder, onData, onError)
}

export async function createReminder(uid: string, input: ReminderInput) {
  return createRecord(uid, 'reminders', { ...input })
}

export async function updateReminder(uid: string, id: string, input: Partial<ReminderInput>) {
  await updateRecord(uid, 'reminders', id, { ...input })
}

export async function deleteReminder(uid: string, id: string) {
  await removeRecord(uid, 'reminders', id)
}
