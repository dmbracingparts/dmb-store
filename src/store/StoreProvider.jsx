import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loadData, saveData, clearData } from './seed'
import { generateOrderNumber } from '../utils/orderNumber'
import { adminListProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../lib/adminApi'
import { fetchCategories } from '../lib/api'

const IS_ADMIN = import.meta.env.VITE_APP_TARGET === 'admin'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => loadData())
  // Only the admin build fetches products/categories from the API; pages read
  // this to show skeletons instead of an empty catalog flash.
  const [catalogLoading, setCatalogLoading] = useState(IS_ADMIN)

  useEffect(() => {
    saveData(data)
  }, [data])

  // Admin build: load real products/categories from the API so admin edits
  // persist to the Neon database (see src/lib/adminApi.js).
  //
  // Called by AuthProvider once a session exists — NOT on mount. /api/admin/products
  // is session-gated, so fetching on mount 401s for anyone who arrives via the
  // login form, and nothing ever retried: the dashboard stayed at 0 products
  // until a full page reload. Keyed on the user id there, so it also refetches
  // when a different account signs in.
  const loadCatalog = useCallback(() => {
    setCatalogLoading(true)
    return Promise.all([adminListProducts(), fetchCategories()])
      .then(([products, categories]) => setData((d) => ({ ...d, products, categories })))
      .catch((e) => console.error('admin data load failed', e))
      .finally(() => setCatalogLoading(false))
  }, [])

  // Products — the storefront reads products/categories from the API (see
  // src/store/hooks.js). In the admin build these mutators are API-backed;
  // otherwise they fall back to the local seed store, defensively guarded
  // since the local seed no longer carries products/categories.
  const addProduct = async (product) => {
    if (IS_ADMIN) {
      const created = await adminCreateProduct(product)
      setData((d) => ({ ...d, products: [...(d.products || []), created] }))
      return created
    }
    setData((d) => ({ ...d, products: [...(d.products || []), product] }))
  }
  const updateProduct = async (id, patch) => {
    if (IS_ADMIN) {
      const current = (data.products || []).find((p) => p.id === id)
      const saved = await adminUpdateProduct(id, { ...current, ...patch })
      setData((d) => ({ ...d, products: (d.products || []).map((p) => (p.id === id ? saved : p)) }))
      return saved
    }
    setData((d) => ({ ...d, products: (d.products || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  }
  const deleteProduct = async (id) => {
    if (IS_ADMIN) {
      await adminDeleteProduct(id)
      setData((d) => ({ ...d, products: (d.products || []).filter((p) => p.id !== id) }))
      return
    }
    setData((d) => ({ ...d, products: (d.products || []).filter((p) => p.id !== id) }))
  }

  // Users
  const addUser = (user) => {
    setData((d) => ({ ...d, users: [...d.users, user] }))
    return user
  }
  const updateUser = (id, patch) =>
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
  const setDefaultAddress = (userId, address) => {
    setData((d) => ({
      ...d,
      users: d.users.map((u) =>
        u.id === userId
          ? { ...u, addresses: [...u.addresses, address], defaultAddressId: address.id }
          : u,
      ),
    }))
    return address
  }

  // Orders
  const createOrder = (orderInput) => {
    const order = {
      tracking: null,
      ...orderInput,
      id: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: orderInput.status, at: new Date().toISOString() }],
    }
    setData((d) => ({ ...d, orders: [order, ...d.orders] }))
    return order
  }
  const updateOrderStatus = (id, status, extra = {}) =>
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) =>
        o.id === id
          ? { ...o, ...extra, status, statusHistory: [...o.statusHistory, { status, at: new Date().toISOString() }] }
          : o,
      ),
    }))

  // Homepage
  const updateHomepage = (patch) =>
    setData((d) => ({ ...d, homepage: { ...d.homepage, ...patch } }))

  const resetStore = () => setData(clearData())

  const value = {
    data,
    products: data.products || [],
    categories: data.categories || [],
    catalogLoading,
    loadCatalog,
    users: data.users,
    orders: data.orders,
    promos: data.promos,
    shipping: data.shipping,
    homepage: data.homepage,
    addProduct,
    updateProduct,
    deleteProduct,
    addUser,
    updateUser,
    setDefaultAddress,
    createOrder,
    updateOrderStatus,
    updateHomepage,
    resetStore,
  }

  // Dev convenience: allow resetting the demo store from the browser console.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__dmbReset = resetStore
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
