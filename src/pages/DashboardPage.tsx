import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Megaphone,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { subjectName } from '../utils/academic.ts'
import {
  formatLongDate,
  formatShortDate,
  greetingForNow,
  inRange,
  todayInput,
  weekBounds,
} from '../utils/dates.ts'

export function DashboardPage() {
  const { profile, user, role, isTeacher, isAdmin } = useAuth()
  const data = useAcademic()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const name = profile?.displayName || user?.displayName || 'there'
  const today = todayInput()
  const week = weekBounds()
  const day = new Date().getDay()

  if (data.loading) return <LoadingState label="Loading your semester…" />

  const attended = data.lectures.filter(
    (item) => item.attendanceStatus === 'attended' && inRange(item.date, week.start, week.end),
  )
  const pending = data.assignments.filter((item) => item.status !== 'completed')
  const completedTopics = data.topics.filter((item) => item.status === 'completed').length
  const syllabus = data.topics.length ? Math.round((completedTopics / data.topics.length) * 100) : 0
  const notesThisWeek = data.lectures.filter(
    (item) => item.topic.trim() && inRange(item.date, week.start, week.end),
  ).length
  const topicsThisWeek = data.topics.filter(
    (item) => item.status === 'completed' && inRange(item.updatedAt, week.start, week.end),
  ).length
  const slots = data.timetable
    .filter((item) => item.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const recent = [...data.lectures]
    .filter((item) => item.topic.trim())
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  const upcoming = [...pending].sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4)

  const latestAnnouncement = data.announcements[0]

  return (
    <div className="space-y-8">
      {data.error && <p className="text-sm text-danger">{data.error}</p>}

      {/* Greeting and Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greetingForNow()}</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-display text-4xl">Hello, {name}</h1>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : role === 'teacher'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              {role}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {formatLongDate(today)}
            {profile?.semester ? ` · Semester ${profile.semester}` : ''} · {data.subjects.length} subjects,{' '}
            {pending.length} open assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher && (
            <Button variant="secondary" onClick={() => navigate('/teacher')}>
              <GraduationCap size={16} />
              Teacher Portal
            </Button>
          )}
          {isAdmin && (
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              <ShieldCheck size={16} />
              Admin Portal
            </Button>
          )}
          <div className="relative">
            <Button onClick={() => setMenu((value) => !value)}>
              <Plus size={16} />
              Quick add
            </Button>
            {menu && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-line bg-white p-1 shadow-sm">
                {[
                  ['Lecture', '/log?new=1'],
                  ['Subject', '/subjects?new=1'],
                  ['Assignment', '/assignments?new=1'],
                  ['Reminder', '/reminders?new=1'],
                ].map(([label, to]) => (
                  <button
                    key={label}
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-paper"
                    onClick={() => {
                      setMenu(false)
                      navigate(to)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Official Broadcast Announcements Banner (Real-time Cloud Sync) */}
      {latestAnnouncement && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700">
                <Megaphone size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-200/70 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    Official Notice
                  </span>
                  {latestAnnouncement.priority === 'high' && (
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      High Priority
                    </span>
                  )}
                  {latestAnnouncement.subjectName && (
                    <span className="text-xs text-muted">
                      {latestAnnouncement.subjectName}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    · by {latestAnnouncement.authorName} ({latestAnnouncement.authorRole})
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-ink">{latestAnnouncement.title}</h3>
                <p className="mt-1 text-sm text-ink/80">{latestAnnouncement.content}</p>
              </div>
            </div>
            {isTeacher && (
              <Link to="/teacher" className="text-xs font-medium text-amber-800 underline shrink-0">
                Manage notices
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Real-Time Synced Academic Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Subjects Enrolled" value={String(data.subjects.length)} />
        <Stat label="Attended this week" value={String(attended.length)} />
        <Stat label="Pending assignments" value={String(pending.length)} />
        <Stat label="Syllabus complete" value={`${syllabus}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Today’s classes</h2>
            <Link to={`/log?date=${today}`} className="text-sm text-accent">
              Open log
            </Link>
          </div>
          {slots.length === 0 ? (
            <EmptyState title="No classes today">Add a weekly timetable from the class log.</EmptyState>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const lecture = data.lectures.find(
                  (item) =>
                    item.date === today &&
                    item.subjectId === slot.subjectId &&
                    item.startTime === slot.startTime,
                )
                return (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-3 py-3"
                  >
                    <div>
                      <p className="font-medium">{subjectName(data.subjects, slot.subjectId)}</p>
                      <p className="text-xs text-muted">
                        {slot.startTime}–{slot.endTime}
                        {slot.room ? ` · ${slot.room}` : ''} · {lecture?.attendanceStatus || 'unmarked'}
                      </p>
                    </div>
                    <Link to={`/log?date=${today}`} className="text-sm text-accent">
                      Add notes
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-2xl">This week</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Lectures attended" value={attended.length} />
            <Row label="Notes added" value={notesThisWeek} />
            <Row label="Topics completed" value={topicsThisWeek} />
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-2xl">Recent notes</h2>
          {recent.length === 0 ? (
            <EmptyState title="No lecture notes yet">Log what was taught after class.</EmptyState>
          ) : (
            <div className="space-y-2">
              {recent.map((lecture) => {
                const files = data.materials.filter((item) => item.lectureId === lecture.id).length
                return (
                  <Link
                    key={lecture.id}
                    to={`/log?date=${lecture.date}`}
                    className="block rounded-2xl border border-line bg-white px-4 py-3"
                  >
                    <p className="text-xs text-muted">
                      {subjectName(data.subjects, lecture.subjectId)} · {formatShortDate(lecture.date)}
                    </p>
                    <p className="mt-1 font-medium">{lecture.topic}</p>
                    {files > 0 && (
                      <p className="mt-1 text-xs text-accent">
                        {files} attachment{files === 1 ? '' : 's'}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl">Pending assignments</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing pending">Assignments you add will show up here.</EmptyState>
          ) : (
            <div className="space-y-2">
              {upcoming.map((item) => (
                <Link
                  key={item.id}
                  to="/assignments"
                  className="block rounded-2xl border border-line bg-white px-4 py-3"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {subjectName(data.subjects, item.subjectId)} · {item.priority} ·{' '}
                    {item.deadline ? formatShortDate(item.deadline) : 'No deadline'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="font-display text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
