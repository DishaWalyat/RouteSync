import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Boxes,
  Building2,
  ChevronDown,
  Factory,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Receipt,
  Route as RouteIcon,
  Send,
  Store,
  Truck,
  Users,
} from 'lucide-react'
import { Brand } from '../components/Brand.tsx'
import { SupplyChainProvider, useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import type { UserRole } from '../types/supplyChain.ts'

export function AppLayout() {
  return (
    <SupplyChainProvider>
      <Shell />
    </SupplyChainProvider>
  )
}

function Shell() {
  const { role, evaluatorRole, setEvaluatorRole, signout } = useAuth()
  const { stats } = useSupplyChain()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  // Current active view role (default to URL path or auth role)
  let currentRole: UserRole = evaluatorRole || role || 'manufacturer'
  if (location.pathname.startsWith('/dispatcher')) currentRole = 'transporter'
  else if (location.pathname.startsWith('/warehouse')) currentRole = 'warehouse_manager'
  else if (location.pathname.startsWith('/retailer')) currentRole = 'retailer'
  else if (location.pathname.startsWith('/manufacturer')) currentRole = 'manufacturer'

  async function handleLogout() {
    await signout()
    navigate('/login')
  }

  function handleSwitchRole(target: UserRole) {
    setEvaluatorRole(target)
    setRoleDropdownOpen(false)
    if (target === 'manufacturer') navigate('/manufacturer')
    else if (target === 'transporter') navigate('/dispatcher')
    else if (target === 'warehouse_manager') navigate('/warehouse')
    else if (target === 'retailer') navigate('/retailer')
  }

  // Sidebar Role Info Card styling
  const roleCardMeta = {
    manufacturer: {
      label: 'Manufacturer',
      icon: Factory,
      avatarBg: 'bg-[#2563EB]',
      avatarLetter: 'M',
      topPill: 'Manufacturer',
    },
    transporter: {
      label: 'Dispatcher',
      icon: Truck,
      avatarBg: 'bg-[#7C3AED]',
      avatarLetter: 'D',
      topPill: 'Dispatcher',
    },
    warehouse_manager: {
      label: 'Warehouse',
      icon: Building2,
      avatarBg: 'bg-[#EA580C]',
      avatarLetter: 'W',
      topPill: 'Warehouse Hub',
    },
    retailer: {
      label: 'Retailer',
      icon: Store,
      avatarBg: 'bg-[#16A34A]',
      avatarLetter: 'R',
      topPill: 'Retail Store',
    },
    admin: {
      label: 'Administrator',
      icon: LayoutDashboard,
      avatarBg: 'bg-slate-700',
      avatarLetter: 'A',
      topPill: 'Admin',
    },
  }[currentRole] || {
    label: 'Manufacturer',
    icon: Factory,
    avatarBg: 'bg-[#2563EB]',
    avatarLetter: 'M',
    topPill: 'Manufacturer',
  }

  // Exact Sidebar Nav Links per Role from the Reference Slides
  const getNavLinks = () => {
    switch (currentRole) {
      case 'transporter':
        return [
          { to: '/dispatcher', label: 'Dashboard', icon: LayoutDashboard, end: true },
          {
            to: '/dispatcher',
            label: 'Incoming Requests',
            icon: Inbox,
            end: false,
            badge: stats.pendingCarrierPickup || 3,
            badgeColor: 'bg-red-500',
          },
          { to: '/dispatcher#manage', label: 'Dispatch Management', icon: Truck, end: false },
          { to: '/dispatcher#history', label: 'History', icon: History, end: false },
        ]
      case 'warehouse_manager':
        return [
          { to: '/warehouse', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/warehouse#incoming', label: 'Incoming Stock', icon: Boxes, end: false },
          { to: '/warehouse#retailers', label: 'Retailer Management', icon: Users, end: false },
          { to: '/warehouse#create-order', label: 'Create Retailer Order', icon: Send, end: false },
        ]
      case 'retailer':
        return [
          { to: '/retailer', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/retailer', label: 'My Orders', icon: Package, end: false },
          { to: '/retailer#bills', label: 'Bills', icon: Receipt, end: false },
        ]
      case 'manufacturer':
      default:
        return [
          { to: '/manufacturer', label: 'Dashboard', icon: LayoutDashboard, end: true },
          { to: '/manufacturer#products', label: 'My Products', icon: Package, end: false },
          { to: '/manufacturer#create-dispatch', label: 'Create Dispatch', icon: PlusCircle, end: false },
          { to: '/manufacturer#history', label: 'Dispatch History', icon: History, end: false },
        ]
    }
  }

  const navLinks = getNavLinks()
  const CurrentIcon = roleCardMeta.icon

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B132B] text-slate-300 p-4 select-none">
      <div>
        {/* Brand Logo in Sidebar */}
        <div className="px-2 py-4">
          <Brand theme="dark" />
        </div>

        {/* Role Switcher Pill / Badge Card */}
        <div className="relative mt-2 mb-6">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-between rounded-2xl bg-[#162244] border border-[#23335F] px-4 py-3 text-white transition hover:bg-[#1D2B56]"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600/30 text-blue-400">
                <CurrentIcon size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Node</p>
                <p className="text-sm font-extrabold text-white">{roleCardMeta.label}</p>
              </div>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Quick Role Switcher Dropdown */}
          {roleDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#162244] border border-[#2A3E74] p-2 shadow-2xl space-y-1">
              <p className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Switch Role / Slide
              </p>
              {[
                { role: 'manufacturer' as const, label: 'Slide 3: Manufacturer', path: '/manufacturer' },
                { role: 'transporter' as const, label: 'Slide 4: Dispatcher', path: '/dispatcher' },
                { role: 'warehouse_manager' as const, label: 'Slide 5: Warehouse', path: '/warehouse' },
                { role: 'retailer' as const, label: 'Slide 6: Retailer', path: '/retailer' },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleSwitchRole(item.role)}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-between ${
                    currentRole === item.role
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-[#23335F] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {currentRole === item.role && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="space-y-1.5 px-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            // Active link styling matching the reference: light pill with dark text
            const isActive = location.pathname === link.to.split('#')[0]

            return (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive: exactActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    exactActive || (isActive && link.label.includes('Dashboard'))
                      ? 'bg-[#EBF2FF] text-[#1E3A8A] shadow-xs'
                      : 'text-[#8E9BB5] hover:bg-[#162244] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${
                      link.badgeColor || 'bg-red-500'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions: Track Order & Logout */}
      <div className="pt-4 border-t border-[#1C2A52] space-y-2">
        <NavLink
          to="/track"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold text-[#8E9BB5] hover:bg-[#162244] hover:text-white transition"
        >
          <RouteIcon size={16} />
          <span>Live Tracking</span>
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-bold text-[#8E9BB5] hover:bg-[#162244] hover:text-red-400 transition"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F6FB] flex text-slate-800">
      {/* Desktop Sidebar (Fixed Width 256px, Dark Navy #0B132B) */}
      <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-40 border-r border-[#15203D]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-[#0B132B] shadow-2xl z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200/90 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title & Role Pill */}
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-slate-900">
                {currentRole === 'transporter'
                  ? 'Incoming Dispatch Requests'
                  : currentRole === 'warehouse_manager'
                  ? 'Warehouse Dashboard'
                  : currentRole === 'retailer'
                  ? 'My Orders'
                  : 'Dashboard'}
              </span>

              {currentRole === 'manufacturer' && (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#2563EB] border border-blue-100">
                  Manufacturer
                </span>
              )}
            </div>
          </div>

          {/* Right Header: Notification Bell & Role Colored Avatar */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 transition"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Role Colored Avatar matching Reference: M (Blue), D (Purple), W (Orange), R (Green) */}
            <div
              className={`grid h-9 w-9 place-items-center rounded-full ${roleCardMeta.avatarBg} text-white font-extrabold text-sm shadow-xs`}
              title={`${roleCardMeta.label} Account`}
            >
              {roleCardMeta.avatarLetter}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
