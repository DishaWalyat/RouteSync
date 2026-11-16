import { useState } from 'react'
import { Check } from 'lucide-react'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { confirmCarrierPickup } from '../services/shipments.ts'
import { useToast } from '../context/ToastContext.tsx'

export function DispatcherPage() {
  const { shipments, loading } = useSupplyChain()
  const { user, profile } = useAuth()
  const { notify } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Reference initial rows from Slide 4
  const [staticRows, setStaticRows] = useState([
    {
      id: 'dsp-1',
      dispatchId: 'DSP-1042',
      manufacturer: 'TechMakers Co.',
      products: 'Laptop, Mouse',
      quantity: 500,
      totalValue: '₹26,00,000',
      confirmed: false,
    },
    {
      id: 'dsp-2',
      dispatchId: 'DSP-1043',
      manufacturer: 'Nova Electronics',
      products: 'Headphones, Charger',
      quantity: 1200,
      totalValue: '₹35,98,800',
      confirmed: false,
    },
    {
      id: 'dsp-3',
      dispatchId: 'DSP-1044',
      manufacturer: 'Apex Devices',
      products: 'Keyboard, Monitor',
      quantity: 350,
      totalValue: '₹17,50,000',
      confirmed: false,
    },
  ])

  if (loading) return <LoadingState label="Loading incoming dispatch requests…" />

  // Real-time shipments pending carrier pickup from Firestore
  const pendingPickup = shipments.filter((s) => s.status === 'Dispatched by Manufacturer')
  const inTransitWarehouse = shipments.filter((s) => s.status === 'In Transit to Warehouse')

  async function handleConfirmLive(shipmentId: string) {
    if (!user) return
    setProcessingId(shipmentId)
    try {
      await confirmCarrierPickup({
        shipmentId,
        transporterName: profile?.displayName || 'Express Freight Logistics',
        currentLocation: 'Interstate Highway Transport Hub',
        authorUid: user.uid,
        authorName: profile?.displayName || 'Dispatcher Lead',
      })
      notify('Pickup confirmed! Shipment is now in transit towards warehouse.', 'success')
    } catch (err: any) {
      notify(err.message || 'Failed to confirm pickup', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  function handleConfirmStatic(id: string) {
    setStaticRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, confirmed: true } : row)),
    )
    notify('Dispatch request confirmed and assigned to transport fleet!', 'success')
  }

  function handleRejectStatic(id: string) {
    setStaticRows((prev) => prev.filter((row) => row.id !== id))
    notify('Dispatch request rejected and returned to manufacturer.', 'info')
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Incoming Dispatch Requests
        </h1>
        <p className="text-xs text-slate-500">
          Review manufacturer consignments, confirm vehicle loading and authorize warehouse transport
        </p>
      </div>

      {/* Main Table Card matching Reference Slide 4 */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-slate-900">
              Pending Authorization Queue
            </span>
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-black text-white">
              {staticRows.filter((r) => !r.confirmed).length + pendingPickup.length}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Step 2: Carrier Handshake</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3.5 font-semibold">Dispatch ID</th>
                <th className="pb-3.5 font-semibold">Manufacturer</th>
                <th className="pb-3.5 font-semibold">Products</th>
                <th className="pb-3.5 font-semibold">Quantity</th>
                <th className="pb-3.5 font-semibold">Total Value</th>
                <th className="pb-3.5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Dynamic Real-time Shipments from Firebase */}
              {pendingPickup.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 font-mono font-bold text-[#2563EB]">{s.trackingNumber}</td>
                  <td className="py-4 font-bold text-slate-900">{s.source || 'TechMakers Co.'}</td>
                  <td className="py-4 text-slate-700">{s.productName}</td>
                  <td className="py-4 font-semibold text-slate-800">{s.quantity.toLocaleString()}</td>
                  <td className="py-4 font-mono font-bold text-slate-900">
                    ₹{((s.quantity || 1) * (s.unitPrice || 2500)).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmLive(s.id)}
                        disabled={processingId === s.id}
                        className="rounded-xl bg-[#2563EB] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-60"
                      >
                        {processingId === s.id ? 'Confirming…' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => notify('Consignment flagged for inspection', 'info')}
                        className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Exact Rows from Reference Slide 4 */}
              {staticRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 font-mono font-bold text-[#2563EB]">{row.dispatchId}</td>
                  <td className="py-4 font-bold text-slate-900">{row.manufacturer}</td>
                  <td className="py-4 text-slate-700">{row.products}</td>
                  <td className="py-4 font-semibold text-slate-800">{row.quantity.toLocaleString()}</td>
                  <td className="py-4 font-mono font-bold text-slate-900">{row.totalValue}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      {row.confirmed ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          <Check size={14} />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfirmStatic(row.id)}
                            className="rounded-xl bg-[#2563EB] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-[0.98]"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectStatic(row.id)}
                            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet Transports In Motion toward Warehouse */}
      {inTransitWarehouse.length > 0 && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Active Transports En Route to Warehouse Hub
            </h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
              {inTransitWarehouse.length} Moving
            </span>
          </div>

          <div className="space-y-2">
            {inTransitWarehouse.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900">{s.trackingNumber}</span> •{' '}
                  <span className="font-bold text-slate-800">{s.productName}</span> ({s.quantity} units)
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Carrier: {s.transporterName} • Checkpoint: {s.currentLocation}
                  </p>
                </div>
                <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                  On Highway
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
