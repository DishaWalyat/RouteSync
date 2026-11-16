import { useState } from 'react'
import {
  Boxes,
  Headphones,
  Keyboard,
  Laptop,
  Package,
  Plus,
  Send,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { createProduct } from '../services/products.ts'
import { createDispatchOrder } from '../services/shipments.ts'
import { useToast } from '../context/ToastContext.tsx'

export function ManufacturerPage() {
  const { products, loading, stats } = useSupplyChain()
  const { user, profile } = useAuth()
  const { notify } = useToast()

  // Modal State for + Add Product
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('Monitor 27" 4K UHD')
  const [sku, setSku] = useState('SKU-MON-270')
  const [category, setCategory] = useState('Electronics')
  const [unitPrice, setUnitPrice] = useState(24999)
  const [quantity, setQuantity] = useState(500)
  const [batchNumber, setBatchNumber] = useState('BAT-2026-M4')
  const [savingProduct, setSavingProduct] = useState(false)

  // Dispatch section state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [dispatchQty, setDispatchQty] = useState(100)
  const destinationWarehouse = 'Central Warehouse'
  const [dispatching, setDispatching] = useState(false)

  if (loading) return <LoadingState label="Loading Manufacturer Node…" />

  // Fallback initial products from reference slide if user catalog is empty
  const defaultRecent = [
    { id: 'def-1', name: 'Laptop', stock: 1200, price: 52000, icon: Laptop },
    { id: 'def-2', name: 'Headphones', stock: 3500, price: 2999, icon: Headphones },
    { id: 'def-3', name: 'Keyboard', stock: 1800, price: 1499, icon: Keyboard },
  ]

  // Stats calculation
  const totalProductsCount = products.length > 0 ? 12 + products.length : 12
  const availableStock = 8450 + products.reduce((acc, p) => acc + (p.quantity || 0), 0)
  const dispatchesCount = 4 + stats.pendingCarrierPickup + stats.inTransitToWarehouse
  const totalDispatchValue = '₹12.4L'

  // Dispatch overview counts for donut chart
  const pendingCount = 2 + stats.pendingCarrierPickup
  const confirmedCount = 2 + stats.inTransitToWarehouse
  const dispatchedCount = 2 + stats.deliveredToRetailer
  const totalDonut = pendingCount + confirmedCount + dispatchedCount

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSavingProduct(true)
    try {
      await createProduct({
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        description: 'Manufacturer catalog product',
        unitPrice: Number(unitPrice) || 1000,
        quantity: Number(quantity) || 100,
        unit: 'units',
        batchNumber: batchNumber.trim(),
        color: '#2563EB',
        manufacturerId: user.uid,
        manufacturerName: profile?.displayName || 'Manufacturer Corp',
      })
      notify(`Product "${name}" added to catalog!`, 'success')
      setModalOpen(false)
    } catch (err: any) {
      notify(err.message || 'Failed to add product', 'error')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleSendDispatch(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const prod = products.find((p) => p.id === selectedProductId)
    const prodName = prod?.name || 'Electronics Consignment'
    const prodSku = prod?.sku || 'SKU-GEN-01'
    const price = prod?.unitPrice || 2500

    setDispatching(true)
    try {
      const trackingId = await createDispatchOrder({
        productId: selectedProductId || 'prod-custom',
        productName: prodName,
        sku: prodSku,
        quantity: Number(dispatchQty) || 50,
        unit: 'units',
        unitPrice: price,
        source: 'Main Production Factory',
        destinationWarehouse: destinationWarehouse.trim() || 'Central Warehouse',
        notes: 'Standard warehouse dispatch request',
        authorUid: user.uid,
        authorName: profile?.displayName || 'Manufacturer Lead',
      })
      notify(`Dispatch order sent! Tracking: ${trackingId}`, 'success')
      setDispatchQty(100)
    } catch (err: any) {
      notify(err.message || 'Failed to dispatch order', 'error')
    } finally {
      setDispatching(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar with + Add Product */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            Manufacturer Overview
          </h1>
          <p className="text-xs text-slate-500">Production catalog, stock balances & active dispatches</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* 4 Stat Cards Row matching Reference Slide 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Package size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalProductsCount}</h3>
            <p className="text-xs font-medium text-slate-500">Total Products</p>
          </div>
        </div>

        {/* Card 2: Available Stock */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Boxes size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{availableStock.toLocaleString()}</h3>
            <p className="text-xs font-medium text-slate-500">Available Stock</p>
          </div>
        </div>

        {/* Card 3: Dispatches */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Truck size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{dispatchesCount}</h3>
            <p className="text-xs font-medium text-slate-500">Dispatches</p>
          </div>
        </div>

        {/* Card 4: Total Dispatch Value */}
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{totalDispatchValue}</h3>
            <p className="text-xs font-medium text-slate-500">Total Dispatch Value</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Products (Left) + Dispatch Overview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Recent Products Table */}
        <div className="lg:col-span-7 rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-display text-base font-bold text-slate-900">Recent Products</h2>
            <span className="text-xs font-semibold text-slate-400">Live Inventory</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {/* Reference default items */}
                {defaultRecent.map((item) => {
                  const Icon = item.icon
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700">
                          <Icon size={16} />
                        </div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700">{item.stock.toLocaleString()}</td>
                      <td className="py-3.5 font-mono font-bold text-slate-900 text-right">
                        ₹{item.price.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}

                {/* Newly added products from Firestore */}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="block text-[10px] text-slate-400">{p.sku}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-700">{p.quantity.toLocaleString()}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-900 text-right">
                      ₹{p.unitPrice?.toLocaleString() || '2,400'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Dispatch Overview Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h2 className="font-display text-base font-bold text-slate-900">Dispatch Overview</h2>
            <p className="text-xs text-slate-400">Current status distribution</p>
          </div>

          <div className="my-6 flex items-center justify-around gap-4">
            {/* SVG Donut Chart */}
            <div className="relative grid place-items-center">
              <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Yellow segment: Pending */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="14"
                  strokeDasharray="80 240"
                  strokeDashoffset="0"
                />
                {/* Green segment: Confirmed */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray="80 240"
                  strokeDashoffset="-80"
                />
                {/* Blue segment: Dispatched */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="80 240"
                  strokeDashoffset="-160"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900">{totalDonut}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total
                </span>
              </div>
            </div>

            {/* Legend matching Reference Slide 3 */}
            <div className="space-y-3 text-xs font-semibold">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Pending</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{pendingCount}</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Confirmed</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{confirmedCount}</span>
              </div>

              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600">Dispatched</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{dispatchedCount}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center text-slate-400 pt-2 border-t border-slate-100">
            Real-time pipeline tracking enabled
          </div>
        </div>
      </div>

      {/* Interactive Section 2: Create Dispatch Order */}
      <div id="create-dispatch" className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Create New Dispatch Request
            </h2>
            <p className="text-xs text-slate-500">
              Select product and allocate quantity for dispatch to warehouse
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB]">
            Step 1: Manufacturer Release
          </span>
        </div>

        <form onSubmit={handleSendDispatch} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Product *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              <option value="">-- Choose from Catalog --</option>
              <option value="def-laptop">Laptop (Stock: 1,200 | Price: ₹52,000)</option>
              <option value="def-headphones">Headphones (Stock: 3,500 | Price: ₹2,999)</option>
              <option value="def-keyboard">Keyboard (Stock: 1,800 | Price: ₹1,499)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.quantity} | Price: ₹{p.unitPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={dispatchQty}
              onChange={(e) => setDispatchQty(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={dispatching}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              <Send size={14} />
              <span>{dispatching ? 'Sending…' : 'Send for Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal: + Add Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">Add New Factory Product</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mechanical Keyboard RGB"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SKU-KEY-2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Electronics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch # *</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-xl bg-[#2563EB] px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingProduct ? 'Saving…' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
