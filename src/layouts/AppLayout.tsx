import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  PanelLeft,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Brand } from '../components/Brand.tsx'
import { AcademicProvider, useAcademic } from '../context/AcademicContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'

const baseLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/log', label: 'Daily Class Log', icon: NotebookPen, end: false },
  { to: '/subjects', label: 'Courses & Subjects', icon: BookOpen, end: false },
  { to: '/notes', label: 'Notes & Files', icon: FolderOpen, end: false },
  { to: '/syllabus', label: 'Syllabus Tracker', icon: ListChecks, end: false },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/reminders', label: 'Reminders', icon: Bell, end: false },
]

export function AppLayout() {
  return (
    <AcademicProvider>
      <Shell />
    </AcademicProvider>
  )
}

function Shell() {
  const { user, profile, role, isTeacher, isAdmin, isOnline, evaluatorRole, signout } = useAuth()
  const { reminders } = useAcademic()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const openReminders = reminders.filter((item) => !item.isCompleted).length
  const name = profile?.displayName || user?.displayName || 'Student'
  const width = collapsed ? 'md:pl-20' : 'md:pl-68'
  const aside = collapsed ? 'md:w-20' : 'md:w-68'

  async function handleLogout() {
    await signout()
    navigate('/login')
  }

  // Construct links dynamically based on RBAC permissions
  const navLinks = [...baseLinks]
  if (isTeacher) {
    navLinks.push({ to: '/teacher', label: 'Faculty Portal', icon: GraduationCap, end: false })
  }
  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin Portal', icon: ShieldCheck, end: false })
  }
  navLinks.push({ to: '/settings', label: 'Settings', icon: Settings, end: false })

  const roleBadgeStyle =
    role === 'admin'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : role === 'teacher'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

  const nav = (
    <div className="flex h-full flex-col justify-between py-2">
      <div>
        <div className={`flex items-center gap-2 px-5 py-6 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-[#5B4BD8] to-[#FF6433] text-sm text-white font-extrabold shadow-xs">
              L
            </span>
          ) : (
            <Brand />
          )}
          <button
            type="button"
            className="hidden text-muted hover:text-ink md:grid p-1 rounded-lg transition"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Collapse sidebar"
          >
            <PanelLeft size={18} />
          </button>
        </div>

        <nav className="space-y-1.5 px-3.5 mt-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              title={link.label}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#5B4BD8] text-white shadow-xs'
                    : 'text-muted hover:bg-white hover:text-ink hover:shadow-2xs'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <link.icon size={19} className="shrink-0" />
              {!collapsed && <span className="flex-1">{link.label}</span>}
              {!collapsed && link.to === '/reminders' && openReminders > 0 && (
                <span className="rounded-full bg-[#FF6433] px-2 py-0.5 text-[11px] font-bold text-white">
                  {openReminders}
                </span>
              )}
              {!collapsed && link.to === '/teacher' && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                  FACULTY
                </span>
              )}
              {!collapsed && link.to === '/admin' && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-800">
                  ROOT
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3.5 space-y-2.5">
        {/* Cloud Connectivity Status Pill */}
        {!collapsed && (
          <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3.5 py-2 text-xs text-muted border border-line">
            <span className="flex items-center gap-2 font-medium">
              {isOnline ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
              <span>{isOnline ? 'Cloud Synchronized' : 'Offline Mode (Cached)'}</span>
            </span>
            {isOnline ? (
              <Wifi size={14} className="text-emerald-600" />
            ) : (
              <WifiOff size={14} className="text-amber-600" />
            )}
          </div>
        )}

        {/* User Profile Card */}
        <div className={`rounded-3xl border border-line bg-white p-3.5 shadow-2xs ${collapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#5B4BD8] to-[#FF6433] text-sm font-extrabold text-white shadow-2xs">
              {name.slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[10px] font-bold uppercase ${roleBadgeStyle}`}>
                    {role}
                  </span>
                  {evaluatorRole && (
                    <span className="text-[10px] font-bold text-[#FF6433]">(demo)</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`mt-3 flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-paper hover:text-ink transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={14} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen bg-paper ${width}`}>
      <aside className={`fixed inset-y-0 left-0 hidden border-r border-line bg-white/70 backdrop-blur-md md:block ${aside}`}>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-ink/40 backdrop-blur-xs" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-line bg-white shadow-2xl">{nav}</aside>
        </div>
      )}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/80 px-5 py-3.5 backdrop-blur-md md:hidden">
        <Brand />
        <div className="flex items-center gap-2.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${roleBadgeStyle}`}>
            {role}
          </span>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-line p-1.5 text-ink hover:bg-paper"
            aria-label="Open menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
