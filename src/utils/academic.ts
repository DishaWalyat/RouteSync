import type { Subject } from '../types/academic.ts'

export function subjectById(subjects: Subject[], id: string) {
  return subjects.find((subject) => subject.id === id)
}

export function subjectName(subjects: Subject[], id: string) {
  return subjectById(subjects, id)?.name || 'Subject'
}

export function percent(done: number, total: number) {
  if (total <= 0) return 0
  return Math.round((done / total) * 100)
}
