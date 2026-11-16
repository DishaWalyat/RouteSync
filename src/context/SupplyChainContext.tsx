import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { watchProducts } from '../services/products.ts'
import { watchShipments } from '../services/shipments.ts'
import type { Product, Shipment } from '../types/supplyChain.ts'
import { useAuth } from './AuthContext.tsx'

export type SupplyChainStats = {
  totalProducts: number
  pendingCarrierPickup: number
  inTransitToWarehouse: number
  receivedAtWarehouse: number
  inTransitToRetailer: number
  deliveredToRetailer: number
  totalShipments: number
}

type SupplyChainState = {
  products: Product[]
  shipments: Shipment[]
  loading: boolean
  error: string
  stats: SupplyChainStats
}

const SupplyChainContext = createContext<SupplyChainState | null>(null)

export function SupplyChainProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setProducts([])
      setShipments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const unsubs: Array<() => void> = []

    const onError = (err: Error) => {
      console.warn('SupplyChain listener warning:', err.message)
      setError(err.message)
    }

    try {
      unsubs.push(
        watchProducts(
          (rows) => setProducts(rows),
          onError,
        ),
      )
      unsubs.push(
        watchShipments(
          (rows) => setShipments(rows),
          onError,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect listeners')
    }

    const timer = setTimeout(() => setLoading(false), 500)

    return () => {
      clearTimeout(timer)
      for (const unsub of unsubs) {
        try {
          unsub()
        } catch {}
      }
    }
  }, [user])

  const stats = useMemo<SupplyChainStats>(() => {
    let pendingCarrier = 0
    let inTransitWh = 0
    let inWarehouse = 0
    let inTransitRet = 0
    let delivered = 0

    for (const s of shipments) {
      if (s.status === 'Dispatched by Manufacturer') pendingCarrier++
      else if (s.status === 'In Transit to Warehouse') inTransitWh++
      else if (s.status === 'Received at Warehouse') inWarehouse++
      else if (s.status === 'In Transit to Retailer') inTransitRet++
      else if (s.status === 'Delivered to Retailer') delivered++
    }

    return {
      totalProducts: products.length,
      pendingCarrierPickup: pendingCarrier,
      inTransitToWarehouse: inTransitWh,
      receivedAtWarehouse: inWarehouse,
      inTransitToRetailer: inTransitRet,
      deliveredToRetailer: delivered,
      totalShipments: shipments.length,
    }
  }, [shipments, products])

  const value = useMemo<SupplyChainState>(
    () => ({
      products,
      shipments,
      loading,
      error,
      stats,
    }),
    [products, shipments, loading, error, stats],
  )

  return (
    <SupplyChainContext.Provider value={value}>
      {children}
    </SupplyChainContext.Provider>
  )
}

export function useSupplyChain() {
  const ctx = useContext(SupplyChainContext)
  if (!ctx) {
    throw new Error('useSupplyChain must be used within a SupplyChainProvider')
  }
  return ctx
}
