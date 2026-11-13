import { useState, type FormEvent } from 'react'
import {
  Bell,
  Download,
  FileText,
  Megaphone,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader.tsx'
import { Button } from '../components/ui/Button.tsx'
import { Label, SelectInput, TextArea, TextInput } from '../components/ui/Field.tsx'
import { Modal } from '../components/ui/Modal.tsx'
import { useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { createAnnouncement, deleteAnnouncement } from '../services/announcements.ts'
import { deleteSharedMaterial, uploadAndPublishMaterial } from '../services/sharedMaterials.ts'
import type { Priority, SharedMaterial } from '../types/academic.ts'
import { getErrorMessage } from '../utils/errors.ts'
import { formatBytes } from '../utils/files.ts'
import { formatLongDate } from '../utils/dates.ts'

export function TeacherPortalPage() {
  const { user, profile, role } = useAuth()
  const { subjects, announcements, sharedMaterials } = useAcademic()
  const { notify } = useToast()

  const [activeTab, setActiveTab] = useState<'announcements' | 'materials'>('announcements')
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [materialModal, setMaterialModal] = useState(false)

  // Announcement Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Material Form State
  const [matTitle, setMatTitle] = useState('')
  const [matSubjectId, setMatSubjectId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingMaterial, setUploadingMaterial] = useState(false)

  const authorName = profile?.displayName || user?.displayName || 'Faculty Member'
  const authorEmail = profile?.email || user?.email || ''

  async function handlePublishAnnouncement(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      notify('Please provide both title and content.', 'error')
      return
    }

    setSavingAnnouncement(true)
    try {
      const targetSubject = subjects.find((s) => s.id === subjectId)
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        authorName,
        authorEmail,
        authorRole: role === 'admin' ? 'admin' : 'teacher',
        subjectId: subjectId || undefined,
        subjectName: targetSubject?.name || 'All Subjects',
        priority,
      })
      notify('Announcement published to all enrolled students.')
      setTitle('')
      setContent('')
      setSubjectId('')
      setPriority('medium')
      setAnnouncementModal(false)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not publish announcement.'), 'error')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function handleUploadMaterial(e: FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      notify('Please select a file to upload.', 'error')
      return
    }
    if (!matSubjectId) {
      notify('Please select an assigned subject.', 'error')
      return
    }

    setUploadingMaterial(true)
    try {
      const targetSub = subjects.find((s) => s.id === matSubjectId)
      await uploadAndPublishMaterial({
        file: selectedFile,
        title: matTitle.trim() || selectedFile.name,
        subjectId: matSubjectId,
        subjectName: targetSub?.name || 'General',
        authorUid: user?.uid || 'anonymous',
        authorName,
        authorRole: role === 'admin' ? 'admin' : 'teacher',
      })
      notify('Course material published and accessible to students.')
      setMatTitle('')
      setMatSubjectId('')
      setSelectedFile(null)
      setMaterialModal(false)
    } catch (err) {
      notify(getErrorMessage(err, 'Failed to upload shared material.'), 'error')
    } finally {
      setUploadingMaterial(false)
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await deleteAnnouncement(id)
      notify('Announcement removed.')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not remove announcement.'), 'error')
    }
  }

  async function handleDeleteMaterial(mat: SharedMaterial) {
    try {
      await deleteSharedMaterial(mat)
      notify('Shared material removed.')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete file.'), 'error')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Faculty & Teacher Portal"
            description="Manage course materials, broadcast announcements, and review academic progress."
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAnnouncementModal(true)}>
            <Megaphone size={16} />
            Post announcement
          </Button>
          <Button variant="secondary" onClick={() => setMaterialModal(true)}>
            <Upload size={16} />
            Upload material
          </Button>
        </div>
      </div>

      {/* Role Banner */}
      <div className="rounded-2xl border border-line bg-paper-tint/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 font-semibold">
              T
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Authenticated as <span className="text-amber-700 capitalize font-semibold">{role}</span>: {authorName}
              </p>
              <p className="text-xs text-muted">
                Authorized for academic publication, student submission monitoring, and course resource sharing.
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted">Active subjects</p>
              <p className="font-semibold text-ink">{subjects.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Broadcasts</p>
              <p className="font-semibold text-ink">{announcements.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Shared files</p>
              <p className="font-semibold text-ink">{sharedMaterials.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'announcements'
              ? 'bg-ink text-white'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <Bell size={16} />
          Announcements ({announcements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'materials'
              ? 'bg-ink text-white'
              : 'text-muted hover:bg-white hover:text-ink'
          }`}
        >
          <FileText size={16} />
          Shared Materials ({sharedMaterials.length})
        </button>
      </div>

      {/* Announcements Tab Content */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <Megaphone className="mx-auto mb-2 text-muted" size={32} />
              <p className="font-medium text-ink">No announcements posted yet</p>
              <p className="mt-1 text-sm text-muted">
                Broadcast updates about lectures, upcoming exams, or syllabus revisions to all students.
              </p>
              <Button className="mt-4" onClick={() => setAnnouncementModal(true)}>
                <Plus size={16} /> Create announcement
              </Button>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          item.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : item.priority === 'low'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.priority.toUpperCase()} PRIORITY
                      </span>
                      {item.subjectName && (
                        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent">
                          {item.subjectName}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        Published by {item.authorName} on {item.createdAt ? formatLongDate(item.createdAt) : 'Recently'}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted whitespace-pre-line">{item.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    className="text-muted hover:text-rose-600 p-1"
                    title="Delete announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Materials Tab Content */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {sharedMaterials.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <Upload className="mx-auto mb-2 text-muted" size={32} />
              <p className="font-medium text-ink">No course materials uploaded yet</p>
              <p className="mt-1 text-sm text-muted">
                Publish lecture slides (PPTX), course handouts (PDF), or reference notes.
              </p>
              <Button className="mt-4" onClick={() => setMaterialModal(true)}>
                <Upload size={16} /> Upload file
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sharedMaterials.map((file) => (
                <div key={file.id} className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                        {file.subjectName || 'Course Material'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(file)}
                        className="text-muted hover:text-rose-600"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 className="mt-2 font-medium text-ink text-sm line-clamp-2" title={file.title}>
                      {file.title}
                    </h4>
                    <p className="mt-1 text-xs text-muted">
                      {formatBytes(file.fileSize)} · Uploaded by {file.uploadedByName}
                    </p>
                  </div>
                  <a
                    href={file.downloadURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs font-medium text-ink hover:bg-paper"
                  >
                    <Download size={13} />
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publish Announcement Modal */}
      {announcementModal && (
        <Modal onClose={() => setAnnouncementModal(false)} title="Broadcast Announcement">
          <form onSubmit={handlePublishAnnouncement} className="space-y-4">
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <TextInput
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 Test Scheduled Next Tuesday"
                required
              />
            </div>
            <div>
              <Label htmlFor="ann-subject">Target Subject</Label>
              <SelectInput
                id="ann-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">All Subjects (Campus-wide)</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.subjectCode || 'No code'})
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="ann-priority">Priority</Label>
              <SelectInput
                id="ann-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High (Urgent)</option>
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="ann-content">Announcement Body</Label>
              <TextArea
                id="ann-content"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter detailed notice, instructions, or links for students..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setAnnouncementModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={savingAnnouncement}>
                Publish Announcement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Upload Material Modal */}
      {materialModal && (
        <Modal onClose={() => setMaterialModal(false)} title="Upload Course Material">
          <form onSubmit={handleUploadMaterial} className="space-y-4">
            <div>
              <Label htmlFor="mat-sub">Assigned Subject</Label>
              <SelectInput
                id="mat-sub"
                value={matSubjectId}
                onChange={(e) => setMatSubjectId(e.target.value)}
                required
              >
                <option value="">Choose a subject...</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <Label htmlFor="mat-title">Document Title</Label>
              <TextInput
                id="mat-title"
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                placeholder="e.g. Unit 2 Lecture Slides & Question Bank"
              />
            </div>
            <div>
              <Label htmlFor="mat-file">File (PDF, PPT, PPTX, DOC, DOCX, Images &lt; 20MB)</Label>
              <input
                id="mat-file"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent-soft/80"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setMaterialModal(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={uploadingMaterial}>
                Upload and Share
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
