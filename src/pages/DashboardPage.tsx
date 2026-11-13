import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  ListChecks,
  Megaphone,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
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
  const name = profile?.displayName || user?.displayName || 'Student'
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

  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : role === 'teacher'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

  return (
    <div className="space-y-8">
      {data.error && <p className="text-sm font-medium text-danger">{data.error}</p>}

      {/* Hero Welcome Banner (inspired by Image 3 & Image 2) */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-100/70 via-purple-50/60 to-rose-50/50 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-violet-700 shadow-2xs">
                <Sparkles size={12} className="text-[#FF6433]" />
                {greetingForNow()}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${roleBadgeStyle}`}>
                {role}
              </span>
              {profile?.semester && (
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-muted">
                  Semester {profile.semester}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
              Welcome back, {name}!
            </h1>
            <p className="mt-2 text-sm text-ink/75 leading-relaxed">
              {formatLongDate(today)} · You have <span className="font-semibold text-ink">{pending.length} open assignments</span> and <span className="font-semibold text-ink">{slots.length} lectures</span> scheduled for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isTeacher && (
              <Button variant="secondary" onClick={() => navigate('/teacher')}>
                <GraduationCap size={16} />
                Faculty Portal
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
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-line bg-white p-1.5 shadow-lg">
                  {[
                    ['Lecture Note', '/log?new=1'],
                    ['New Subject', '/subjects?new=1'],
                    ['Assignment', '/assignments?new=1'],
                    ['Reminder', '/reminders?new=1'],
                  ].map(([label, to]) => (
                    <button
                      key={label}
                      type="button"
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-paper transition"
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
      </div>

      {/* Official Broadcast Announcement Banner (if any) */}
      {latestAnnouncement && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-800 font-bold">
                <Megaphone size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    Official Notice
                  </span>
                  {latestAnnouncement.priority === 'high' && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                      High Priority
                    </span>
                  )}
                  {latestAnnouncement.subjectName && (
                    <span className="text-xs font-medium text-muted">
                      {latestAnnouncement.subjectName}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    · by {latestAnnouncement.authorName} ({latestAnnouncement.authorRole})
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-ink">{latestAnnouncement.title}</h3>
                <p className="mt-1 text-sm text-ink/80 leading-relaxed">{latestAnnouncement.content}</p>
              </div>
            </div>
            {isTeacher && (
              <Link to="/teacher" className="text-xs font-semibold text-amber-900 underline shrink-0 hover:text-ink">
                Manage
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Overview Stat Cards (Candy Palette inspired by Image 3 & Image 1) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Sunny Yellow */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#FFC436] p-5 text-stone-900 shadow-xs transition hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/40 text-stone-900 font-bold backdrop-blur-xs">
              <BookOpen size={20} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800/80">Subjects</span>
          </div>
          <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">{data.subjects.length}</p>
          <p className="mt-1 text-xs font-semibold text-stone-800/80">Enrolled Courses</p>
        </div>

        {/* Card 2: Deep Midnight Indigo */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#2D2353] p-5 text-white shadow-xs transition hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white font-bold backdrop-blur-xs">
              <CalendarCheck size={20} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-white/70">Attendance</span>
          </div>
          <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">{attended.length}</p>
          <p className="mt-1 text-xs font-medium text-white/80">Lectures Attended This Week</p>
        </div>

        {/* Card 3: Hot Rose Pink */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#FF4D88] p-5 text-white shadow-xs transition hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white font-bold backdrop-blur-xs">
              <ClipboardList size={20} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-white/70">Tasks</span>
          </div>
          <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">{pending.length}</p>
          <p className="mt-1 text-xs font-medium text-white/80">Pending Assignments</p>
        </div>

        {/* Card 4: Electric Sky Blue */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#4FA8FF] p-5 text-white shadow-xs transition hover:shadow-md hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white font-bold backdrop-blur-xs">
              <ListChecks size={20} />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-white/70">Curriculum</span>
          </div>
          <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">{syllabus}%</p>
          <p className="mt-1 text-xs font-medium text-white/80">Syllabus Completed</p>
        </div>
      </div>

      {/* Main Grid: Today's Classes & Weekly Performance */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Today’s Classes</h2>
              <p className="text-xs text-muted">Weekly timetable schedule for today</p>
            </div>
            <Link to={`/log?date=${today}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF6433] hover:underline">
              Open log <ArrowRight size={14} />
            </Link>
          </div>
          {slots.length === 0 ? (
            <EmptyState title="No classes scheduled today">
              Configure your weekly timetable from the Daily Class Log to auto-populate classes.
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const lecture = data.lectures.find(
                  (item) =>
                    item.date === today &&
                    item.subjectId === slot.subjectId &&
                    item.startTime === slot.startTime,
                )
                const subject = data.subjects.find((s) => s.id === slot.subjectId)
                return (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper/40 p-4 transition hover:bg-paper"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full ring-2 ring-white shrink-0"
                        style={{ background: subject?.color || '#5B4BD8' }}
                      />
                      <div>
                        <p className="font-semibold text-ink text-sm">{subjectName(data.subjects, slot.subjectId)}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {slot.startTime}–{slot.endTime}
                          {slot.room ? ` · Room ${slot.room}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lecture?.attendanceStatus === 'attended'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lecture?.attendanceStatus === 'missed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {lecture?.attendanceStatus || 'unmarked'}
                      </span>
                      <Link
                        to={`/log?date=${today}`}
                        className="rounded-xl bg-white border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                      >
                        Notes
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Performance Rail (inspired by Image 2) */}
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">This Week</h2>
            <p className="text-xs text-muted mb-4">Academic progress and activity</p>
            <dl className="space-y-3.5 text-sm">
              <Row label="Lectures attended" value={attended.length} badge="Attendance" />
              <Row label="Lecture notes logged" value={notesThisWeek} badge="Notes" />
              <Row label="Syllabus topics done" value={topicsThisWeek} badge="Syllabus" />
              <Row label="Pending coursework" value={pending.length} badge="Tasks" />
            </dl>
          </div>
          <div className="mt-6 rounded-2xl bg-violet-50/70 border border-violet-100 p-4">
            <p className="text-xs font-bold text-violet-900 uppercase tracking-wider">Semester Status</p>
            <p className="mt-1 text-xs text-violet-700 leading-relaxed">
              Real-time Firestore listeners actively sync your courses, timetable, and attendance.
            </p>
          </div>
        </section>
      </div>

      {/* Lower Row: Recent Notes & Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Recent Lecture Notes</h2>
              <p className="text-xs text-muted">Latest topics logged across your subjects</p>
            </div>
            <Link to="/notes" className="text-xs font-semibold text-[#FF6433] hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No lecture notes yet">
              Log topics after each lecture to keep an active academic record.
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {recent.map((lecture) => {
                const subject = data.subjects.find((s) => s.id === lecture.subjectId)
                const files = data.materials.filter((item) => item.lectureId === lecture.id).length
                return (
                  <Link
                    key={lecture.id}
                    to={`/log?date=${lecture.date}`}
                    className="block rounded-2xl border border-line bg-paper/30 p-4 transition hover:bg-paper hover:border-line-bold"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ background: subject?.color || '#5B4BD8' }}
                      >
                        {subjectName(data.subjects, lecture.subjectId)}
                      </span>
                      <span className="text-xs text-muted font-medium">{formatShortDate(lecture.date)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">{lecture.topic}</p>
                    {files > 0 && (
                      <p className="mt-1 text-xs font-semibold text-[#5B4BD8]">
                        📎 {files} attached resource{files === 1 ? '' : 's'}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Pending Coursework</h2>
              <p className="text-xs text-muted">Assignments and projects requiring attention</p>
            </div>
            <Link to="/assignments" className="text-xs font-semibold text-[#FF6433] hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing pending!">
              All assignments are completed. Great job staying ahead of deadlines.
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((item) => {
                const subject = data.subjects.find((s) => s.id === item.subjectId)
                return (
                  <Link
                    key={item.id}
                    to="/assignments"
                    className="block rounded-2xl border border-line bg-paper/30 p-4 transition hover:bg-paper hover:border-line-bold"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'low'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full inline-block shrink-0"
                        style={{ background: subject?.color || '#5B4BD8' }}
                      />
                      <span className="font-medium text-ink/80">{subjectName(data.subjects, item.subjectId)}</span>
                      {' · Due: '}
                      <span className="font-semibold text-rose-600">
                        {item.deadline ? formatShortDate(item.deadline) : 'No date'}
                      </span>
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, value, badge }: { label: string; value: number; badge?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line/60 py-2.5 last:border-0">
      <dt className="text-muted flex items-center gap-2">
        {badge && (
          <span className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {badge}
          </span>
        )}
        <span>{label}</span>
      </dt>
      <dd className="font-display font-extrabold text-lg text-ink">{value}</dd>
    </div>
  )
}
