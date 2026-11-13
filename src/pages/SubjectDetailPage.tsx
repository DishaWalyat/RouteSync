import { Link, useParams } from 'react-router-dom'
import { BookOpen, CalendarCheck, CheckCircle2, FileText, ArrowLeft } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { LoadingState } from '../components/EmptyState.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { percent } from '../utils/academic.ts'
import { formatShortDate } from '../utils/dates.ts'

export function SubjectDetailPage() {
  const { id = '' } = useParams()
  const data = useAcademic()
  if (data.loading) return <LoadingState />
  const subject = data.subjects.find((item) => item.id === id)
  if (!subject) return <p className="text-sm text-muted">This subject could not be found.</p>

  const lectures = data.lectures.filter((item) => item.subjectId === id).sort((a, b) => b.date.localeCompare(a.date))
  const attended = lectures.filter((item) => item.attendanceStatus === 'attended').length
  const topics = data.topics.filter((item) => item.subjectId === id)
  const done = topics.filter((item) => item.status === 'completed').length
  const materials = data.materials.filter((item) => item.subjectId === id)
  const assignments = data.assignments.filter((item) => item.subjectId === id)
  const tests = data.reminders
    .filter((item) => item.subjectId === id && item.type === 'test' && !item.isCompleted)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))

  const attendancePercent = percent(attended, lectures.length)
  const syllabusPercent = percent(done, topics.length)

  return (
    <div className="space-y-8">
      <div>
        <Link to="/subjects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink mb-3 transition">
          <ArrowLeft size={14} /> Back to Courses
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="h-4 w-4 rounded-full ring-2 ring-white shrink-0"
            style={{ background: subject.color || '#5B4BD8' }}
          />
          <PageHeader
            title={subject.name}
            description={[
              subject.subjectCode,
              subject.teacher && `Faculty: ${subject.teacher}`,
              subject.semester && `Semester ${subject.semester}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
        </div>
        {subject.description && <p className="mt-2 text-sm leading-6 text-muted">{subject.description}</p>}
      </div>

      {/* 4 Candy Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-[#FFC436] p-5 text-stone-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/40 font-bold">
              <BookOpen size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800/80">Lectures</span>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold">{lectures.length}</p>
          <p className="mt-1 text-xs font-semibold text-stone-800/80">Total Logged</p>
        </div>

        <div className="rounded-3xl bg-[#2D2353] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 font-bold">
              <CalendarCheck size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">Attended</span>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold">{attended}</p>
          <p className="mt-1 text-xs font-medium text-white/80">Classes Present</p>
        </div>

        <div className="rounded-3xl bg-[#FF4D88] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 font-bold">
              %
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">Attendance</span>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold">{attendancePercent}%</p>
          <p className="mt-1 text-xs font-medium text-white/80">Attendance Rate</p>
        </div>

        <div className="rounded-3xl bg-[#4FA8FF] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 font-bold">
              <CheckCircle2 size={18} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">Syllabus</span>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold">{syllabusPercent}%</p>
          <p className="mt-1 text-xs font-medium text-white/80">{done}/{topics.length} Topics Completed</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold text-ink">Recorded Lectures</h2>
        {lectures.length === 0 ? (
          <p className="text-sm text-muted">No lectures logged for this subject yet.</p>
        ) : (
          <div className="space-y-2.5">
            {lectures.map((lecture) => (
              <Link
                key={lecture.id}
                to={`/log?date=${lecture.date}`}
                className="block rounded-2xl border border-line bg-white px-4 py-3.5 transition hover:bg-paper"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{formatShortDate(lecture.date)} · {lecture.startTime}–{lecture.endTime}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      lecture.attendanceStatus === 'attended'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lecture.attendanceStatus === 'missed'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {lecture.attendanceStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{lecture.topic || 'Untitled lecture'}</p>
                {lecture.description && <p className="mt-0.5 text-xs text-muted">{lecture.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Files & Materials</h2>
          <Link to="/notes" className="text-xs font-semibold text-[#FF6433] hover:underline">
            All Library Files
          </Link>
        </div>
        {materials.length === 0 ? (
          <p className="text-sm text-muted">No files uploaded for this subject yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {materials.map((file) => (
              <a
                key={file.id}
                href={file.downloadURL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:bg-paper transition"
              >
                <FileText size={18} className="text-[#5B4BD8] shrink-0" />
                <span className="text-sm font-semibold text-ink truncate">{file.fileName}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold text-ink">Course Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted">No assignments for this subject.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Due: {item.deadline ? formatShortDate(item.deadline) : 'No deadline'}
                  </p>
                </div>
                <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-bold capitalize text-ink">
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {tests.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-ink">Upcoming Tests</h2>
          <div className="space-y-2">
            {tests.map((item) => (
              <div key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3">
                <p className="text-sm font-bold text-rose-900">{item.title}</p>
                <p className="text-xs text-rose-700 mt-0.5">Scheduled: {formatShortDate(item.dateTime)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
