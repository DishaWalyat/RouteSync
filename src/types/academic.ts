export * from './supplyChain.ts'

export const SUBJECT_COLORS = [
  '#FFC436', // Sunny Golden Yellow (Image 1 & 2 & 3)
  '#FF4D88', // Hot Pink / Magenta (Image 1 & 3)
  '#5B4BD8', // Electric Royal Violet (Image 1 & 3)
  '#4FA8FF', // Sky Blue (Image 1 & 3)
  '#FF6433', // Warm Punchy Coral (Image 1 & 2)
  '#10B981', // Emerald Mint Green (Image 1)
  '#8B5CF6', // Lavender Purple
  '#2C264D', // Midnight Navy Indigo (Image 2 & 3)
] as const

export const ATTENDANCE = ['unmarked', 'attended', 'missed', 'cancelled'] as const
export type AttendanceStatus = (typeof ATTENDANCE)[number]

export const TOPIC_STATUSES = ['pending', 'ongoing', 'completed'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

export const ASSIGNMENT_STATUSES = ['pending', 'in_progress', 'completed'] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const REMINDER_TYPES = ['assignment', 'test', 'revision', 'notes', 'custom'] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export const USER_ROLES = ['student', 'teacher', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type UserProfile = {
  displayName: string
  email: string
  role: UserRole
  createdAt: string
  semester: string
  academicYear: string
  department?: string
}

export type UserAdminView = {
  uid: string
  displayName: string
  email: string
  role: UserRole
  semester: string
  academicYear: string
  createdAt: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  authorName: string
  authorEmail: string
  authorRole: 'teacher' | 'admin'
  subjectId?: string
  subjectName?: string
  priority: Priority
  createdAt: string
}

export type SharedMaterial = {
  id: string
  title: string
  subjectId: string
  subjectName: string
  fileName: string
  fileType: string
  storagePath: string
  downloadURL: string
  fileSize: number
  uploadedByUid: string
  uploadedByName: string
  uploaderRole: 'teacher' | 'admin'
  uploadedAt: string
}

export type SystemConfig = {
  academicYear: string
  currentSemester: string
  institutionName: string
  updatedAt: string
}

export type Subject = {
  id: string
  name: string
  subjectCode: string
  teacher: string
  semester: string
  color: string
  description: string
  createdAt: string
}

export type Lecture = {
  id: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  room: string
  lectureNumber: string
  topic: string
  description: string
  attendanceStatus: AttendanceStatus
  homework: string
  attachmentIds: string[]
  createdAt: string
  updatedAt: string
}

export type TimetableSlot = {
  id: string
  subjectId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
  lectureNumber: string
}

export type Material = {
  id: string
  subjectId: string
  lectureId: string
  assignmentId: string
  fileName: string
  fileType: string
  storagePath: string
  downloadURL: string
  fileSize: number
  uploadedAt: string
}

export type Unit = {
  id: string
  subjectId: string
  title: string
  order: number
}

export type Topic = {
  id: string
  subjectId: string
  unitId: string
  title: string
  status: TopicStatus
  order: number
  updatedAt: string
}

export type Assignment = {
  id: string
  subjectId: string
  lectureId: string
  title: string
  description: string
  deadline: string
  priority: Priority
  status: AssignmentStatus
  attachmentIds: string[]
  createdAt: string
}

export type Reminder = {
  id: string
  title: string
  description: string
  type: ReminderType
  subjectId: string
  dateTime: string
  isCompleted: boolean
  createdAt: string
}
