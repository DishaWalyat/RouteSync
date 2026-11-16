import { useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileCheck,
  Printer,
  Receipt,
  X,
} from 'lucide-react'
import { LoadingState } from '../components/EmptyState.tsx'
import { useSupplyChain } from '../context/SupplyChainContext.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { confirmRetailerDelivery } from '../services/shipments.ts'
import { useToast } from '../context/ToastContext.tsx'

export function RetailerPage() {
  const { shipments, loading } = useSupplyChain()
  const { user, profile } = useAuth()
  const { notify } = useToast()

  // Selected Order for Bill Modal
  const [selectedBillOrder, setSelectedBillOrder] = useState<any | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  // Reference Orders matching Slide 6
  const staticOrders = [
    {
      id: 'ord-1',
      orderId: 'ORD-5091',
      fromWarehouse: 'Central Warehouse',
      products: 'Laptop, Mouse',
      quantity: 200,
      totalAmount: '₹10,40,000',
      status: 'Pending',
      statusColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'ord-2',
      orderId: 'ORD-5087',
      fromWarehouse: 'Central Warehouse',
      products: 'Headphones',
      quantity: 300,
      totalAmount: '₹8,99,700',
      status: 'Confirmed',
      statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'ord-3',
      orderId: 'ORD-5079',
      fromWarehouse: 'Central Warehouse',
      products: 'Keyboard, Charger',
      quantity: 150,
      totalAmount: '₹3,75,000',
      status: 'Completed',
      statusColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  ]

  if (loading) return <LoadingState label="Loading Retailer Orders & Invoices…" />

  // Real-time shipments inbound or delivered to retailers
  const liveInTransit = shipments.filter((s) => s.status === 'In Transit to Retailer')
  const liveDelivered = shipments.filter((s) => s.status === 'Delivered to Retailer')

  async function handleConfirmLiveDelivery(shipmentId: string) {
    if (!user) return
    setConfirmingId(shipmentId)
    try {
      const invoiceNum = await confirmRetailerDelivery({
        shipmentId,
        authorUid: user.uid,
        authorName: profile?.displayName || 'Store Manager',
      })
      notify(`Order confirmed! Invoice ${invoiceNum} generated.`, 'success')
    } catch (err: any) {
      notify(err.message || 'Failed to confirm order', 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">My Orders</h1>
        <p className="text-xs text-slate-500">
          Track inbound store shipments, acknowledge store delivery and download tax invoices
        </p>
      </div>

      {/* Main Table Card matching Reference Slide 6 */}
      <div className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-bold text-slate-900">
              Retailer Consignment Orders
            </span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#2563EB]">
              {staticOrders.length + liveInTransit.length + liveDelivered.length} Total
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Step 4: Store Receiving</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3.5 font-semibold">Order ID</th>
                <th className="pb-3.5 font-semibold">From (Warehouse)</th>
                <th className="pb-3.5 font-semibold">Products</th>
                <th className="pb-3.5 font-semibold">Quantity</th>
                <th className="pb-3.5 font-semibold">Total Amount</th>
                <th className="pb-3.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Live Shipments In Transit to Retailer awaiting confirmation */}
              {liveInTransit.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 font-mono font-bold text-[#2563EB]">{s.trackingNumber}</td>
                  <td className="py-4 text-slate-700 font-semibold">{s.warehouseName || 'Central Warehouse'}</td>
                  <td className="py-4 font-bold text-slate-900">{s.productName}</td>
                  <td className="py-4 font-semibold text-slate-800">{s.quantity.toLocaleString()}</td>
                  <td className="py-4 font-mono font-bold text-slate-900">
                    ₹{((s.quantity || 1) * (s.unitPrice || 2500)).toLocaleString()}
                  </td>
                  <td className="py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleConfirmLiveDelivery(s.id)}
                      disabled={confirmingId === s.id}
                      className="rounded-xl bg-[#2563EB] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                      {confirmingId === s.id ? 'Confirming…' : 'Confirm Order'}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Exact Rows matching Reference Slide 6 */}
              {staticOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 font-mono font-bold text-[#2563EB]">{ord.orderId}</td>
                  <td className="py-4 text-slate-700 font-semibold">{ord.fromWarehouse}</td>
                  <td className="py-4 font-bold text-slate-900">{ord.products}</td>
                  <td className="py-4 font-semibold text-slate-800">{ord.quantity.toLocaleString()}</td>
                  <td className="py-4 font-mono font-bold text-slate-900">{ord.totalAmount}</td>
                  <td className="py-4 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold border ${ord.statusColor}`}
                    >
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Alert / Bill Ready Banner matching Reference Slide 6 */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white border border-emerald-200 text-emerald-600 shadow-2xs">
            <FileCheck size={26} />
          </div>
          <div>
            <h3 className="font-display text-base font-extrabold text-slate-900">
              Order ORD-5087 Confirmed
            </h3>
            <p className="text-xs text-slate-600">Your bill is ready to download.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedBillOrder({
              orderId: 'ORD-5087',
              invoiceNo: 'INV-2026-5087',
              products: 'Headphones (Batch BAT-2026-H1)',
              quantity: 300,
              unitPrice: 2856,
              subtotal: 856800,
              tax: 42900,
              grandTotal: 899700,
              retailerName: 'Retailer A - Delhi Central Store',
              warehouse: 'Central Warehouse Depot - Bay 2',
            })
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-[0.98] self-start sm:self-auto"
        >
          <Download size={15} />
          <span>Download Bill</span>
        </button>
      </div>

      {/* Bill / Invoice View Modal */}
      {selectedBillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Commercial Tax Invoice
                  </h3>
                  <p className="font-mono text-xs text-slate-400">{selectedBillOrder.invoiceNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill Details */}
            <div className="my-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Issued To (Retailer)</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedBillOrder.retailerName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Fulfillment Hub</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedBillOrder.warehouse}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">{selectedBillOrder.products}</td>
                      <td className="p-3 text-center">{selectedBillOrder.quantity}</td>
                      <td className="p-3 font-mono text-right">₹{selectedBillOrder.unitPrice}</td>
                      <td className="p-3 font-mono font-bold text-right">
                        ₹{selectedBillOrder.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Calculation */}
              <div className="space-y-1.5 pt-2 text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{selectedBillOrder.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST & Logistics Tax (5%):</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{selectedBillOrder.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-600 text-base font-black">
                    ₹{selectedBillOrder.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cryptographic Verification Badge */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Verified & Authenticated by RouteSync Cloud</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                <Printer size={15} />
                <span>Print / Save PDF Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
