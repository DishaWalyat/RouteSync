import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { LoadingState } from '../components/EmptyState.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { subjectName } from '../utils/academic.ts'
import { addDays, formatLongDate, startOfWeek, toDateInput } from '../utils/dates.ts'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarPage() {
  const data = useAcademic()
  const [cursor, setCursor] = useState(() => new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selected, setSelected] = useState(toDateInput(new Date()))

  const days = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index))
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    return Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(first), index))
  }, [cursor, view])

  if (data.loading) return <LoadingState />

  const label = view === 'week'
    ? `${formatLongDate(toDateInput(days[0] ?? cursor))} – ${formatLongDate(toDateInput(days[6] ?? cursor))}`
    : new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(cursor)

  function shift(direction: -1 | 1) {
    const next = new Date(cursor)
    if (view === 'week') next.setDate(next.getDate() + direction * 7)
    else next.setMonth(next.getMonth() + direction)
    setCursor(next)
  }

  const lectures = data.lectures.filter((item) => item.date === selected)
  const slots = data.timetable.filter((item) => item.dayOfWeek === new Date(`${selected}T00:00:00`).getDay())
  const assignments = data.assignments.filter((item) => item.deadline.slice(0, 10) === selected)
  const reminders = data.reminders.filter((item) => item.dateTime.slice(0, 10) === selected)

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Lectures, deadlines, tests, and reminders on the days they belong to." />
      <div className="rounded-2xl border border-line bg-white p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-paper p-1">
            {(['week', 'month'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setView(item)} className={`rounded-full px-3 py-1.5 text-sm capitalize ${view === item ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
            <p className="min-w-40 text-center text-sm">{label}</p>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper" onClick={() => shift(1)} aria-label="Next"><ChevronRight size={16} /></button>
            <button type="button" className="rounded-full px-3 py-1.5 text-sm text-muted" onClick={() => { const today = new Date(); setCursor(today); setSelected(toDateInput(today)) }}>Today</button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] tracking-wide text-muted">
          {WEEKDAYS.map((day) => <div key={day} className="py-2">{day.toUpperCase()}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const iso = toDateInput(day)
            const dayLectures = data.lectures.filter((item) => item.date === iso)
            const dayAssignments = data.assignments.filter((item) => item.deadline.slice(0, 10) === iso)
            const dayReminders = data.reminders.filter((item) => item.dateTime.slice(0, 10) === iso)
            const outside = view === 'month' && day.getMonth() !== cursor.getMonth()
            const isToday = iso === toDateInput(new Date())
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={`min-h-20 border-b border-r border-line p-1.5 text-left ${selected === iso ? 'bg-accent-soft/70' : ''} ${view === 'week' ? 'min-h-36' : ''}`}
              >
                <span className={`inline-grid h-6 min-w-6 place-items-center rounded-full text-xs ${isToday ? 'bg-accent text-white' : outside ? 'text-muted/50' : 'text-ink'}`}>{day.getDate()}</span>
                <span className="mt-1 flex gap-1">
                  {dayLectures.length > 0 && <Dot className={dayLectures.some((item) => item.attendanceStatus === 'attended') ? 'bg-accent' : 'bg-ink/30'} />}
                  {dayAssignments.length > 0 && <Dot className="bg-danger" />}
                  {dayReminders.length > 0 && <Dot className="bg-[#6E8B74]" />}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Dot className="bg-accent" /> Lecture</span>
          <span className="inline-flex items-center gap-1"><Dot className="bg-danger" /> Deadline</span>
          <span className="inline-flex items-center gap-1"><Dot className="bg-[#6E8B74]" /> Reminder</span>
        </p>
      </div>
      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{formatLongDate(selected)}</h2>
          <Link to={`/log?date=${selected}`} className="text-sm text-accent">Open daily log</Link>
        </div>
        <div className="mt-4 space-y-4 text-sm">
          <Block title="Scheduled">
            {slots.length === 0 ? <p className="text-muted">No timetable classes.</p> : slots.map((slot) => (
              <p key={slot.id}>{subjectName(data.subjects, slot.subjectId)} · {slot.startTime}–{slot.endTime}</p>
            ))}
          </Block>
          <Block title="Logged lectures">
            {lectures.length === 0 ? <p className="text-muted">Nothing logged.</p> : lectures.map((item) => (
              <p key={item.id}>{subjectName(data.subjects, item.subjectId)} · {item.topic || 'Untitled'} · {item.attendanceStatus}</p>
            ))}
          </Block>
          <Block title="Deadlines">
            {assignments.length === 0 ? <p className="text-muted">No deadlines.</p> : assignments.map((item) => (
              <p key={item.id}>{item.title} · {item.priority} · {item.status.replace('_', ' ')}</p>
            ))}
          </Block>
          <Block title="Reminders">
            {reminders.length === 0 ? <p className="text-muted">No reminders.</p> : reminders.map((item) => (
              <p key={item.id}>{item.title} · {item.type}{item.isCompleted ? ' · done' : ''}</p>
            ))}
          </Block>
        </div>
      </section>
    </div>
  )
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted">{title.toUpperCase()}</p>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  )
}
