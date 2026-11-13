import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { FieldError, Label, SelectInput, TextArea, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createSubject, deleteSubject, updateSubject } from '../services/subjects.ts'
import { SUBJECT_COLORS, type Subject } from '../types/academic.ts'
import { percent } from '../utils/academic.ts'
import { getErrorMessage } from '../utils/errors.ts'

type Draft = Omit<Subject, 'id' | 'createdAt'>

function blank(semester = ''): Draft {
  return { name: '', subjectCode: '', teacher: '', semester, color: SUBJECT_COLORS[0], description: '' }
}

export function SubjectsPage() {
  const data = useAcademic()
  const { user, profile } = useAuth()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [remove, setRemove] = useState<Subject | null>(null)

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null)
      setDraft(blank(profile?.semester || ''))
      const next = new URLSearchParams(params)
      next.delete('new')
      setParams(next, { replace: true })
    }
  }, [params, profile?.semester, setParams])

  function open(subject?: Subject) {
    setEditing(subject ?? null)
    setDraft(subject ? {
      name: subject.name,
      subjectCode: subject.subjectCode,
      teacher: subject.teacher,
      semester: subject.semester,
      color: subject.color,
      description: subject.description,
    } : blank(profile?.semester || ''))
    setError('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (!draft.name.trim()) return setError('Enter a subject name.')
    setSaving(true)
    const input = { ...draft, name: draft.name.trim(), subjectCode: draft.subjectCode.trim(), teacher: draft.teacher.trim(), semester: draft.semester.trim(), description: draft.description.trim() }
    try {
      if (editing) await updateSubject(user.uid, editing.id, input)
      else await createSubject(user.uid, input)
      notify(editing ? 'Subject updated.' : 'Subject added.')
      setDraft(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save this subject.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmRemove() {
    if (!user || !remove) return
    try {
      await deleteSubject(user.uid, remove.id)
      notify('Subject and its records were deleted.')
      setRemove(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete this subject.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />
  const subjects = [...data.subjects].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader title="Subjects" description="The courses in this semester." action={<Button onClick={() => open()}>Add subject</Button>} />
      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet">Add the courses you are taking.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((subject) => {
            const topics = data.topics.filter((item) => item.subjectId === subject.id)
            const done = topics.filter((item) => item.status === 'completed').length
            const lectures = data.lectures.filter((item) => item.subjectId === subject.id)
            const attended = lectures.filter((item) => item.attendanceStatus === 'attended').length
            return (
              <div key={subject.id} className="rounded-2xl border border-line bg-white p-4">
                <Link to={`/subjects/${subject.id}`} className="block">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: subject.color }} />
                    {subject.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {subject.subjectCode || 'No code'}
                    {subject.teacher ? ` · ${subject.teacher}` : ''}
                    {subject.semester ? ` · Sem ${subject.semester}` : ''}
                  </p>
                  <p className="mt-3 text-sm text-muted">{attended}/{lectures.length} attended · {percent(done, topics.length)}% syllabus</p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" className="px-3 py-1.5" onClick={() => open(subject)}>Edit</Button>
                  <Button variant="ghost" onClick={() => setRemove(subject)}>Delete</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {draft && (
        <Modal title={editing ? 'Edit subject' : 'Add subject'} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <TextInput id="name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="code">Code</Label>
                <TextInput id="code" value={draft.subjectCode} onChange={(event) => setDraft({ ...draft, subjectCode: event.target.value })} />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <TextInput id="semester" value={draft.semester} onChange={(event) => setDraft({ ...draft, semester: event.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="teacher">Faculty</Label>
              <TextInput id="teacher" value={draft.teacher} onChange={(event) => setDraft({ ...draft, teacher: event.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <SelectInput id="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })}>
                {SUBJECT_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
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
      {remove && (
        <Modal title={`Delete ${remove.name}?`} onClose={() => setRemove(null)}>
          <p className="text-muted">This removes its lectures, files, syllabus, assignments, and reminders. Other subjects are left alone.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmRemove}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
