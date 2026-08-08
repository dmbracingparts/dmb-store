import { getSql } from '../_lib/db.js'
import { listProducts } from '../_lib/products.js'
import { json } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://x')
    const products = await listProducts(getSql(), {
      publishedOnly: true,
      category: url.searchParams.get('category') || undefined,
      q: url.searchParams.get('q') || undefined,
      featured: url.searchParams.get('featured') === 'true' ? true : undefined,
    })
    json(res, 200, { products })
  } catch (e) {
    console.error('GET /api/products', e)
    json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
