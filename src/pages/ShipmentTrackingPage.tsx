import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Boxes,
  CheckCircle2,
  Copy,
  Factory,
  MapPin,
  Receipt,
  Route as RouteIcon,
  Search,
  Store,
  Truck,
} from 'lucide-react'
import { Button } from '../components/ui/Button.tsx'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { getShipmentByTrackingNumber, watchShipmentEvents } from '../services/shipments.ts'
import { ROLE_LABELS, type Shipment, type ShipmentStatus, type TrackingEvent } from '../types/supplyChain.ts'

export function ShipmentTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { shipments } = useSupplyChain()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [currentShipment, setCurrentShipment] = useState<Shipment | null>(null)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [loadingShipment, setLoadingShipment] = useState(false)
  const [copied, setCopied] = useState(false)

  // Sync with search parameter or default to latest shipment
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearchQuery(q)

    if (q.trim()) {
      findShipment(q.trim())
    } else if (shipments.length > 0 && !currentShipment) {
      const latest = shipments[0]
      if (latest) {
        setCurrentShipment(latest)
        setSearchParams({ q: latest.trackingNumber })
      }
    }
  }, [searchParams, shipments])

  useEffect(() => {
    if (!currentShipment) {
      setEvents([])
      return
    }

    const unsub = watchShipmentEvents(
      currentShipment.id,
      (newEvents) => {
        setEvents(newEvents)
      },
      (err) => console.warn(err),
    )

    return () => unsub()
  }, [currentShipment?.id])

  async function findShipment(code: string) {
    setLoadingShipment(true)
    try {
      const local = shipments.find(
        (s) => s.trackingNumber.toLowerCase() === code.toLowerCase() || s.id === code,
      )
      if (local) {
        setCurrentShipment(local)
      } else {
        const remote = await getShipmentByTrackingNumber(code)
        setCurrentShipment(remote)
      }
    } finally {
      setLoadingShipment(false)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchParams({ q: searchQuery.trim() })
    findShipment(searchQuery.trim())
  }

  function copyTrackingNumber() {
    if (!currentShipment) return
    navigator.clipboard.writeText(currentShipment.trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stages: Array<{ label: string; icon: any; match: ShipmentStatus[] }> = [
    { label: '1. Manufacturer Dispatch', icon: Factory, match: ['Dispatched by Manufacturer'] },
    { label: '2. Carrier In Transit', icon: Truck, match: ['In Transit to Warehouse'] },
    { label: '3. Warehouse Depot', icon: Boxes, match: ['Received at Warehouse', 'In Transit to Retailer'] },
    { label: '4. Retailer Delivery', icon: Store, match: ['Delivered to Retailer'] },
  ]

  const stageIndex = currentShipment
    ? currentShipment.status === 'Delivered to Retailer'
      ? 3
      : currentShipment.status === 'Received at Warehouse' || currentShipment.status === 'In Transit to Retailer'
      ? 2
      : currentShipment.status === 'In Transit to Warehouse'
      ? 1
      : 0
    : 0

  return (
    <div className="space-y-7 pb-12">
      {/* Search Header */}
      <div className="rounded-3xl border border-line bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#5B4BD8]/10 text-[#5B4BD8]">
                <RouteIcon size={16} />
              </span>
              <h1 className="font-display text-2xl font-extrabold text-ink">
                Consignment Live Journey Tracking
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted">
              Live tracking through Manufacturer ➔ Dispatcher ➔ Warehouse ➔ Retailer
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Enter Tracking ID (e.g. RS-2026-XXXX)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-line bg-paper pl-10 pr-3 py-2 text-xs sm:text-sm font-mono font-semibold text-ink placeholder:font-sans placeholder:text-muted focus:border-accent focus:bg-white focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="shrink-0 rounded-2xl">
              Track
            </Button>
          </form>
        </div>

        {/* Quick Recent Chips */}
        {shipments.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-line text-xs">
            <span className="text-muted font-bold text-[11px]">Quick Select:</span>
            {shipments.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSearchQuery(s.trackingNumber)
                  setSearchParams({ q: s.trackingNumber })
                  setCurrentShipment(s)
                }}
                className={`rounded-xl px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                  currentShipment?.id === s.id
                    ? 'bg-[#5B4BD8] text-white shadow-xs'
                    : 'bg-paper text-muted hover:text-ink border border-line'
                }`}
              >
                {s.trackingNumber} ({s.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingShipment ? (
        <LoadingState label="Retrieving shipment ledger from Firestore…" />
      ) : !currentShipment ? (
        <div className="rounded-3xl border border-dashed border-line bg-white/60 p-12 text-center shadow-2xs">
          <Truck size={40} className="mx-auto text-muted/60" />
          <h3 className="mt-3 font-display text-lg font-bold text-ink">No Consignment Selected</h3>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            Please enter a tracking ID or dispatch a new order from Step 1: Manufacturer.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-2xl font-black text-ink tracking-tight">
                    {currentShipment.trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={copyTrackingNumber}
                    title="Copy Tracking ID"
                    className="flex items-center gap-1 rounded-xl bg-paper border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink transition"
                  >
                    <Copy size={13} />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-black uppercase">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    {currentShipment.status}
                  </span>
                </div>

                <h2 className="mt-2 font-display text-xl font-extrabold text-ink">
                  {currentShipment.productName}{' '}
                  <span className="text-sm font-normal text-muted">
                    ({currentShipment.quantity} {currentShipment.unit}) • SKU {currentShipment.sku}
                  </span>
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#FF6433]" />
                    <span>
                      Current Location:{' '}
                      <strong className="text-ink font-bold">
                        {currentShipment.currentLocation}
                      </strong>
                    </span>
                  </div>
                  {currentShipment.invoiceNumber && (
                    <div className="flex items-center gap-1.5">
                      <Receipt size={15} className="text-emerald-600" />
                      <span>
                        Generated Bill:{' '}
                        <strong className="text-emerald-700 font-bold font-mono">
                          {currentShipment.invoiceNumber}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Step Action Button */}
              <div className="flex items-center gap-2">
                {currentShipment.status === 'Dispatched by Manufacturer' && (
                  <Link to="/dispatcher">
                    <Button variant="primary" size="md" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-bold">
                      <Truck size={16} />
                      <span>Go to Dispatcher to Confirm</span>
                    </Button>
                  </Link>
                )}
                {currentShipment.status === 'In Transit to Warehouse' && (
                  <Link to="/warehouse">
                    <Button variant="primary" size="md" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-xs font-bold">
                      <Boxes size={16} />
                      <span>Go to Warehouse to Approve</span>
                    </Button>
                  </Link>
                )}
                {currentShipment.status === 'Received at Warehouse' && (
                  <Link to="/warehouse">
                    <Button variant="primary" size="md" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-xs font-bold">
                      <Boxes size={16} />
                      <span>Allocate & Send to Retailer</span>
                    </Button>
                  </Link>
                )}
                {currentShipment.status === 'In Transit to Retailer' && (
                  <Link to="/retailer">
                    <Button variant="primary" size="md" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold">
                      <Store size={16} />
                      <span>Go to Retailer to Confirm</span>
                    </Button>
                  </Link>
                )}
                {currentShipment.status === 'Delivered to Retailer' && (
                  <Link to="/retailer">
                    <Button variant="secondary" size="md" className="gap-2 font-bold text-emerald-800 bg-emerald-50 border-emerald-300">
                      <Receipt size={16} />
                      <span>View Generated Bill</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Visual 4-Stage Stepper Bar */}
            <div className="mt-7 pt-5 border-t border-line">
              <div className="relative">
                <div className="absolute top-4 left-6 right-6 h-1 bg-paper rounded-full -z-0">
                  <div
                    className="h-full bg-[#5B4BD8] rounded-full transition-all duration-700"
                    style={{
                      width: `${(stageIndex / (stages.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="relative z-10 flex justify-between">
                  {stages.map((stage, idx) => {
                    const isCompleted = idx < stageIndex
                    const isCurrent = idx === stageIndex
                    const Icon = stage.icon

                    return (
                      <div key={stage.label} className="flex flex-col items-center text-center">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-2xl text-xs font-bold transition-all shadow-2xs ${
                            isCompleted
                              ? 'bg-[#5B4BD8] text-white'
                              : isCurrent
                              ? 'bg-[#FF6433] text-white ring-4 ring-[#FF6433]/20'
                              : 'bg-white border-2 border-line text-muted'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                        </div>
                        <span
                          className={`mt-2 text-xs font-bold ${
                            isCurrent ? 'text-ink' : isCompleted ? 'text-ink/80' : 'text-muted'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Append-Only Custody Log */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Chronological Chain of Custody History
                </h3>
                <p className="text-xs text-muted">
                  Immutable events logged as goods moved through the 4 supply chain nodes
                </p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-muted border border-line">
                {events.length} Events
              </span>
            </div>

            {events.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No tracking events logged yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="flex items-start gap-3.5 rounded-2xl border border-line bg-paper/60 p-4 text-xs"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-line text-[#5B4BD8] font-bold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-display text-sm font-bold text-ink">{ev.eventType}</h4>
                        <time className="font-mono text-[11px] text-muted">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Recent'}
                        </time>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-muted">
                        <span className="flex items-center gap-1 font-semibold text-ink">
                          <MapPin size={12} className="text-[#FF6433]" />
                          {ev.location}
                        </span>
                        <span>•</span>
                        <span>
                          Operator: <strong className="text-ink">{ev.updatedByName}</strong> (
                          {ROLE_LABELS[ev.updatedByRole] || ev.updatedByRole})
                        </span>
                      </div>

                      {ev.notes && (
                        <p className="mt-2 rounded-xl bg-white border border-line p-2 text-ink/90">
                          {ev.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
