import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { FieldError, Label, TextArea, TextInput } from '../components/ui/Field.tsx'
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
    setDraft(
      subject
        ? {
            name: subject.name,
            subjectCode: subject.subjectCode,
            teacher: subject.teacher,
            semester: subject.semester,
            color: subject.color,
            description: subject.description,
          }
        : blank(profile?.semester || ''),
    )
    setError('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user || !draft) return
    if (!draft.name.trim()) return setError('Enter a subject name.')
    setSaving(true)
    try {
      if (editing) {
        await updateSubject(user.uid, editing.id, draft)
        notify('Subject updated.')
      } else {
        await createSubject(user.uid, draft)
        notify('Subject added to semester.')
      }
      setDraft(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this subject.'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmRemove() {
    if (!user || !remove) return
    try {
      await deleteSubject(user.uid, remove.id)
      setRemove(null)
      notify('Subject removed.')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete this subject.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />
  const subjects = [...data.subjects].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Courses & Subjects"
          description="Manage academic courses, faculty, and progress tracking for this semester."
        />
        <Button onClick={() => open()}>
          <Plus size={16} />
          Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects added yet">
          Add the courses you are currently studying this term to start tracking notes and syllabus progress.
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const topics = data.topics.filter((item) => item.subjectId === subject.id)
            const done = topics.filter((item) => item.status === 'completed').length
            const lectures = data.lectures.filter((item) => item.subjectId === subject.id)
            const attended = lectures.filter((item) => item.attendanceStatus === 'attended').length
            const progress = percent(done, topics.length)

            return (
              <div
                key={subject.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-2xs"
                      style={{ background: subject.color || '#5B4BD8' }}
                    >
                      {subject.subjectCode || 'COURSE'}
                    </span>
                    {subject.semester && (
                      <span className="text-xs font-bold text-muted bg-paper px-2.5 py-0.5 rounded-full">
                        Sem {subject.semester}
                      </span>
                    )}
                  </div>

                  <Link to={`/subjects/${subject.id}`} className="block mt-4">
                    <h3 className="font-display text-2xl font-bold text-ink group-hover:text-[#5B4BD8] transition">
                      {subject.name}
                    </h3>
                    {subject.teacher && (
                      <p className="mt-1 text-xs font-medium text-muted">
                        Faculty: <span className="text-ink">{subject.teacher}</span>
                      </p>
                    )}
                    {subject.description && (
                      <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                        {subject.description}
                      </p>
                    )}
                  </Link>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60">
                  <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
                    <span>
                      Attended: <strong className="text-ink">{attended}/{lectures.length}</strong>
                    </span>
                    <span>
                      Syllabus: <strong className="text-ink">{progress}%</strong>
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-paper overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: subject.color || '#5B4BD8',
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="rounded-xl bg-paper px-3 py-1.5 text-xs font-bold text-ink hover:bg-[#5B4BD8] hover:text-white transition"
                    >
                      View Details
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => open(subject)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2.5 py-1 text-xs text-danger hover:text-danger"
                        onClick={() => setRemove(subject)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {draft && (
        <Modal title={editing ? 'Edit Subject' : 'Add New Subject'} onClose={() => setDraft(null)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="name">Course Name</Label>
              <TextInput
                id="name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="e.g. Distributed Cloud Computing"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="code">Subject Code</Label>
                <TextInput
                  id="code"
                  value={draft.subjectCode}
                  onChange={(event) => setDraft({ ...draft, subjectCode: event.target.value })}
                  placeholder="e.g. CS501"
                />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <TextInput
                  id="semester"
                  value={draft.semester}
                  onChange={(event) => setDraft({ ...draft, semester: event.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="teacher">Instructor / Faculty</Label>
              <TextInput
                id="teacher"
                value={draft.teacher}
                onChange={(event) => setDraft({ ...draft, teacher: event.target.value })}
                placeholder="e.g. Prof. Alan Turing"
              />
            </div>

            {/* Vibrant Color Selector (Matching User Palette) */}
            <div>
              <Label>Theme Color</Label>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      draft.color === c ? 'scale-125 ring-2 ring-ink ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ background: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Course Description</Label>
              <TextArea
                id="description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Brief course objectives, reference texts, or room information..."
              />
            </div>
            <FieldError>{error}</FieldError>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? 'Save Changes' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {remove && (
        <Modal title={`Delete ${remove.name}?`} onClose={() => setRemove(null)}>
          <p className="text-sm text-muted leading-relaxed">
            This will permanently remove this course along with its associated lectures, files, syllabus units,
            assignments, and reminders.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Delete Course
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
