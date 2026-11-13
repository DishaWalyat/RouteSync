import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/Button.tsx'
import { FieldError, Label, SelectInput, TextInput } from './ui/Field.tsx'
import { Modal } from './ui/Modal.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createSlot, deleteSlot, updateSlot } from '../services/timetable.ts'
import type { Subject, TimetableSlot } from '../types/academic.ts'
import { subjectName } from '../utils/academic.ts'
import { WEEKDAYS, WEEK_ORDER } from '../utils/dates.ts'
import { getErrorMessage } from '../utils/errors.ts'

type Draft = {
  subjectId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  lectureNumber: string
}

const empty = (subjectId = ''): Draft => ({
  subjectId,
  dayOfWeek: '1',
  startTime: '09:00',
  endTime: '10:00',
  room: '',
  lectureNumber: '',
})

export function TimetablePanel({ subjects, slots }: { subjects: Subject[]; slots: TimetableSlot[] }) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableSlot | null>(null)
  const [draft, setDraft] = useState<Draft>(empty(subjects[0]?.id ?? ''))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  function begin(slot?: TimetableSlot) {
    setEditing(slot ?? null)
    setDraft(slot ? {
      subjectId: slot.subjectId,
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      lectureNumber: slot.lectureNumber,
    } : empty(subjects[0]?.id ?? ''))
    setError('')
    setOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (!draft.subjectId) {
      setError('Add a subject before building a timetable.')
      return
    }
    if (draft.endTime <= draft.startTime) {
      setError('End time must be after the start time.')
      return
    }
    setSaving(true)
    const input = {
      subjectId: draft.subjectId,
      dayOfWeek: Number(draft.dayOfWeek),
      startTime: draft.startTime,
      endTime: draft.endTime,
      room: draft.room.trim(),
      lectureNumber: draft.lectureNumber.trim(),
    }
    try {
      if (editing) await updateSlot(user.uid, editing.id, input)
      else await createSlot(user.uid, input)
      notify(editing ? 'Class updated.' : 'Class added to the timetable.')
      setOpen(false)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save this class.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmRemove() {
    if (!user || !removeId) return
    try {
      await deleteSlot(user.uid, removeId)
      notify('Timetable entry removed.')
      setRemoveId(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete this class.'), 'error')
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Weekly timetable</h2>
        <Button type="button" onClick={() => begin()} disabled={subjects.length === 0}>Add class</Button>
      </div>
      {subjects.length === 0 ? (
        <p className="text-sm text-muted">Create a subject first, then add it to a day and time.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {WEEK_ORDER.map((day) => {
            const items = slots.filter((slot) => slot.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
            return (
              <div key={day}>
                <p className="text-xs tracking-wide text-muted">{WEEKDAYS[day]?.toUpperCase()}</p>
                {items.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No classes</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {items.map((slot) => (
                      <li key={slot.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                        <div>
                          <p className="text-sm">{subjectName(subjects, slot.subjectId)}</p>
                          <p className="text-xs text-muted">
                            {slot.startTime}–{slot.endTime}
                            {slot.room ? ` · ${slot.room}` : ''}
                            {slot.lectureNumber ? ` · ${slot.lectureNumber}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" className="rounded-lg p-2 text-muted hover:text-ink" onClick={() => begin(slot)} aria-label="Edit class"><Pencil size={15} /></button>
                          <button type="button" className="rounded-lg p-2 text-muted hover:text-danger" onClick={() => setRemoveId(slot.id)} aria-label="Delete class"><Trash2 size={15} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
      {open && (
        <Modal title={editing ? 'Edit class' : 'Add class'} onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label htmlFor="slot-subject">Subject</Label>
              <SelectInput id="slot-subject" value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="slot-day">Day</Label>
              <SelectInput id="slot-day" value={draft.dayOfWeek} onChange={(event) => setDraft({ ...draft, dayOfWeek: event.target.value })}>
                {WEEK_ORDER.map((day) => <option key={day} value={day}>{WEEKDAYS[day]}</option>)}
              </SelectInput>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="slot-start">Start</Label>
                <TextInput id="slot-start" type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} />
              </div>
              <div>
                <Label htmlFor="slot-end">End</Label>
                <TextInput id="slot-end" type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="slot-room">Room</Label>
              <TextInput id="slot-room" value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="slot-number">Lecture number</Label>
              <TextInput id="slot-number" value={draft.lectureNumber} onChange={(event) => setDraft({ ...draft, lectureNumber: event.target.value })} placeholder="Optional" />
            </div>
            <FieldError>{error}</FieldError>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
      {removeId && (
        <Modal title="Remove this class?" onClose={() => setRemoveId(null)}>
          <p className="text-muted">Logged lectures stay in your class log.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemoveId(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmRemove}>Delete</Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
