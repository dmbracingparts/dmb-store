import { useState, useEffect } from 'react'
import {
  fetchProducts, fetchProduct, fetchCategories,
  cachedProducts, cachedProduct, cachedCategories,
} from '../lib/api.js'
import { useStore } from './StoreProvider'

// Cache-first: if the data is already in memory, render it immediately (no
// spinner) and revalidate in the background; otherwise show loading. This kills
// the loading flash on revisits without ever serving permanently stale data.
export function useProducts(params) {
  const key = JSON.stringify(params || {})
  const [state, setState] = useState(() => {
    const c = cachedProducts(params)
    return c ? { products: c, loading: false, error: null } : { products: [], loading: true, error: null }
  })
  useEffect(() => {
    let alive = true
    const c = cachedProducts(params)
    setState(c ? { products: c, loading: false, error: null } : { products: [], loading: true, error: null })
    fetchProducts(params)
      .then((products) => alive && setState({ products, loading: false, error: null }))
      .catch((error) => alive && setState((s) => (s.products.length ? s : { products: [], loading: false, error })))
    return () => { alive = false }
  }, [key])
  return state
}

export function useProduct(id) {
  const [state, setState] = useState(() => {
    const c = cachedProduct(id)
    return c ? { product: c, loading: false, error: null } : { product: null, loading: true, error: null }
  })
  useEffect(() => {
    let alive = true
    const c = cachedProduct(id)
    setState(c ? { product: c, loading: false, error: null } : { product: null, loading: true, error: null })
    fetchProduct(id)
      .then((product) => alive && setState({ product, loading: false, error: null }))
      .catch((error) => alive && setState((s) => (s.product ? s : { product: null, loading: false, error })))
    return () => { alive = false }
  }, [id])
  return state
}

export function useCategories() {
  const [state, setState] = useState(() => {
    const c = cachedCategories()
    return c ? { categories: c, loading: false, error: null } : { categories: [], loading: true, error: null }
  })
  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((categories) => alive && setState({ categories, loading: false, error: null }))
      .catch((error) => alive && setState((s) => (s.categories.length ? s : { categories: [], loading: false, error })))
    return () => { alive = false }
  }, [])
  return state
}

export function useOrders() {
  return useStore().orders
}

export function useOrder(id) {
  return useStore().orders.find((o) => o.id === id) || null
}

export function usePromos() {
  return useStore().promos
}

export function useShipping() {
  return useStore().shipping
}

export function useHomepage() {
  return useStore().homepage
}
