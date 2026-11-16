export const USER_ROLES = [
  'manufacturer',
  'transporter',
  'warehouse_manager',
  'retailer',
  'admin',
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = {
  manufacturer: 'Manufacturer',
  transporter: 'Dispatcher / Carrier',
  warehouse_manager: 'Warehouse Manager',
  retailer: 'Retailer',
  admin: 'Administrator',
}

export const SHIPMENT_STATUSES = [
  'Dispatched by Manufacturer',
  'In Transit to Warehouse',
  'Received at Warehouse',
  'In Transit to Retailer',
  'Delivered to Retailer',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const PRESET_RETAILERS = [
  { id: 'ret-1', name: 'Seattle Metro Mart', defaultDemand: 45, city: 'Seattle, WA', address: '401 Pine Street, Suite 100' },
  { id: 'ret-2', name: 'Pacific Retail Depot', defaultDemand: 60, city: 'Portland, OR', address: '1220 SW Morrison Street' },
  { id: 'ret-3', name: 'Downtown Express Store', defaultDemand: 25, city: 'Tacoma, WA', address: '824 Pacific Avenue' },
  { id: 'ret-4', name: 'Northwest Tech Hub', defaultDemand: 80, city: 'Bellevue, WA', address: '500 108th Avenue NE' },
  { id: 'ret-5', name: 'Bayview Retail Outlet', defaultDemand: 35, city: 'Olympia, WA', address: '315 4th Avenue E' },
] as const

export type PresetRetailer = (typeof PRESET_RETAILERS)[number]

export type Product = {
  id: string
  name: string
  sku: string
  category: string
  description: string
  unitPrice: number
  quantity: number
  unit: string
  batchNumber: string
  color: string
  manufacturerId: string
  manufacturerName: string
  createdAt: string
  updatedAt?: string
}

export type Shipment = {
  id: string
  trackingNumber: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  source: string
  destination: string
  currentLocation: string
  status: ShipmentStatus
  // Step 1: Manufacturer
  manufacturerId: string
  manufacturerName: string
  dispatchDate: string
  // Step 2: Dispatcher
  transporterName?: string
  transporterConfirmedAt?: string
  // Step 3: Warehouse & Retailer target
  warehouseName?: string
  warehouseReceivedAt?: string
  retailerId?: string
  retailerName?: string
  retailerAddress?: string
  retailerDispatchedAt?: string
  // Step 4: Retailer Confirmation & Generated Bill
  deliveredDate?: string
  isConfirmedByRetailer?: boolean
  invoiceNumber?: string
  totalAmount?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TrackingEvent = {
  id: string
  shipmentId: string
  trackingNumber?: string
  eventType: string
  location: string
  timestamp: string
  updatedByUid: string
  updatedByName: string
  updatedByRole: UserRole
  quantity?: number
  notes: string
  createdAt?: string
}

export type InventoryItem = {
  id: string
  productId: string
  productName: string
  sku: string
  warehouseLocation?: string
  availableQuantity: number
  incomingQuantity: number
  dispatchedQuantity: number
  unit?: string
  unitPrice?: number
  updatedAt?: string
}

export type UserProfile = {
  displayName: string
  email: string
  role: UserRole
  organizationName?: string
  phone?: string
  location?: string
  createdAt: string
}

export type UserAdminView = {
  uid: string
  displayName: string
  email: string
  role: UserRole
  organizationName: string
  phone?: string
  createdAt?: string
}
