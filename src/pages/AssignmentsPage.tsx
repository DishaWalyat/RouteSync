import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { FieldError, Label, SelectInput, TextArea, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createAssignment, deleteAssignment, updateAssignment, type AssignmentInput } from '../services/assignments.ts'
import { addMaterial } from '../services/materials.ts'
import { ASSIGNMENT_STATUSES, PRIORITIES, type Assignment, type AssignmentStatus, type Priority } from '../types/academic.ts'
import { subjectName } from '../utils/academic.ts'
import { formatShortDate, nowLocalStamp, todayInput } from '../utils/dates.ts'
import { getErrorMessage } from '../utils/errors.ts'

const priorityLabel: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
const statusLabel: Record<AssignmentStatus, string> = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' }

function blank(subjectId = ''): AssignmentInput {
  return { subjectId, lectureId: '', title: '', description: '', deadline: `${todayInput()}T23:59`, priority: 'medium', status: 'pending' }
}

export function AssignmentsPage() {
  const data = useAcademic()
  const { user } = useAuth()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState<AssignmentInput | null>(null)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [remove, setRemove] = useState<Assignment | null>(null)
  const now = nowLocalStamp()
  const today = todayInput()

  useEffect(() => {
    if (params.get('new') === '1' && !data.loading) {
      setEditing(null)
      setDraft(blank(data.subjects[0]?.id ?? ''))
      const next = new URLSearchParams(params)
      next.delete('new')
      setParams(next, { replace: true })
    }
  }, [params, data.loading, data.subjects, setParams])

  function open(item?: Assignment) {
    setEditing(item ?? null)
    setDraft(item ? { subjectId: item.subjectId, lectureId: item.lectureId, title: item.title, description: item.description, deadline: item.deadline, priority: item.priority, status: item.status } : blank(data.subjects[0]?.id ?? ''))
    setFiles([])
    setError('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (!draft.subjectId) return setError('Choose a subject.')
    if (!draft.title.trim()) return setError('Enter a title.')
    if (!draft.deadline) return setError('Set a deadline.')
    setSaving(true)
    const input = { ...draft, title: draft.title.trim(), description: draft.description.trim() }
    try {
      const id = editing ? editing.id : await createAssignment(user.uid, input)
      if (editing) await updateAssignment(user.uid, editing.id, input)
      for (const file of files) await addMaterial(user.uid, file, input.subjectId, '', id)
      notify(editing ? 'Assignment updated.' : 'Assignment added.')
      setDraft(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save this assignment.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(item: Assignment, status: AssignmentStatus) {
    if (!user) return
    try {
      await updateAssignment(user.uid, item.id, { status })
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update status.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />

  const openItems = data.assignments.filter((item) => item.status !== 'completed')
  const overdue = openItems.filter((item) => item.deadline && item.deadline < now && item.deadline.slice(0, 10) !== today)
  const dueToday = openItems.filter((item) => item.deadline.slice(0, 10) === today)
  const upcoming = openItems.filter((item) => item.deadline.slice(0, 10) > today).sort((a, b) => a.deadline.localeCompare(b.deadline))
  const completed = data.assignments.filter((item) => item.status === 'completed')

  return (
    <div className="space-y-8">
      <PageHeader title="Assignments" description="Deadlines, priority, and the work still open." action={<Button onClick={() => open()} disabled={data.subjects.length === 0}>Add assignment</Button>} />
      {data.subjects.length === 0 ? <EmptyState title="Add a subject first">Assignments are filed under a subject.</EmptyState> : (
        <>
          <Group title="Overdue" items={overdue} empty="Nothing overdue." onEdit={open} onStatus={setStatus} onDelete={setRemove} />
          <Group title="Due today" items={dueToday} empty="Nothing due today." onEdit={open} onStatus={setStatus} onDelete={setRemove} />
          <Group title="Upcoming" items={upcoming} empty="No upcoming deadlines." onEdit={open} onStatus={setStatus} onDelete={setRemove} />
          <Group title="Completed" items={completed} empty="Completed work will stay here." onEdit={open} onStatus={setStatus} onDelete={setRemove} />
        </>
      )}
      {draft && (
        <Modal wide title={editing ? 'Edit assignment' : 'Add assignment'} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <TextInput id="title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <SelectInput id="subject" value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <TextInput id="deadline" type="datetime-local" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <SelectInput id="priority" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>
                {PRIORITIES.map((item) => <option key={item} value={item}>{priorityLabel[item]}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <SelectInput id="status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AssignmentStatus })}>
                {ASSIGNMENT_STATUSES.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
              </SelectInput>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <TextArea id="description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="files">Files</Label>
              <TextInput id="files" type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
            </div>
            <div className="sm:col-span-2">
              <FieldError>{error}</FieldError>
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Delete this assignment?" onClose={() => setRemove(null)}>
          <p className="text-muted">Its uploaded files are deleted with it.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              if (!user) return
              try {
                await deleteAssignment(user.uid, remove.id)
                notify('Assignment deleted.')
                setRemove(null)
              } catch (err) {
                notify(getErrorMessage(err, 'Could not delete this assignment.'), 'error')
              }
            }}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Group({
  title,
  items,
  empty,
  onEdit,
  onStatus,
  onDelete,
}: {
  title: string
  items: Assignment[]
  empty: string
  onEdit: (item: Assignment) => void
  onStatus: (item: Assignment, status: AssignmentStatus) => void
  onDelete: (item: Assignment) => void
}) {
  const data = useAcademic()
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const subject = data.subjects.find((s) => s.id === item.subjectId)
            return (
              <article
                key={item.id}
                className="rounded-3xl border border-line bg-white p-5 shadow-xs transition hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: subject?.color || '#5B4BD8' }}
                      >
                        {subjectName(data.subjects, item.subjectId)}
                      </span>
                      <span className="text-xs text-muted font-medium">
                        Due: {item.deadline ? formatShortDate(item.deadline) : 'No deadline'}
                      </span>
                    </div>
                    <p className="text-base font-bold text-ink">{item.title}</p>
                    {item.description && <p className="mt-1 text-sm text-muted leading-relaxed">{item.description}</p>}
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                      item.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : item.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {priorityLabel[item.priority]} Priority
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-line/60">
                  <SelectInput
                    className="max-w-44 text-xs font-semibold"
                    value={item.status}
                    aria-label="Assignment status"
                    onChange={(event) => onStatus(item, event.target.value as AssignmentStatus)}
                  >
                    {ASSIGNMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel[status]}
                      </option>
                    ))}
                  </SelectInput>
                  <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1 text-xs text-danger hover:text-danger"
                    onClick={() => onDelete(item)}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
