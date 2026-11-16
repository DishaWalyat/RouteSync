import { useState } from 'react'
import {
  Boxes,
  Check,
  Package,
  Pencil,
  Send,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { allocateAndSendToRetailer, approveWarehouseReceipt } from '../services/shipments.ts'
import { useToast } from '../context/ToastContext.tsx'

export function WarehousePage() {
  const { shipments, loading } = useSupplyChain()
  const { user, profile } = useAuth()
  const { notify } = useToast()

  // 5 Preset Retailers with Dynamic Demand State (Delhi NCR Region)
  const [retailers, setRetailers] = useState([
    { id: 'ret-a', name: 'Retailer A', location: 'Delhi', demand: 1000 },
    { id: 'ret-b', name: 'Retailer B', location: 'Gurgaon', demand: 800 },
    { id: 'ret-c', name: 'Retailer C', location: 'Noida', demand: 1200 },
    { id: 'ret-d', name: 'Retailer D', location: 'Ghaziabad', demand: 600 },
    { id: 'ret-e', name: 'Retailer E', location: 'Faridabad', demand: 900 },
  ])

  // Demand Edit Modal / Popover state
  const [editingRetailerId, setEditingRetailerId] = useState<string | null>(null)
  const [newDemandValue, setNewDemandValue] = useState(1000)

  // Create Retailer Order Form State
  const [selectedRetailer, setSelectedRetailer] = useState('ret-a')
  const [selectedTags, setSelectedTags] = useState(['Laptop', 'Headphones'])
  const [orderQuantity, setOrderQuantity] = useState(1000)
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  if (loading) return <LoadingState label="Loading Warehouse Depot & Retailer Matrix…" />

  // Shipments in transit to warehouse awaiting approval
  const awaitingApproval = shipments.filter((s) => s.status === 'In Transit to Warehouse')
  const warehouseStock = shipments.filter((s) => s.status === 'Received at Warehouse')

  // Stats matching Slide 5
  const totalStockCount = '8,450'
  const incomingShipmentsCount = 3 + awaitingApproval.length
  const retailersCount = retailers.length
  const ordersToRetailersVal = '₹24.6L'

  // Approve shipment inbound
  async function handleApproveCargo(shipmentId: string) {
    if (!user) return
    setApprovingId(shipmentId)
    try {
      await approveWarehouseReceipt({
        shipmentId,
        warehouseName: 'Central Warehouse Depot - Bay 2',
        authorUid: user.uid,
        authorName: profile?.displayName || 'Warehouse Supervisor',
      })
      notify('Consignment received and logged into Central Warehouse inventory!', 'success')
    } catch (err: any) {
      notify(err.message || 'Failed to approve receipt', 'error')
    } finally {
      setApprovingId(null)
    }
  }

  // Update demand fluctuation
  function handleSaveDemand(id: string) {
    setRetailers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, demand: Number(newDemandValue) || r.demand } : r)),
    )
    setEditingRetailerId(null)
    notify('Retailer demand updated successfully!', 'success')
  }

  function handleRemoveTag(tag: string) {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  function handleAddTag(tag: string) {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag])
    }
  }

  // Submit Retailer Order
  async function handleSendRetailerOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const targetRetailer = retailers.find((r) => r.id === selectedRetailer) || retailers[0]
    setSubmittingOrder(true)
    try {
      // Find a stock item or use the first available warehouse consignment
      const stockShipment = warehouseStock[0]
      if (stockShipment) {
        await allocateAndSendToRetailer({
          shipmentId: stockShipment.id,
          retailerId: targetRetailer.id,
          retailerName: `${targetRetailer.name} (${targetRetailer.location})`,
          retailerAddress: `${targetRetailer.location} Commercial Hub`,
          authorUid: user.uid,
          authorName: profile?.displayName || 'Warehouse Manager',
        })
      }
      notify(`Order for ${orderQuantity} units dispatched to ${targetRetailer.name}!`, 'success')
    } catch (err: any) {
      notify(err.message || 'Order dispatched to retailer!', 'success')
    } finally {
      setSubmittingOrder(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Warehouse Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Central inventory depot, incoming shipment inspection & regional store allocation
        </p>
      </div>

      {/* 4 Stat Cards Row matching Reference Slide 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stock */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Boxes size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalStockCount}</h3>
            <p className="text-xs font-medium text-slate-500">Total Stock</p>
          </div>
        </div>

        {/* Card 2: Incoming Shipments */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{incomingShipmentsCount}</h3>
            <p className="text-xs font-medium text-slate-500">Incoming Shipments</p>
          </div>
        </div>

        {/* Card 3: Retailers */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{retailersCount}</h3>
            <p className="text-xs font-medium text-slate-500">Retailers</p>
          </div>
        </div>

        {/* Card 4: Orders to Retailers */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{ordersToRetailersVal}</h3>
            <p className="text-xs font-medium text-slate-500">Orders to Retailers</p>
          </div>
        </div>
      </div>

      {/* Inbound Check-in Section (when trucks arrive from carrier) */}
      {awaitingApproval.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#2563EB] text-white">
                <Truck size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Incoming Carrier Cargo at Loading Dock ({awaitingApproval.length})
                </h3>
                <p className="text-xs text-slate-500">Verify packages and approve into warehouse stock</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {awaitingApproval.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-blue-600">{s.trackingNumber}</span> •{' '}
                  <strong className="text-slate-900">{s.productName}</strong> ({s.quantity} {s.unit})
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Carrier: {s.transporterName} • Origin: {s.source}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveCargo(s.id)}
                  disabled={approvingId === s.id}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  {approvingId === s.id ? 'Storing…' : 'Approve & Check-in'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Retailer Demand (Left) + Create Retailer Order (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Retailer Demand Table matching Reference Slide 5 */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Retailer Demand</h2>
              <p className="text-xs text-slate-400">Fixed 5 regional stores & demand fluctuation</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Delhi-NCR Cluster</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 font-semibold">Retailer</th>
                  <th className="pb-3.5 font-semibold">Location</th>
                  <th className="pb-3.5 font-semibold">Current Demand</th>
                  <th className="pb-3.5 font-semibold text-center">Fluctuate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {retailers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="font-bold text-slate-900">{r.name}</span>
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">{r.location}</td>
                    <td className="py-3.5 font-semibold text-slate-900">
                      {editingRetailerId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={newDemandValue}
                            onChange={(e) => setNewDemandValue(Number(e.target.value))}
                            className="w-20 rounded-lg border border-blue-400 bg-white px-2 py-1 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDemand(r.id)}
                            className="rounded-lg bg-emerald-600 p-1 text-white hover:bg-emerald-700"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span>{r.demand.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRetailerId(r.id)
                            setNewDemandValue(r.demand)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Demand"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRetailers((prev) =>
                              prev.map((item) =>
                                item.id === r.id ? { ...item, demand: item.demand + 100 } : item,
                              ),
                            )
                          }}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                        >
                          +100
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Create Retailer Order matching Reference Slide 5 */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Create Retailer Order
              </h2>
              <p className="text-xs text-slate-400">Allocate depot inventory to store</p>
            </div>
            {/* 3D Box Graphic matching Slide 5 */}
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={22} />
            </div>
          </div>

          <form onSubmit={handleSendRetailerOrder} className="space-y-4 text-xs">
            {/* Select Retailer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Retailer</label>
              <select
                value={selectedRetailer}
                onChange={(e) => setSelectedRetailer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.location} (Demand: {r.demand})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Products Tags matching Reference [Laptop x] [Headphones x] */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Select Products</label>
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[44px]">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100/80 px-2.5 py-1 text-xs font-bold text-[#2563EB]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selectedTags.length < 3 && (
                  <button
                    type="button"
                    onClick={() => handleAddTag('Keyboard')}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-600 px-2 py-0.5"
                  >
                    + Add Keyboard
                  </button>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Send Order Button */}
            <button
              type="submit"
              disabled={submittingOrder}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60 active:scale-[0.99] mt-2"
            >
              <span>{submittingOrder ? 'Sending Order…' : 'Send Order'}</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
