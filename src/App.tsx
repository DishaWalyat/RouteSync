import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.tsx'
import { AppLayout } from './layouts/AppLayout.tsx'
import { AuthLayout } from './layouts/AuthLayout.tsx'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx'
import { LoginPage } from './pages/auth/LoginPage.tsx'
import { SignupPage } from './pages/auth/SignupPage.tsx'
import { AssignmentsPage } from './pages/AssignmentsPage.tsx'
import { CalendarPage } from './pages/CalendarPage.tsx'
import { DailyLogPage } from './pages/DailyLogPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { NotesPage } from './pages/NotesPage.tsx'
import { RemindersPage } from './pages/RemindersPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { SubjectDetailPage } from './pages/SubjectDetailPage.tsx'
import { SubjectsPage } from './pages/SubjectsPage.tsx'
import { SyllabusPage } from './pages/SyllabusPage.tsx'
import { TeacherPortalPage } from './pages/TeacherPortalPage.tsx'
import { AdminPortalPage } from './pages/AdminPortalPage.tsx'
import type { UserRole } from './types/academic.ts'

function Protected({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: UserRole[]
}) {
  const { user, loading, configured, role } = useAuth()
  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <p className="py-24 text-center text-sm text-muted">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return children
}

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<DailyLogPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:id" element={<SubjectDetailPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="syllabus" element={<SyllabusPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="teacher" element={<Protected allowedRoles={['teacher', 'admin']}><TeacherPortalPage /></Protected>} />
        <Route path="admin" element={<Protected allowedRoles={['admin']}><AdminPortalPage /></Protected>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
