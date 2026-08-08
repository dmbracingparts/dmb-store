import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shapeProduct, validateProductInput } from '../api/_lib/products.js'

test('shapeProduct maps columns and children to UI shape', () => {
  const row = {
    id: 'p1', sku: 'S1', name: 'Kampas', slug: 'kampas', brand: 'NHK',
    category_id: 'mesin', price: 85000, description: 'desc',
    video_url: null, published: true, is_featured: true, featured_order: 1,
    images: ['a.png', 'b.png'], compat: ['Vario 125'],
  }
  const p = shapeProduct(row)
  assert.equal(p.category, 'mesin')
  assert.equal(p.videoUrl, null)
  assert.equal(p.isFeatured, true)
  assert.deepEqual(p.images, ['a.png', 'b.png'])
  assert.deepEqual(p.compatibleWith, ['Vario 125'])
  assert.equal('rating' in p, false)
})

test('shapeProduct parses json-string children and defaults to empty arrays', () => {
  const base = {
    id: 'p2', sku: 'S2', name: 'X', slug: 'x', brand: 'B',
    category_id: 'mesin', price: 1, description: null, video_url: null,
    published: true, is_featured: false, featured_order: null,
  }
  const asString = shapeProduct({ ...base, images: '["a.png"]', compat: '["Vario"]' })
  assert.deepEqual(asString.images, ['a.png'])
  assert.deepEqual(asString.compatibleWith, ['Vario'])
  const missing = shapeProduct(base)
  assert.deepEqual(missing.images, [])
  assert.deepEqual(missing.compatibleWith, [])
})

test('validateProductInput rejects missing required fields', () => {
  const r = validateProductInput({ name: '', price: 1 })
  assert.equal(r.ok, false)
})

test('validateProductInput accepts a valid product', () => {
  const r = validateProductInput({
    id: 'p9', sku: 'S9', name: 'X', brand: 'B', category: 'mesin',
    price: 1000, stock: 5, images: ['a.png'], compatibleWith: ['Vario'],
  })
  assert.equal(r.ok, true)
  assert.equal(r.value.slug, 'x')
})
