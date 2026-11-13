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
  { to: '/subjects', label: 'Subjects', icon: BookOpen, end: false },
  { to: '/notes', label: 'Notes & Materials', icon: FolderOpen, end: false },
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
  const width = collapsed ? 'md:pl-20' : 'md:pl-64'
  const aside = collapsed ? 'md:w-20' : 'md:w-64'

  async function handleLogout() {
    await signout()
    navigate('/login')
  }

  // Construct links dynamically based on RBAC permissions
  const navLinks = [...baseLinks]
  if (isTeacher) {
    navLinks.push({ to: '/teacher', label: 'Teacher Portal', icon: GraduationCap, end: false })
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
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm text-white font-semibold">
            L
          </span>
        ) : (
          <Brand />
        )}
        <button
          type="button"
          className="hidden text-muted md:grid"
          onClick={() => setCollapsed((value) => !value)}
          aria-label="Collapse sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            title={link.label}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-accent-soft text-accent font-medium' : 'text-muted hover:bg-white hover:text-ink'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <link.icon size={18} />
            {!collapsed && <span className="flex-1">{link.label}</span>}
            {!collapsed && link.to === '/reminders' && openReminders > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">{openReminders}</span>
            )}
            {!collapsed && link.to === '/teacher' && (
              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                PRO
              </span>
            )}
            {!collapsed && link.to === '/admin' && (
              <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-semibold text-purple-800">
                ROOT
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Cloud Connectivity Status */}
      {!collapsed && (
        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg bg-paper px-3 py-1.5 text-xs text-muted border border-line/60">
          <span className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            )}
            <span>{isOnline ? 'Cloud Synced' : 'Offline Cached'}</span>
          </span>
          {isOnline ? <Wifi size={13} className="text-emerald-600" /> : <WifiOff size={13} className="text-amber-600" />}
        </div>
      )}

      {/* User & Role Card */}
      <div className={`mx-3 mb-4 rounded-xl border border-line bg-white p-3 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-ink">{name}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block rounded border px-1.5 py-0.2 text-[10px] font-semibold uppercase ${roleBadgeStyle}`}>
                  {role}
                </span>
                {evaluatorRole && (
                  <span className="text-[10px] text-amber-600 font-medium">(eval)</span>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={`mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-ink ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={14} />
          {!collapsed && 'Log out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${width}`}>
      <aside className={`fixed inset-y-0 left-0 hidden border-r border-line bg-paper md:block ${aside}`}>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-30 md:hidden">
          <button className="absolute inset-0 bg-ink/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r border-line bg-paper">{nav}</aside>
        </div>
      )}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-xs font-semibold uppercase ${roleBadgeStyle}`}>
            {role}
          </span>
          <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
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
