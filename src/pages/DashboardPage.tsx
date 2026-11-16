import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  Factory,
  Package,
  Receipt,
  Route as RouteIcon,
  Search,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '../components/ui/Button.tsx'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { formatLongDate, greetingForNow, todayInput } from '../utils/dates.ts'
import { ROLE_LABELS, type ShipmentStatus } from '../types/supplyChain.ts'

export function DashboardPage() {
  const { profile, user, role } = useAuth()
  const { shipments, loading, stats } = useSupplyChain()
  const navigate = useNavigate()
  const [quickTracking, setQuickTracking] = useState('')

  const name = profile?.displayName || user?.displayName || 'Supply Chain Partner'
  const roleName = ROLE_LABELS[role] || role

  if (loading) return <LoadingState label="Connecting to RouteSync Supply Chain Hub…" />

  const recentShipments = [...shipments].slice(0, 5)

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTracking.trim()) return
    navigate(`/track?q=${encodeURIComponent(quickTracking.trim())}`)
  }

  const statusColors: Record<ShipmentStatus, { bg: string; text: string; dot: string }> = {
    'Dispatched by Manufacturer': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    'In Transit to Warehouse': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    'Received at Warehouse': { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
    'In Transit to Retailer': { bg: 'bg-sky-100', text: 'text-sky-800', dot: 'bg-sky-500' },
    'Delivered to Retailer': { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  }

  return (
    <div className="space-y-7 pb-10">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {formatLongDate(todayInput())}
            </span>
            <span className="text-xs font-bold text-accent">● Live Cloud Sync</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {greetingForNow()}, {name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-muted">
            Supply Chain Visibility Platform operating under{' '}
            <span className="font-semibold text-accent">{roleName}</span> privileges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/track">
            <Button variant="secondary" size="md" className="gap-2">
              <RouteIcon size={16} />
              <span>Track Consignment</span>
            </Button>
          </Link>
          <Link to="/manufacturer">
            <Button variant="primary" size="md" className="gap-2 shadow-sm">
              <Factory size={16} />
              <span>Dispatch Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4-Step Interactive Pipeline Flow Banner */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
        <h3 className="font-display text-base font-extrabold text-ink mb-1">
          End-to-End 4-Stage Supply Chain Workflow
        </h3>
        <p className="text-xs text-muted mb-5">
          Follow products as they journey from factory floor to retailer confirmation with generated bills
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/manufacturer"
            className="group rounded-2xl border border-line bg-paper p-4 transition hover:border-[#FFC436] hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-[#FFC436] p-2 text-ink shadow-2xs">
                <Factory size={18} />
              </span>
              <span className="font-mono text-xs font-bold text-muted">STEP 1</span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-ink group-hover:text-[#5B4BD8] transition">
              1. Manufacturer
            </h4>
            <p className="mt-1 text-[11px] text-muted">Add products & dispatch batches</p>
            <div className="mt-3 flex items-center text-xs font-bold text-[#5B4BD8]">
              <span>Open Catalog</span>
              <ArrowRight size={13} className="ml-1 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/dispatcher"
            className="group rounded-2xl border border-line bg-paper p-4 transition hover:border-blue-400 hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-blue-500 p-2 text-white shadow-2xs">
                <Truck size={18} />
              </span>
              <span className="font-mono text-xs font-bold text-muted">STEP 2</span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-ink group-hover:text-blue-600 transition">
              2. Dispatcher / Carrier
            </h4>
            <p className="mt-1 text-[11px] text-muted">Confirm pickup & transport to hub</p>
            <div className="mt-3 flex items-center text-xs font-bold text-blue-600">
              <span>View Dispatches</span>
              <ArrowRight size={13} className="ml-1 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/warehouse"
            className="group rounded-2xl border border-line bg-paper p-4 transition hover:border-purple-400 hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-purple-500 p-2 text-white shadow-2xs">
                <Boxes size={18} />
              </span>
              <span className="font-mono text-xs font-bold text-muted">STEP 3</span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-ink group-hover:text-purple-600 transition">
              3. Warehouse Hub
            </h4>
            <p className="mt-1 text-[11px] text-muted">Approve stock & fluctuate 5 retailer demands</p>
            <div className="mt-3 flex items-center text-xs font-bold text-purple-600">
              <span>Open Depot</span>
              <ArrowRight size={13} className="ml-1 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/retailer"
            className="group rounded-2xl border border-line bg-paper p-4 transition hover:border-emerald-400 hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-emerald-500 p-2 text-white shadow-2xs">
                <Store size={18} />
              </span>
              <span className="font-mono text-xs font-bold text-muted">STEP 4</span>
            </div>
            <h4 className="mt-3 font-display text-sm font-bold text-ink group-hover:text-emerald-600 transition">
              4. Retailer Confirmation
            </h4>
            <p className="mt-1 text-[11px] text-muted">Confirm delivery & get generated bill</p>
            <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
              <span>View Orders & Bills</span>
              <ArrowRight size={13} className="ml-1 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4 Candy Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Factory Products */}
        <div className="rounded-3xl border border-line bg-[#FFC436] p-5 text-ink shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-black/10 p-2.5">
              <Factory size={22} className="text-ink" />
            </span>
            <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-[11px] font-extrabold text-ink">
              Step 1
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-ink/80">Factory Catalog SKUs</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {stats.totalProducts}
            </h3>
            <p className="mt-1 text-[11px] text-ink/75">Registered manufactured items</p>
          </div>
        </div>

        {/* Card 2: Carrier Pipeline */}
        <div className="rounded-3xl border border-line bg-[#5B4BD8] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-white/20 p-2.5">
              <Truck size={22} className="text-white" />
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
              Step 2
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-white/80">Carrier Transit Pipeline</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {stats.pendingCarrierPickup + stats.inTransitToWarehouse}
            </h3>
            <p className="mt-1 text-[11px] text-white/75">
              {stats.pendingCarrierPickup} awaiting pickup • {stats.inTransitToWarehouse} in transit
            </p>
          </div>
        </div>

        {/* Card 3: Warehouse Stock */}
        <div className="rounded-3xl border border-line bg-[#FF4D88] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-white/20 p-2.5">
              <Boxes size={22} className="text-white" />
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
              Step 3
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-white/80">Received Warehouse Stock</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {stats.receivedAtWarehouse}
            </h3>
            <p className="mt-1 text-[11px] text-white/75">Consignments ready for retail distribution</p>
          </div>
        </div>

        {/* Card 4: Confirmed Retail Orders */}
        <div className="rounded-3xl border border-line bg-[#10B981] p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-2xl bg-white/20 p-2.5">
              <Receipt size={22} className="text-white" />
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
              Step 4
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-white/80">Delivered Retail Orders</p>
            <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
              {stats.deliveredToRetailer}
            </h3>
            <p className="mt-1 text-[11px] text-white/75">Bills generated & confirmed</p>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <form onSubmit={handleQuickSearch} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search Consignment Tracking ID (e.g. RS-2026-XXXX)…"
            value={quickTracking}
            onChange={(e) => setQuickTracking(e.target.value)}
            className="w-full rounded-2xl border border-line bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-ink placeholder:text-muted focus:border-accent focus:outline-none shadow-2xs"
          />
        </div>
        <Button type="submit" variant="primary" size="md" className="shrink-0 rounded-2xl">
          Track
        </Button>
      </form>

      {/* Recent Consignments Table */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="font-display text-base font-bold text-ink">Active Consignments Flow</h3>
            <p className="text-xs text-muted">Real-time status updates across the 4 nodes</p>
          </div>
          <span className="text-xs font-bold text-muted font-mono">{shipments.length} Total</span>
        </div>

        {recentShipments.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            <Package size={32} className="mx-auto text-muted/60 mb-2" />
            No shipments in motion. Go to <Link to="/manufacturer" className="font-bold text-[#5B4BD8] underline">Step 1: Manufacturer</Link> to dispatch an order.
          </div>
        ) : (
          <div className="space-y-3">
            {recentShipments.map((s) => {
              const color = statusColors[s.status] || { bg: 'bg-paper', text: 'text-ink', dot: 'bg-gray-400' }
              return (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink text-sm">{s.trackingNumber}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color.bg} ${color.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                        {s.status}
                      </span>
                    </div>
                    <h4 className="mt-1 font-bold text-ink text-sm">
                      {s.productName} ({s.quantity} {s.unit})
                    </h4>
                    <p className="mt-0.5 text-muted">
                      Route: {s.source} ➔ {s.destination}
                    </p>
                  </div>

                  <Link to={`/track?q=${encodeURIComponent(s.trackingNumber)}`}>
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                      <RouteIcon size={13} />
                      <span>Track Journey</span>
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
