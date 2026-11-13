import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { LoadingState } from '../components/EmptyState.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { percent, subjectName } from '../utils/academic.ts'
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
  const tests = data.reminders.filter((item) => item.subjectId === id && item.type === 'test' && !item.isCompleted).sort((a, b) => a.dateTime.localeCompare(b.dateTime))

  return (
    <div className="space-y-8">
      <PageHeader title={subject.name} description={[subject.subjectCode, subject.teacher, subject.semester && `Semester ${subject.semester}`].filter(Boolean).join(' · ')} />
      {subject.description && <p className="text-sm leading-6 text-muted">{subject.description}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Lectures" value={String(lectures.length)} />
        <Stat label="Attended" value={String(attended)} />
        <Stat label="Attendance" value={`${percent(attended, lectures.length)}%`} />
        <Stat label="Syllabus" value={`${percent(done, topics.length)}%`} />
      </div>
      <section>
        <h2 className="mb-3 font-display text-2xl">Lectures</h2>
        {lectures.length === 0 ? <p className="text-sm text-muted">No lectures logged yet.</p> : (
          <div className="space-y-2">
            {lectures.map((lecture) => (
              <Link key={lecture.id} to={`/log?date=${lecture.date}`} className="block rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-xs text-muted">{formatShortDate(lecture.date)} · {lecture.startTime} · {lecture.attendanceStatus}</p>
                <p className="mt-1 text-sm">{lecture.topic || 'Untitled lecture'}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">Notes and materials</h2>
          <Link to="/notes" className="text-sm text-accent">Library</Link>
        </div>
        {materials.length === 0 ? <p className="text-sm text-muted">No files uploaded for this subject.</p> : (
          <ul className="space-y-2">
            {materials.map((file) => (
              <li key={file.id}>
                <a href={file.downloadURL} target="_blank" rel="noreferrer" className="text-sm text-accent">{file.fileName}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-display text-2xl">Assignments</h2>
        {assignments.length === 0 ? <p className="text-sm text-muted">No assignments for this subject.</p> : (
          <ul className="space-y-2 text-sm">
            {assignments.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-white px-4 py-3">
                {item.title} · {item.status.replace('_', ' ')} · {item.deadline ? formatShortDate(item.deadline) : 'No deadline'}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-display text-2xl">Upcoming tests</h2>
        {tests.length === 0 ? <p className="text-sm text-muted">Add a test reminder to see it here.</p> : (
          <ul className="space-y-2 text-sm">
            {tests.map((item) => (
              <li key={item.id}>{item.title} · {formatShortDate(item.dateTime)}</li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-muted">Syllabus progress uses topics marked completed in {subjectName(data.subjects, id)}.</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-4">
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
