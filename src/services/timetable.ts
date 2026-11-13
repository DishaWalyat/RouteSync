import type { TimetableSlot } from '../types/academic.ts'
import { asNumber, asString, createRecord, removeRecord, updateRecord, watchRecords } from './records.ts'

function mapSlot(id: string, data: Record<string, unknown>): TimetableSlot {
  return {
    id,
    subjectId: asString(data.subjectId),
    dayOfWeek: asNumber(data.dayOfWeek),
    startTime: asString(data.startTime),
    endTime: asString(data.endTime),
    room: asString(data.room),
    lectureNumber: asString(data.lectureNumber),
  }
}

export type TimetableInput = Omit<TimetableSlot, 'id'>

export function watchTimetable(uid: string, onData: (rows: TimetableSlot[]) => void, onError: (error: Error) => void) {
  return watchRecords(uid, 'timetable', mapSlot, onData, onError)
}

export async function createSlot(uid: string, input: TimetableInput) {
  return createRecord(uid, 'timetable', { ...input })
}

export async function updateSlot(uid: string, id: string, input: TimetableInput) {
  await updateRecord(uid, 'timetable', id, { ...input })
}

export async function deleteSlot(uid: string, id: string) {
  await removeRecord(uid, 'timetable', id)
}
