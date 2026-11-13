import { useMemo, useState, type FormEvent } from 'react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { SelectInput, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createTopic, createUnit, deleteTopic, deleteUnit, setTopicStatus, updateTopic, updateUnit } from '../services/syllabus.ts'
import { TOPIC_STATUSES, type TopicStatus } from '../types/academic.ts'
import { percent } from '../utils/academic.ts'
import { getErrorMessage } from '../utils/errors.ts'

const statusLabel: Record<TopicStatus, string> = { pending: 'Pending', ongoing: 'Ongoing', completed: 'Completed' }

export function SyllabusPage() {
  const data = useAcademic()
  const { user } = useAuth()
  const { notify } = useToast()
  const [subjectId, setSubjectId] = useState('')
  const [unitTitle, setUnitTitle] = useState('')
  const [removeUnit, setRemoveUnit] = useState<string | null>(null)
  const activeSubject = subjectId || data.subjects[0]?.id || ''

  const units = useMemo(
    () => data.units.filter((unit) => unit.subjectId === activeSubject).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    [data.units, activeSubject],
  )
  const topics = data.topics.filter((topic) => topic.subjectId === activeSubject)
  const done = topics.filter((topic) => topic.status === 'completed').length
  const ongoing = topics.filter((topic) => topic.status === 'ongoing').length
  const pending = topics.filter((topic) => topic.status === 'pending')

  async function addUnit(event: FormEvent) {
    event.preventDefault()
    if (!user || !activeSubject || !unitTitle.trim()) return
    try {
      await createUnit(user.uid, activeSubject, unitTitle.trim(), units.length)
      setUnitTitle('')
      notify('Unit added.')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not add this unit.'), 'error')
    }
  }

  async function renameUnit(id: string, title: string) {
    if (!user || !title.trim()) return
    try {
      await updateUnit(user.uid, id, title.trim())
    } catch (err) {
      notify(getErrorMessage(err, 'Could not rename this unit.'), 'error')
    }
  }

  async function addTopic(unitId: string, title: string) {
    if (!user || !title.trim()) return
    const order = topics.filter((topic) => topic.unitId === unitId).length
    try {
      await createTopic(user.uid, activeSubject, unitId, title.trim(), order)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not add this topic.'), 'error')
    }
  }

  async function changeStatus(id: string, status: TopicStatus) {
    if (!user) return
    try {
      await setTopicStatus(user.uid, id, status)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update this topic.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />

  return (
    <div className="space-y-6">
      <PageHeader title="Syllabus Tracker" description="Mark each topic as you cover it. Progress is completed topics divided by all topics." />
      {data.subjects.length === 0 ? (
        <EmptyState title="Add a subject first">Syllabus units belong to a subject.</EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
            <SelectInput value={activeSubject} onChange={(event) => setSubjectId(event.target.value)} aria-label="Subject">
              {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </SelectInput>
            <div className="rounded-2xl border border-line bg-white px-4 py-3">
              <div className="flex justify-between text-sm">
                <span>{percent(done, topics.length)}% complete</span>
                <span className="text-muted">{done} done · {ongoing} ongoing · {pending.length} pending</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
                <div className="h-full bg-accent" style={{ width: `${percent(done, topics.length)}%` }} />
              </div>
            </div>
          </div>
          <form onSubmit={addUnit} className="flex gap-2">
            <TextInput value={unitTitle} onChange={(event) => setUnitTitle(event.target.value)} placeholder="New unit title" aria-label="New unit title" />
            <Button type="submit">Add unit</Button>
          </form>
          {units.length === 0 ? <EmptyState title="No units yet">Add the first unit of this subject.</EmptyState> : (
            <div className="space-y-4">
              {units.map((unit) => {
                const unitTopics = topics.filter((topic) => topic.unitId === unit.id).sort((a, b) => a.order - b.order)
                const unitDone = unitTopics.filter((topic) => topic.status === 'completed').length
                return (
                  <section key={unit.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-center gap-2">
                      <TextInput defaultValue={unit.title} aria-label="Unit title" onBlur={(event) => { if (event.target.value !== unit.title) void renameUnit(unit.id, event.target.value) }} />
                      <Button type="button" variant="ghost" onClick={() => setRemoveUnit(unit.id)}>Delete</Button>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                      <div className="h-full bg-accent" style={{ width: `${percent(unitDone, unitTopics.length)}%` }} />
                    </div>
                    <ul className="mt-3 space-y-2">
                      {unitTopics.map((topic) => (
                        <li key={topic.id} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                          <TextInput defaultValue={topic.title} aria-label="Topic title" onBlur={(event) => { if (user && event.target.value.trim() && event.target.value !== topic.title) void updateTopic(user.uid, topic.id, event.target.value.trim()).catch((err) => notify(getErrorMessage(err), 'error')) }} />
                          <SelectInput value={topic.status} aria-label="Topic status" onChange={(event) => changeStatus(topic.id, event.target.value as TopicStatus)}>
                            {TOPIC_STATUSES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
                          </SelectInput>
                          <Button type="button" variant="ghost" onClick={() => user && deleteTopic(user.uid, topic.id).catch((err) => notify(getErrorMessage(err), 'error'))}>Remove</Button>
                        </li>
                      ))}
                    </ul>
                    <TopicAdder onAdd={(title) => addTopic(unit.id, title)} />
                  </section>
                )
              })}
            </div>
          )}
          <section>
            <h2 className="mb-2 font-display text-2xl">Not covered yet</h2>
            {pending.length === 0 ? <p className="text-sm text-muted">Every topic is ongoing or completed.</p> : (
              <ul className="space-y-1 text-sm text-muted">
                {pending.map((topic) => <li key={topic.id}>{topic.title}</li>)}
              </ul>
            )}
          </section>
        </>
      )}
      {removeUnit && (
        <Modal title="Delete this unit?" onClose={() => setRemoveUnit(null)}>
          <p className="text-muted">Its topics are deleted with it.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemoveUnit(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              if (!user) return
              try {
                await deleteUnit(user.uid, removeUnit)
                notify('Unit deleted.')
                setRemoveUnit(null)
              } catch (err) {
                notify(getErrorMessage(err, 'Could not delete this unit.'), 'error')
              }
            }}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TopicAdder({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim()) return
        onAdd(title)
        setTitle('')
      }}
    >
      <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a topic" aria-label="New topic" />
      <Button type="submit" variant="secondary">Add</Button>
    </form>
  )
}
