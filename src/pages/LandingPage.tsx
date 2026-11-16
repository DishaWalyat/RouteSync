import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  FileText,
  Package,
  Route as RouteIcon,
  Truck,
} from 'lucide-react'
import { Brand } from '../components/Brand.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Brand theme="light" />

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#home" className="text-slate-900 hover:text-blue-600 transition">
            Home
          </a>
          <a href="#features" className="hover:text-blue-600 transition">
            Features
          </a>
          <a href="#workflow" className="hover:text-blue-600 transition">
            Workflow
          </a>
          <a href="#about" className="hover:text-blue-600 transition">
            About
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/manufacturer"
              className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Open Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 md:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-1.5 text-xs font-bold text-[#2563EB] border border-blue-100">
              <span>Cloud-Based Supply Chain Management</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              From Manufacturer <br />
              to Retailer,{' '}
              <span className="text-[#2563EB]">Seamlessly</span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl">
              Manage products, dispatches, warehouse inventory and retailer orders — all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={user ? '/manufacturer' : '/login'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg transition active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition"
              >
                <RouteIcon size={16} className="text-blue-600" />
                <span>Track Order</span>
              </Link>
            </div>
          </div>

          {/* Right 3D Isometric Illustration */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-blue-50/50 bg-white/40 backdrop-blur-xs">
              <img
                src="/hero-illustration.jpg"
                alt="RouteSync 3D Supply Chain Pipeline from Manufacturer to Retailer"
                className="w-full h-auto object-cover transform hover:scale-[1.02] transition duration-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Bottom 4 Feature Cards */}
        <div className="mt-14 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/manufacturer"
              className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Package size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  Inventory & Products
                </h3>
                <p className="text-xs text-slate-500">Catalog & stock levels</p>
              </div>
            </Link>

            <Link
              to="/dispatcher"
              className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  Dispatch Management
                </h3>
                <p className="text-xs text-slate-500">Fleet & transit handoff</p>
              </div>
            </Link>

            <Link
              to="/warehouse"
              className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  Warehouse Operations
                </h3>
                <p className="text-xs text-slate-500">Stock check & retailer matrix</p>
              </div>
            </Link>

            <Link
              to="/retailer"
              className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition group"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                  Retailer Orders & Billing
                </h3>
                <p className="text-xs text-slate-500">Receipts & verified invoices</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
        RouteSync Cloud Supply Chain Management System • Powered by Firebase Firestore
      </footer>
    </div>
  )
}
