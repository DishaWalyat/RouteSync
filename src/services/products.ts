import { deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { getDb } from './firebase.ts'
import type { Product } from '../types/supplyChain.ts'
import {
  asNumber,
  asString,
  createRootRecord,
  stamp,
  updateRootRecord,
  watchRootRecords,
} from './records.ts'

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: asString(data.name),
    sku: asString(data.sku),
    category: asString(data.category) || 'General Goods',
    description: asString(data.description),
    unitPrice: asNumber(data.unitPrice) || 120,
    quantity: asNumber(data.quantity),
    unit: asString(data.unit) || 'units',
    batchNumber: asString(data.batchNumber),
    color: asString(data.color) || '#5B4BD8',
    manufacturerId: asString(data.manufacturerId),
    manufacturerName: asString(data.manufacturerName) || 'Primary Manufacturer',
    createdAt: stamp(data.createdAt),
    updatedAt: stamp(data.updatedAt),
  }
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export function watchProducts(
  onData: (rows: Product[]) => void,
  onError: (error: Error) => void,
) {
  return watchRootRecords('products', mapProduct, onData, onError)
}

export async function createProduct(input: ProductInput) {
  return createRootRecord('products', {
    ...input,
    unitPrice: Number(input.unitPrice) || 120,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  await updateRootRecord('products', id, {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(productId: string) {
  await deleteDoc(doc(getDb(), 'products', productId))
}
