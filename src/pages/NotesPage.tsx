import { useMemo, useState, type FormEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Presentation,
  Search,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { EmptyState, LoadingState } from '../components/EmptyState.tsx'
import { Label, SelectInput, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { addMaterial, deleteMaterial } from '../services/materials.ts'
import type { Material, SharedMaterial } from '../types/academic.ts'
import { subjectName } from '../utils/academic.ts'
import { formatShortDate } from '../utils/dates.ts'
import { getErrorMessage } from '../utils/errors.ts'
import { fileKind, formatBytes } from '../utils/files.ts'

const ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp'
const PAGE_SIZE_OPTIONS = [6, 12, 24]

export function NotesPage() {
  const data = useAcademic()
  const { user } = useAuth()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [subjectId, setSubjectId] = useState('all')
  const [kind, setKind] = useState('all')
  const [uploadSubject, setUploadSubject] = useState('')
  const [preview, setPreview] = useState<Material | SharedMaterial | null>(null)
  const [saving, setSaving] = useState(false)

  // Pagination states
  const [filePage, setFilePage] = useState(1)
  const [filePageSize, setFilePageSize] = useState(6)
  const [lecturePage, setLecturePage] = useState(1)
  const [lecturePageSize, setLecturePageSize] = useState(6)

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...data.materials]
      .filter((file) => {
        if (subjectId !== 'all' && file.subjectId !== subjectId) return false
        const type = fileKind(file.fileName)
        if (kind !== 'all' && type !== kind) return false
        if (!needle) return true
        const lecture = data.lectures.find((item) => item.id === file.lectureId)
        const haystack = [
          file.fileName,
          subjectName(data.subjects, file.subjectId),
          lecture?.topic,
          lecture?.description,
          file.uploadedAt.slice(0, 10),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(needle)
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  }, [data.materials, data.lectures, data.subjects, query, subjectId, kind])

  const filteredSharedMaterials = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...data.sharedMaterials].filter((file) => {
      if (subjectId !== 'all' && file.subjectId !== subjectId) return false
      if (!needle) return true
      return [file.title, file.fileName, file.subjectName, file.uploadedByName]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [data.sharedMaterials, query, subjectId])

  const lectures = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...data.lectures]
      .filter((lecture) => lecture.topic.trim() || lecture.description.trim())
      .filter((lecture) => subjectId === 'all' || lecture.subjectId === subjectId)
      .filter((lecture) => {
        if (!needle) return true
        return [
          lecture.topic,
          lecture.description,
          lecture.date,
          subjectName(data.subjects, lecture.subjectId),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data.lectures, data.subjects, query, subjectId])

  // Pagination slices
  const totalFilePages = Math.max(1, Math.ceil(rows.length / filePageSize))
  const paginatedFiles = useMemo(() => {
    const start = (filePage - 1) * filePageSize
    return rows.slice(start, start + filePageSize)
  }, [rows, filePage, filePageSize])

  const totalLecturePages = Math.max(1, Math.ceil(lectures.length / lecturePageSize))
  const paginatedLectures = useMemo(() => {
    const start = (lecturePage - 1) * lecturePageSize
    return lectures.slice(start, start + lecturePageSize)
  }, [lectures, lecturePage, lecturePageSize])

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const input = event.currentTarget.elements.namedItem('files') as HTMLInputElement
    const files = Array.from(input.files ?? [])
    if (!uploadSubject) {
      notify('Choose a subject.', 'error')
      return
    }
    if (files.length === 0) return
    setSaving(true)
    try {
      for (const file of files) await addMaterial(user.uid, file, uploadSubject)
      notify(files.length === 1 ? 'File uploaded to cloud storage.' : 'Files uploaded to cloud storage.')
      input.value = ''
      setFilePage(1)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not upload that file.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(file: Material) {
    if (!user) return
    try {
      await deleteMaterial(user.uid, file)
      if (preview?.id === file.id) setPreview(null)
      notify('File deleted from cloud storage.')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete that file.'), 'error')
    }
  }

  if (data.loading) return <LoadingState />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notes & Materials"
        description="Lecture notes and files, organized by subject with real-time cloud synchronization."
      />

      {/* Upload Box */}
      <form
        onSubmit={upload}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <Label htmlFor="upload-subject">Subject</Label>
          <SelectInput
            id="upload-subject"
            value={uploadSubject}
            onChange={(event) => setUploadSubject(event.target.value)}
          >
            <option value="">Choose a subject</option>
            {data.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <Label htmlFor="files">Upload PDF, PPT, DOC, or Image (&lt; 20MB)</Label>
          <TextInput id="files" name="files" type="file" multiple accept={ACCEPT} />
        </div>
        <div className="flex items-end">
          <Button type="submit" loading={saving} disabled={data.subjects.length === 0}>
            Upload to Cloud
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <TextInput
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setFilePage(1)
              setLecturePage(1)
            }}
            placeholder="Search topic, file, or date"
            aria-label="Search notes"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <SelectInput
          value={subjectId}
          onChange={(event) => {
            setSubjectId(event.target.value)
            setFilePage(1)
            setLecturePage(1)
          }}
          aria-label="Filter by subject"
        >
          <option value="all">All subjects</option>
          {data.subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          value={kind}
          onChange={(event) => {
            setKind(event.target.value)
            setFilePage(1)
          }}
          aria-label="Filter by file type"
        >
          <option value="all">All types</option>
          <option value="pdf">PDF</option>
          <option value="slides">Slides (PPT/PPTX)</option>
          <option value="doc">Documents (DOC/DOCX)</option>
          <option value="image">Images</option>
        </SelectInput>
      </div>

      {/* Official Course Materials Section */}
      {filteredSharedMaterials.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-100 text-amber-800">
              <GraduationCap size={14} />
            </span>
            <h2 className="font-display text-2xl">Official Course Materials</h2>
            <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              Published by Faculty
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSharedMaterials.map((file) => (
              <article key={file.id} className="flex gap-3 rounded-2xl border border-line bg-amber-50/30 p-4">
                <FileIcon name={file.fileName} />
                <div className="min-w-0 flex-1">
                  <span className="rounded bg-accent-soft px-1.5 py-0.2 text-[10px] font-medium text-accent">
                    {file.subjectName}
                  </span>
                  <p className="truncate text-sm font-medium text-ink mt-0.5" title={file.title}>
                    {file.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatBytes(file.fileSize)} · By {file.uploadedByName}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <button type="button" className="text-accent" onClick={() => setPreview(file)}>
                      Preview
                    </button>
                    <a
                      className="text-muted hover:text-ink"
                      href={file.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Lecture Notes (Paginated) */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl">Lecture Notes</h2>
            <span className="text-xs text-muted">({lectures.length} recorded)</span>
          </div>
          {lectures.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Per page:</span>
              <select
                value={lecturePageSize}
                onChange={(e) => {
                  setLecturePageSize(Number(e.target.value))
                  setLecturePage(1)
                }}
                className="rounded border border-line bg-white px-1.5 py-0.5 text-xs text-ink"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 border border-line rounded-lg bg-white px-1 py-0.5 ml-2">
                <button
                  type="button"
                  disabled={lecturePage <= 1}
                  onClick={() => setLecturePage((p) => Math.max(1, p - 1))}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Previous notes page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-1 text-xs text-muted">
                  {lecturePage} / {totalLecturePages}
                </span>
                <button
                  type="button"
                  disabled={lecturePage >= totalLecturePages}
                  onClick={() => setLecturePage((p) => Math.min(totalLecturePages, p + 1))}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Next notes page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {lectures.length === 0 ? (
          <EmptyState title="No notes match">
            Log a topic from the class log, or widen the filters.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {paginatedLectures.map((lecture) => (
              <article key={lecture.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                <p className="text-xs text-muted">
                  {subjectName(data.subjects, lecture.subjectId)} · {formatShortDate(lecture.date)}
                </p>
                <h3 className="mt-1 font-medium">{lecture.topic || 'Untitled lecture'}</h3>
                {lecture.description && <p className="mt-1 text-sm text-muted">{lecture.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Files Section (Paginated) */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl">Uploaded Files & Documents</h2>
            <span className="text-xs text-muted">({rows.length} files)</span>
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Per page:</span>
              <select
                value={filePageSize}
                onChange={(e) => {
                  setFilePageSize(Number(e.target.value))
                  setFilePage(1)
                }}
                className="rounded border border-line bg-white px-1.5 py-0.5 text-xs text-ink"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 border border-line rounded-lg bg-white px-1 py-0.5 ml-2">
                <button
                  type="button"
                  disabled={filePage <= 1}
                  onClick={() => setFilePage((p) => Math.max(1, p - 1))}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Previous files page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-1 text-xs text-muted">
                  {filePage} / {totalFilePages}
                </span>
                <button
                  type="button"
                  disabled={filePage >= totalFilePages}
                  onClick={() => setFilePage((p) => Math.min(totalFilePages, p + 1))}
                  className="p-1 text-muted hover:text-ink disabled:opacity-30"
                  aria-label="Next files page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No files yet">
            Upload a PDF, slide deck, document, or image to store securely in Firebase Storage.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {paginatedFiles.map((file) => (
              <article key={file.id} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
                <FileIcon name={file.fileName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.fileName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {subjectName(data.subjects, file.subjectId)} · {formatBytes(file.fileSize)} ·{' '}
                    {formatShortDate(file.uploadedAt)}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <button type="button" className="text-accent" onClick={() => setPreview(file)}>
                      Open Preview
                    </button>
                    <a className="text-muted hover:text-ink" href={file.downloadURL} download={file.fileName}>
                      Download
                    </a>
                    <button type="button" className="text-danger" onClick={() => remove(file)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {preview && (
        <Modal wide title={preview.fileName} onClose={() => setPreview(null)}>
          {fileKind(preview.fileName) === 'image' ? (
            <img src={preview.downloadURL} alt="" className="max-h-[60vh] w-full rounded-xl object-contain" />
          ) : fileKind(preview.fileName) === 'pdf' ? (
            <iframe
              title={preview.fileName}
              src={preview.downloadURL}
              className="h-[60vh] w-full rounded-xl border border-line"
            />
          ) : (
            <div className="rounded-xl border border-line bg-paper p-6 text-center">
              <Presentation className="mx-auto mb-2 text-accent" size={36} />
              <p className="text-sm font-medium text-ink">Presentation / Document Format</p>
              <p className="mt-1 text-xs text-muted">
                This presentation or document is stored in Google Cloud Storage. Download it to view natively in Microsoft PowerPoint, Word, or LibreOffice.
              </p>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted">{formatBytes(preview.fileSize)}</span>
            <a
              href={preview.downloadURL}
              download={preview.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent"
            >
              <Download size={14} /> Download File
            </a>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FileIcon({ name }: { name: string }) {
  const kind = fileKind(name)
  const Icon = kind === 'image' ? ImageIcon : kind === 'slides' ? Presentation : FileText
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
      <Icon size={18} />
    </span>
  )
}
