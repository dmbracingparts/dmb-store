import { getSql } from '../_lib/db.js'
import { listCategories } from '../_lib/categories.js'
import { json } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    const categories = await listCategories(getSql())
    json(res, 200, { categories })
  } catch (e) {
    console.error('GET /api/categories', e)
    json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
