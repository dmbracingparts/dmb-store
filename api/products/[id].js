import { getSql } from '../_lib/db.js'
import { getProduct } from '../_lib/products.js'
import { json } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    const id = req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop()
    const product = await getProduct(getSql(), id, { publishedOnly: true })
    if (!product) return json(res, 404, { error: 'Produk tidak ditemukan' })
    json(res, 200, { product })
  } catch (e) {
    console.error('GET /api/products/[id]', e)
    json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
