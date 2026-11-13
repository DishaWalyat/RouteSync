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
import { createReminder, deleteReminder, updateReminder, type ReminderInput } from '../services/reminders.ts'
import { REMINDER_TYPES, type Reminder, type ReminderType } from '../types/academic.ts'
import { subjectName } from '../utils/academic.ts'
import { formatWhen, nowLocalStamp } from '../utils/dates.ts'
import { getErrorMessage } from '../utils/errors.ts'

const typeLabel: Record<ReminderType, string> = {
  assignment: 'Assignment',
  test: 'Test',
  revision: 'Revision',
  notes: 'Incomplete notes',
  custom: 'Custom',
}

function blank(subjectId = ''): ReminderInput {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return { title: '', description: '', type: 'custom', subjectId, dateTime: stamp, isCompleted: false }
}

export function RemindersPage() {
  const data = useAcademic()
  const { user } = useAuth()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState<ReminderInput | null>(null)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.get('new') === '1' && !data.loading) {
      setEditing(null)
      setDraft(blank(data.subjects[0]?.id ?? ''))
      const next = new URLSearchParams(params)
      next.delete('new')
      setParams(next, { replace: true })
    }
  }, [params, data.loading, data.subjects, setParams])

  const now = nowLocalStamp()
  const items = [...data.reminders].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || a.dateTime.localeCompare(b.dateTime))

  function open(item?: Reminder) {
    setEditing(item ?? null)
    setDraft(item ? { title: item.title, description: item.description, type: item.type, subjectId: item.subjectId, dateTime: item.dateTime, isCompleted: item.isCompleted } : blank(data.subjects[0]?.id ?? ''))
    setError('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (!draft.title.trim()) return setError('Enter a title.')
    if (!draft.dateTime) return setError('Choose a date and time.')
    setSaving(true)
    const input = { ...draft, title: draft.title.trim(), description: draft.description.trim() }
    try {
      if (editing) await updateReminder(user.uid, editing.id, input)
      else await createReminder(user.uid, input)
      notify(editing ? 'Reminder updated.' : 'Reminder added.')
      setDraft(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save this reminder.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(item: Reminder) {
    if (!user) return
    try {
      await updateReminder(user.uid, item.id, { isCompleted: !item.isCompleted })
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update this reminder.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Reminders"
        description="In-app reminders for deadlines, tests, revision, and unfinished notes. They stay in LifeLog and do not send phone or email alerts."
        action={<Button onClick={() => open()}>Add reminder</Button>}
      />
      {items.length === 0 ? <EmptyState title="No reminders">Add one for a deadline, test, or revision session.</EmptyState> : (
        <div className="space-y-2">
          {items.map((item) => {
            const due = !item.isCompleted && item.dateTime && item.dateTime < now
            return (
              <article
                key={item.id}
                className={`rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-sm ${
                  due ? 'border-danger/40 bg-rose-50/20' : 'border-line'
                } ${item.isCompleted ? 'opacity-60 bg-paper/50' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {typeLabel[item.type]} · {formatWhen(item.dateTime)}
                      {item.subjectId ? ` · ${subjectName(data.subjects, item.subjectId)}` : ''}
                      {due ? ' · due' : ''}
                    </p>
                    {item.description && <p className="mt-2 text-sm text-muted">{item.description}</p>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="px-3 py-1.5" onClick={() => toggle(item)}>{item.isCompleted ? 'Reopen' : 'Complete'}</Button>
                  <Button variant="ghost" onClick={() => open(item)}>Edit</Button>
                  <Button variant="ghost" onClick={async () => {
                    if (!user) return
                    try {
                      await deleteReminder(user.uid, item.id)
                      notify('Reminder deleted.')
                    } catch (err) {
                      notify(getErrorMessage(err, 'Could not delete this reminder.'), 'error')
                    }
                  }}>Delete</Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {draft && (
        <Modal title={editing ? 'Edit reminder' : 'Add reminder'} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <TextInput id="title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <SelectInput id="type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as ReminderType })}>
                {REMINDER_TYPES.map((type) => <option key={type} value={type}>{typeLabel[type]}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="when">Date and time</Label>
              <TextInput id="when" type="datetime-local" value={draft.dateTime} onChange={(event) => setDraft({ ...draft, dateTime: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <SelectInput id="subject" value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
                <option value="">None</option>
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <TextArea id="description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <FieldError>{error}</FieldError>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
