import { getSql } from '../../_lib/db.js'
import { updateProduct, deleteProduct, validateProductInput } from '../../_lib/products.js'
import { json, requireEditorSession } from '../../_lib/http.js'
import { checkOrigin } from '../../_lib/auth.js'

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export default async function handler(req, res) {
  const auth = await requireEditorSession(req)
  if (!auth.ok) return json(res, auth.status, { error: auth.error })
  const id = req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop()
  try {
    if (req.method === 'PUT') {
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const v = validateProductInput(await readBody(req))
      if (!v.ok) return json(res, 400, { error: v.error })
      const product = await updateProduct(getSql(), id, v.value)
      if (!product) return json(res, 404, { error: 'Produk tidak ditemukan' })
      return json(res, 200, { product })
    }
    if (req.method === 'DELETE') {
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const ok = await deleteProduct(getSql(), id)
      if (!ok) return json(res, 404, { error: 'Produk tidak ditemukan' })
      return json(res, 200, { ok: true })
    }
    json(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    console.error('/api/admin/products/[id]', e)
    json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
