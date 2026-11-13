import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { TimetablePanel } from '../components/TimetablePanel.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { FieldError, Label, SelectInput, TextArea, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createAssignment } from '../services/assignments.ts'
import { createLecture, deleteLecture, updateLecture, type LectureInput } from '../services/lectures.ts'
import { addMaterial } from '../services/materials.ts'
import { ATTENDANCE, type AttendanceStatus, type Lecture } from '../types/academic.ts'
import { subjectById, subjectName } from '../utils/academic.ts'
import { formatLongDate, parseDateInput, todayInput, WEEKDAYS } from '../utils/dates.ts'
import { getErrorMessage } from '../utils/errors.ts'

const labels: Record<AttendanceStatus, string> = {
  unmarked: 'Not marked',
  attended: 'Attended',
  missed: 'Missed',
  cancelled: 'Cancelled',
}

type Draft = LectureInput & { homeworkDeadline: string }

function blank(date: string, subjectId = ''): Draft {
  return {
    subjectId,
    date,
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    lectureNumber: '',
    topic: '',
    description: '',
    attendanceStatus: 'unmarked',
    homework: '',
    homeworkDeadline: `${date}T23:59`,
  }
}

export function DailyLogPage() {
  const data = useAcademic()
  const { user } = useAuth()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || todayInput()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editing, setEditing] = useState<Lecture | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [remove, setRemove] = useState<Lecture | null>(null)
  const [showTimetable, setShowTimetable] = useState(false)

  const day = parseDateInput(date).getDay()
  const slots = data.timetable.filter((slot) => slot.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const lectures = data.lectures.filter((item) => item.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const matched = useMemo(() => {
    const used = new Set<string>()
    const rows = slots.map((slot) => {
      const lecture = lectures.find((item) => !used.has(item.id) && item.subjectId === slot.subjectId && item.startTime === slot.startTime)
      if (lecture) used.add(lecture.id)
      return { slot, lecture }
    })
    return { rows, extras: lectures.filter((item) => !used.has(item.id)) }
  }, [slots, lectures])

  useEffect(() => {
    if (params.get('new') === '1' && !data.loading) {
      setEditing(null)
      setDraft(blank(date, data.subjects[0]?.id ?? ''))
      setFiles([])
      const next = new URLSearchParams(params)
      next.delete('new')
      setParams(next, { replace: true })
    }
  }, [params, data.loading, data.subjects, date, setParams])

  function openNew(partial?: Partial<Draft>) {
    setEditing(null)
    setDraft({ ...blank(date, data.subjects[0]?.id ?? ''), ...partial })
    setFiles([])
    setError('')
  }

  function openEdit(lecture: Lecture) {
    setEditing(lecture)
    setDraft({ ...lecture, homeworkDeadline: `${lecture.date}T23:59` })
    setFiles([])
    setError('')
  }

  async function mark(existing: Lecture | undefined, status: AttendanceStatus, seed?: Partial<Draft>) {
    if (!user) return
    try {
      if (existing) await updateLecture(user.uid, existing.id, { attendanceStatus: status })
      else if (seed?.subjectId) await createLecture(user.uid, { ...blank(date, seed.subjectId), ...seed, attendanceStatus: status, topic: '', description: '', homework: '' })
      notify(`Marked ${labels[status].toLowerCase()}.`)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update attendance.'), 'error')
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (!draft.subjectId) return setError('Choose a subject.')
    if (!draft.date) return setError('Choose a date.')
    if (draft.endTime <= draft.startTime) return setError('End time must be after the start time.')
    setSaving(true)
    const input: LectureInput = {
      subjectId: draft.subjectId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      room: draft.room.trim(),
      lectureNumber: draft.lectureNumber.trim(),
      topic: draft.topic.trim(),
      description: draft.description.trim(),
      attendanceStatus: draft.attendanceStatus,
      homework: draft.homework.trim(),
    }
    try {
      const lectureId = editing ? editing.id : await createLecture(user.uid, input)
      if (editing) await updateLecture(user.uid, editing.id, input)
      for (const file of files) await addMaterial(user.uid, file, input.subjectId, lectureId)
      if (!editing && input.homework) {
        await createAssignment(user.uid, {
          subjectId: input.subjectId,
          lectureId,
          title: input.homework,
          description: input.topic ? `From ${input.topic}` : '',
          deadline: draft.homeworkDeadline,
          priority: 'medium',
          status: 'pending',
        })
      }
      notify(editing ? 'Lecture updated.' : 'Lecture saved.')
      setDraft(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save this lecture.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!user || !remove) return
    try {
      await deleteLecture(user.uid, remove.id)
      notify('Lecture deleted.')
      setRemove(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete this lecture.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Class Log"
        description={`${formatLongDate(date)} · ${WEEKDAYS[day]}`}
        action={
          <div className="flex flex-wrap gap-2">
            <TextInput type="date" aria-label="Log date" value={date} onChange={(event) => setParams({ date: event.target.value })} />
            <Button variant="secondary" onClick={() => setShowTimetable((value) => !value)}>Timetable</Button>
            <Button onClick={() => openNew()} disabled={data.subjects.length === 0}>Add lecture</Button>
          </div>
        }
      />
      {data.error && <p className="text-sm text-danger">{data.error}</p>}
      {showTimetable && <TimetablePanel subjects={data.subjects} slots={data.timetable} />}
      {data.subjects.length === 0 ? (
        <EmptyState title="Add a subject first">Lectures are organized by subject.</EmptyState>
      ) : slots.length === 0 && lectures.length === 0 ? (
        <EmptyState title="Nothing scheduled for this day">
          <button type="button" className="mt-3 text-accent" onClick={() => setShowTimetable(true)}>Configure the weekly timetable</button>
          <span className="mx-2 text-muted">or</span>
          <button type="button" className="text-accent" onClick={() => openNew()}>add a lecture</button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {matched.rows.map(({ slot, lecture }) => (
            <LectureCard
              key={slot.id}
              lecture={lecture}
              subject={subjectName(data.subjects, slot.subjectId)}
              color={subjectById(data.subjects, slot.subjectId)?.color || '#5B4BD8'}
              time={`${slot.startTime}–${slot.endTime}`}
              room={lecture?.room || slot.room}
              number={lecture?.lectureNumber || slot.lectureNumber}
              files={lecture ? data.materials.filter((item) => item.lectureId === lecture.id).length : 0}
              onMark={(status) => mark(lecture, status, { subjectId: slot.subjectId, startTime: slot.startTime, endTime: slot.endTime, room: slot.room, lectureNumber: slot.lectureNumber, attendanceStatus: status })}
              onEdit={() => lecture ? openEdit(lecture) : openNew({ subjectId: slot.subjectId, startTime: slot.startTime, endTime: slot.endTime, room: slot.room, lectureNumber: slot.lectureNumber, attendanceStatus: 'unmarked' })}
              onDelete={lecture ? () => setRemove(lecture) : undefined}
            />
          ))}
          {matched.extras.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              subject={subjectName(data.subjects, lecture.subjectId)}
              color={subjectById(data.subjects, lecture.subjectId)?.color || '#5B4BD8'}
              time={`${lecture.startTime}–${lecture.endTime}`}
              room={lecture.room}
              number={lecture.lectureNumber}
              files={data.materials.filter((item) => item.lectureId === lecture.id).length}
              onMark={(status) => mark(lecture, status)}
              onEdit={() => openEdit(lecture)}
              onDelete={() => setRemove(lecture)}
            />
          ))}
        </div>
      )}

      {draft && (
        <Modal wide title={editing ? 'Edit lecture' : 'Add lecture'} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <SelectInput id="subject" value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <TextInput id="date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="status">Attendance</Label>
              <SelectInput id="status" value={draft.attendanceStatus} onChange={(event) => setDraft({ ...draft, attendanceStatus: event.target.value as AttendanceStatus })}>
                {ATTENDANCE.map((status) => <option key={status} value={status}>{labels[status]}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="start">Start</Label>
              <TextInput id="start" type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <TextInput id="end" type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="room">Room</Label>
              <TextInput id="room" value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="number">Lecture number</Label>
              <TextInput id="number" value={draft.lectureNumber} onChange={(event) => setDraft({ ...draft, lectureNumber: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="topic">Topic</Label>
              <TextInput id="topic" value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">What was taught</Label>
              <TextArea id="description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="homework">Homework</Label>
              <TextInput id="homework" value={draft.homework} onChange={(event) => setDraft({ ...draft, homework: event.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="homework-due">Homework deadline</Label>
              <TextInput id="homework-due" type="datetime-local" value={draft.homeworkDeadline} onChange={(event) => setDraft({ ...draft, homeworkDeadline: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="files">Attachments</Label>
              <TextInput id="files" type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp,image/*,application/pdf" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
            </div>
            <div className="sm:col-span-2">
              <FieldError>{error}</FieldError>
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save lecture</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Delete this lecture?" onClose={() => setRemove(null)}>
          <p className="text-muted">Notes stay removed with the lecture. Files uploaded for it are deleted too.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function LectureCard({
  lecture,
  subject,
  color,
  time,
  room,
  number,
  files,
  onMark,
  onEdit,
  onDelete,
}: {
  lecture?: Lecture
  subject: string
  color: string
  time: string
  room: string
  number: string
  files: number
  onMark: (status: AttendanceStatus) => void
  onEdit: () => void
  onDelete?: () => void
}) {
  const status = lecture?.attendanceStatus || 'unmarked'
  const statusBadgeStyle =
    status === 'attended'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'missed'
      ? 'bg-rose-100 text-rose-700'
      : status === 'cancelled'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-paper text-muted'

  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-bold text-ink">
            <span className="h-3 w-3 rounded-full ring-2 ring-white shrink-0" style={{ background: color }} />
            {subject}
          </p>
          <p className="mt-1 text-xs text-muted font-medium">
            {time}
            {number ? ` · ${number}` : ''}
            {room ? ` · Room ${room}` : ''}
          </p>
        </div>
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusBadgeStyle}`}>
          {labels[status]}
        </span>
      </div>
      {lecture?.topic && <h3 className="mt-3 text-base font-bold text-ink">{lecture.topic}</h3>}
      {lecture?.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted leading-relaxed">{lecture.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted font-medium">
        {files > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-[#5B4BD8] px-2 py-0.5 font-semibold">
            <Paperclip size={12} />
            {files} file{files === 1 ? '' : 's'}
          </span>
        )}
        {lecture?.homework && (
          <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 font-semibold">
            Assignment
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
        {(['attended', 'missed', 'cancelled'] as const).map((item) => (
          <Button
            key={item}
            type="button"
            variant={status === item ? 'primary' : 'secondary'}
            className="px-3 py-1 text-xs"
            onClick={() => onMark(item)}
          >
            {labels[item]}
          </Button>
        ))}
        <Button type="button" variant="ghost" className="px-3 py-1 text-xs" onClick={onEdit}>
          {lecture ? 'Edit Notes' : 'Add Notes'}
        </Button>
        {onDelete && (
          <Button type="button" variant="ghost" className="px-3 py-1 text-xs text-danger hover:text-danger" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </article>
  )
}
