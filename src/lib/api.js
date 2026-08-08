async function getJson(url) {
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request gagal (${res.status})`)
  return body
}

// In-memory, session-lived cache. The storefront catalog is read-only, so
// caching lets revisited pages render instantly (see cached* accessors, used
// by the hooks for a synchronous first paint) while fetch* still revalidates
// in the background. fetch* always hits the network and only writes on success.
const productsCache = new Map() // key: querystring -> products[]
const productCache = new Map() // key: id -> product
let categoriesCache = null

const productsKey = (params = {}) => new URLSearchParams(params).toString()

export function cachedProducts(params = {}) {
  return productsCache.get(productsKey(params))
}
export function cachedProduct(id) {
  return productCache.get(id)
}
export function cachedCategories() {
  return categoriesCache
}

export async function fetchProducts(params = {}) {
  const qs = productsKey(params)
  const body = await getJson(`/api/products${qs ? `?${qs}` : ''}`)
  productsCache.set(qs, body.products)
  return body.products
}

export async function fetchProduct(id) {
  const body = await getJson(`/api/products/${id}`)
  productCache.set(id, body.product)
  return body.product
}

export async function fetchCategories() {
  const body = await getJson('/api/categories')
  categoriesCache = body.categories
  return body.categories
}
