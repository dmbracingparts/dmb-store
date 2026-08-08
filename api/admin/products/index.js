import { getSql } from '../../_lib/db.js'
import { listProducts, createProduct, validateProductInput } from '../../_lib/products.js'
import { json, requireAdminSession, requireEditorSession } from '../../_lib/http.js'
import { checkOrigin } from '../../_lib/auth.js'

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Read is open to any authenticated staff (incl. viewer, read-only).
      const auth = await requireAdminSession(req)
      if (!auth.ok) return json(res, auth.status, { error: auth.error })
      const products = await listProducts(getSql(), { publishedOnly: false })
      return json(res, 200, { products })
    }
    if (req.method === 'POST') {
      const auth = await requireEditorSession(req)
      if (!auth.ok) return json(res, auth.status, { error: auth.error })
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const v = validateProductInput(await readBody(req))
      if (!v.ok) return json(res, 400, { error: v.error })
      const product = await createProduct(getSql(), v.value)
      return json(res, 201, { product })
    }
    json(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    console.error('/api/admin/products', e)
    json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
