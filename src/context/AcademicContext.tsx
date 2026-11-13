import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { watchAnnouncements } from '../services/announcements.ts'
import { watchAssignments } from '../services/assignments.ts'
import { watchLectures } from '../services/lectures.ts'
import { watchMaterials } from '../services/materials.ts'
import { watchReminders } from '../services/reminders.ts'
import { watchSharedMaterials } from '../services/sharedMaterials.ts'
import { watchSubjects } from '../services/subjects.ts'
import { watchTopics, watchUnits } from '../services/syllabus.ts'
import { watchTimetable } from '../services/timetable.ts'
import type {
  Announcement,
  Assignment,
  Lecture,
  Material,
  Reminder,
  SharedMaterial,
  Subject,
  TimetableSlot,
  Topic,
  Unit,
} from '../types/academic.ts'
import { useAuth } from './AuthContext.tsx'

type AcademicState = {
  subjects: Subject[]
  lectures: Lecture[]
  timetable: TimetableSlot[]
  materials: Material[]
  units: Unit[]
  topics: Topic[]
  assignments: Assignment[]
  reminders: Reminder[]
  announcements: Announcement[]
  sharedMaterials: SharedMaterial[]
  loading: boolean
  error: string
}

const empty: AcademicState = {
  subjects: [],
  lectures: [],
  timetable: [],
  materials: [],
  units: [],
  topics: [],
  assignments: [],
  reminders: [],
  announcements: [],
  sharedMaterials: [],
  loading: true,
  error: '',
}

const AcademicContext = createContext<AcademicState | null>(null)

export function AcademicProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AcademicState>(empty)

  useEffect(() => {
    if (!user) return
    const ready = new Set<string>()
    const mark = (key: string) => {
      ready.add(key)
      if (ready.size >= 8) setState((current) => ({ ...current, loading: false }))
    }
    const fail = (error: Error) => setState((current) => ({ ...current, loading: false, error: error.message }))
    const patch = <K extends keyof AcademicState>(key: K, value: AcademicState[K]) => {
      mark(key)
      setState((current) => ({ ...current, [key]: value, error: '' }))
    }

    const unsubscribers = [
      watchSubjects(user.uid, (subjects) => patch('subjects', subjects), fail),
      watchLectures(user.uid, (lectures) => patch('lectures', lectures), fail),
      watchTimetable(user.uid, (timetable) => patch('timetable', timetable), fail),
      watchMaterials(user.uid, (materials) => patch('materials', materials), fail),
      watchUnits(user.uid, (units) => patch('units', units), fail),
      watchTopics(user.uid, (topics) => patch('topics', topics), fail),
      watchAssignments(user.uid, (assignments) => patch('assignments', assignments), fail),
      watchReminders(user.uid, (reminders) => patch('reminders', reminders), fail),
      watchAnnouncements(
        (announcements) => patch('announcements', announcements),
        () => patch('announcements', []), // Non-blocking
      ),
      watchSharedMaterials(
        (materials) => patch('sharedMaterials', materials),
        () => patch('sharedMaterials', []), // Non-blocking
      ),
    ]

    return () => unsubscribers.forEach((stop) => stop())
  }, [user])

  const value = useMemo(() => state, [state])
  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>
}

export function useAcademic() {
  const context = useContext(AcademicContext)
  if (!context) throw new Error('useAcademic must be used within AcademicProvider')
  return context
}
