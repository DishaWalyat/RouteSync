import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDb } from './firebase.ts'
import type { Shipment, ShipmentStatus, TrackingEvent, UserRole } from '../types/supplyChain.ts'
import { asNumber, asString, stamp } from './records.ts'

function shipmentsCol() {
  return collection(getDb(), 'shipments')
}

function eventsCol() {
  return collection(getDb(), 'shipmentEvents')
}

function mapShipment(id: string, data: Record<string, unknown>): Shipment {
  return {
    id,
    trackingNumber: asString(data.trackingNumber),
    productId: asString(data.productId),
    productName: asString(data.productName),
    sku: asString(data.sku),
    quantity: asNumber(data.quantity),
    unit: asString(data.unit) || 'units',
    unitPrice: asNumber(data.unitPrice) || 120,
    source: asString(data.source),
    destination: asString(data.destination),
    currentLocation: asString(data.currentLocation) || asString(data.source),
    status: (asString(data.status) || 'Dispatched by Manufacturer') as ShipmentStatus,
    manufacturerId: asString(data.manufacturerId),
    manufacturerName: asString(data.manufacturerName) || 'Primary Manufacturer',
    dispatchDate: asString(data.dispatchDate),
    transporterName: asString(data.transporterName) || undefined,
    transporterConfirmedAt: asString(data.transporterConfirmedAt) || undefined,
    warehouseName: asString(data.warehouseName) || undefined,
    warehouseReceivedAt: asString(data.warehouseReceivedAt) || undefined,
    retailerId: asString(data.retailerId) || undefined,
    retailerName: asString(data.retailerName) || undefined,
    retailerAddress: asString(data.retailerAddress) || undefined,
    retailerDispatchedAt: asString(data.retailerDispatchedAt) || undefined,
    deliveredDate: asString(data.deliveredDate) || undefined,
    isConfirmedByRetailer: Boolean(data.isConfirmedByRetailer),
    invoiceNumber: asString(data.invoiceNumber) || undefined,
    totalAmount: asNumber(data.totalAmount) || undefined,
    notes: asString(data.notes) || undefined,
    createdAt: stamp(data.createdAt),
    updatedAt: stamp(data.updatedAt),
  }
}

function mapEvent(id: string, data: Record<string, unknown>): TrackingEvent {
  return {
    id,
    shipmentId: asString(data.shipmentId),
    trackingNumber: asString(data.trackingNumber),
    eventType: asString(data.eventType) || 'Milestone Recorded',
    location: asString(data.location),
    timestamp: stamp(data.timestamp) || asString(data.timestamp),
    updatedByUid: asString(data.updatedByUid),
    updatedByName: asString(data.updatedByName) || 'Operator',
    updatedByRole: (asString(data.updatedByRole) || 'manufacturer') as UserRole,
    quantity: asNumber(data.quantity) || undefined,
    notes: asString(data.notes),
    createdAt: stamp(data.createdAt),
  }
}

export function generateTrackingNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `RS-${year}-${random}`
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `INV-${year}-${random}`
}

export function watchShipments(
  onData: (rows: Shipment[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(shipmentsCol(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapShipment(item.id, item.data() as Record<string, unknown>))),
    (error) => onError(error),
  )
}

// -------------------------------------------------------------
// STEP 1: Manufacturer Dispatches Product
// -------------------------------------------------------------
export async function createDispatchOrder(params: {
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  source: string
  destinationWarehouse: string
  notes?: string
  authorUid: string
  authorName: string
}): Promise<string> {
  const trackingNumber = generateTrackingNumber()
  const ref = await addDoc(shipmentsCol(), {
    trackingNumber,
    productId: params.productId,
    productName: params.productName,
    sku: params.sku,
    quantity: params.quantity,
    unit: params.unit,
    unitPrice: params.unitPrice || 120,
    source: params.source,
    destination: params.destinationWarehouse,
    currentLocation: params.source,
    status: 'Dispatched by Manufacturer',
    manufacturerId: params.authorUid,
    manufacturerName: params.authorName,
    warehouseName: params.destinationWarehouse,
    dispatchDate: new Date().toISOString().slice(0, 10),
    notes: params.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Append first tracking event
  await addDoc(eventsCol(), {
    shipmentId: ref.id,
    trackingNumber,
    eventType: 'Dispatched by Manufacturer',
    location: params.source,
    timestamp: serverTimestamp(),
    updatedByUid: params.authorUid,
    updatedByName: params.authorName,
    updatedByRole: 'manufacturer',
    quantity: params.quantity,
    notes: `Product order of ${params.quantity} ${params.unit} packaged and marked ready for carrier dispatch.`,
    createdAt: serverTimestamp(),
  })

  return ref.id
}

// -------------------------------------------------------------
// STEP 2: Dispatcher Confirms Pickup & Transport
// -------------------------------------------------------------
export async function confirmCarrierPickup(params: {
  shipmentId: string
  transporterName: string
  currentLocation: string
  authorUid: string
  authorName: string
}) {
  const shipmentRef = doc(getDb(), 'shipments', params.shipmentId)
  const snap = await getDoc(shipmentRef)
  const trackingNumber = snap.exists() ? snap.data().trackingNumber : ''

  await updateDoc(shipmentRef, {
    status: 'In Transit to Warehouse',
    transporterName: params.transporterName,
    currentLocation: params.currentLocation,
    transporterConfirmedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  })

  await addDoc(eventsCol(), {
    shipmentId: params.shipmentId,
    trackingNumber,
    eventType: 'Carrier Confirmed Pickup',
    location: params.currentLocation,
    timestamp: serverTimestamp(),
    updatedByUid: params.authorUid,
    updatedByName: params.authorName,
    updatedByRole: 'transporter',
    notes: `Carrier "${params.transporterName}" picked up cargo. In transit toward warehouse hub.`,
    createdAt: serverTimestamp(),
  })
}

// -------------------------------------------------------------
// STEP 3A: Warehouse Approves & Receives Inbound Goods
// -------------------------------------------------------------
export async function approveWarehouseReceipt(params: {
  shipmentId: string
  warehouseName: string
  authorUid: string
  authorName: string
}) {
  const shipmentRef = doc(getDb(), 'shipments', params.shipmentId)
  const snap = await getDoc(shipmentRef)
  const trackingNumber = snap.exists() ? snap.data().trackingNumber : ''

  await updateDoc(shipmentRef, {
    status: 'Received at Warehouse',
    warehouseName: params.warehouseName,
    currentLocation: params.warehouseName,
    warehouseReceivedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  })

  await addDoc(eventsCol(), {
    shipmentId: params.shipmentId,
    trackingNumber,
    eventType: 'Received & Approved at Warehouse',
    location: params.warehouseName,
    timestamp: serverTimestamp(),
    updatedByUid: params.authorUid,
    updatedByName: params.authorName,
    updatedByRole: 'warehouse_manager',
    notes: `Cargo inspected, verified, and admitted into warehouse inventory.`,
    createdAt: serverTimestamp(),
  })
}

// -------------------------------------------------------------
// STEP 3B: Warehouse Dispatches to a Selected Retailer
// -------------------------------------------------------------
export async function allocateAndSendToRetailer(params: {
  shipmentId: string
  retailerId: string
  retailerName: string
  retailerAddress: string
  authorUid: string
  authorName: string
}) {
  const shipmentRef = doc(getDb(), 'shipments', params.shipmentId)
  const snap = await getDoc(shipmentRef)
  const trackingNumber = snap.exists() ? snap.data().trackingNumber : ''

  await updateDoc(shipmentRef, {
    status: 'In Transit to Retailer',
    retailerId: params.retailerId,
    retailerName: params.retailerName,
    retailerAddress: params.retailerAddress,
    destination: `${params.retailerName} (${params.retailerAddress})`,
    retailerDispatchedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  })

  await addDoc(eventsCol(), {
    shipmentId: params.shipmentId,
    trackingNumber,
    eventType: `Dispatched to Retailer: ${params.retailerName}`,
    location: `Outbound from Warehouse to ${params.retailerName}`,
    timestamp: serverTimestamp(),
    updatedByUid: params.authorUid,
    updatedByName: params.authorName,
    updatedByRole: 'warehouse_manager',
    notes: `Warehouse allocated consignment and dispatched delivery fleet to ${params.retailerName}.`,
    createdAt: serverTimestamp(),
  })
}

// -------------------------------------------------------------
// STEP 4: Retailer Confirms Order & Generates Official Bill
// -------------------------------------------------------------
export async function confirmRetailerDelivery(params: {
  shipmentId: string
  authorUid: string
  authorName: string
}) {
  const shipmentRef = doc(getDb(), 'shipments', params.shipmentId)
  const snap = await getDoc(shipmentRef)
  if (!snap.exists()) return

  const data = snap.data()
  const trackingNumber = data.trackingNumber || ''
  const quantity = Number(data.quantity) || 1
  const unitPrice = Number(data.unitPrice) || 120
  const totalAmount = quantity * unitPrice
  const invoiceNumber = generateInvoiceNumber()

  await updateDoc(shipmentRef, {
    status: 'Delivered to Retailer',
    currentLocation: data.retailerName || 'Retailer Store Terminal',
    isConfirmedByRetailer: true,
    deliveredDate: new Date().toISOString(),
    invoiceNumber,
    totalAmount,
    updatedAt: serverTimestamp(),
  })

  await addDoc(eventsCol(), {
    shipmentId: params.shipmentId,
    trackingNumber,
    eventType: 'Delivered & Order Confirmed by Retailer',
    location: data.retailerName || 'Retailer Receiving Dock',
    timestamp: serverTimestamp(),
    updatedByUid: params.authorUid,
    updatedByName: params.authorName,
    updatedByRole: 'retailer',
    notes: `Order received and confirmed by retailer. Official Bill Generated: ${invoiceNumber}. Total: $${totalAmount.toLocaleString()}.`,
    createdAt: serverTimestamp(),
  })
}

// -------------------------------------------------------------
// Real-time Event Watcher for Tracking
// -------------------------------------------------------------
export function watchShipmentEvents(
  shipmentId: string,
  onData: (rows: TrackingEvent[]) => void,
  onError: (error: Error) => void,
) {
  const q = query(
    eventsCol(),
    where('shipmentId', '==', shipmentId),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(
    q,
    (snapshot) =>
      onData(snapshot.docs.map((item) => mapEvent(item.id, item.data() as Record<string, unknown>))),
    (error) => onError(error),
  )
}

export async function getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
  const q = query(shipmentsCol(), where('trackingNumber', '==', trackingNumber.trim()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const item = snap.docs[0]
  return mapShipment(item.id, item.data() as Record<string, unknown>)
}
