function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Reads fetch images/compat as aggregated json arrays on the product row, so a
// listing is one DB round trip instead of three. The neon HTTP driver parses
// json columns to JS arrays, but guard for a string just in case.
const toArray = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? JSON.parse(v) : [])

export function shapeProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    category: row.category_id,
    price: row.price,
    description: row.description,
    videoUrl: row.video_url,
    published: row.published,
    isFeatured: row.is_featured,
    featuredOrder: row.featured_order,
    images: toArray(row.images),
    compatibleWith: toArray(row.compat),
  }
}

export function validateProductInput(data) {
  const required = ['sku', 'name', 'category', 'price']
  for (const key of required) {
    if (data[key] === undefined || data[key] === null || data[key] === '') {
      return { ok: false, error: `Field '${key}' wajib diisi.` }
    }
  }
  if (typeof data.price !== 'number' || data.price < 0) {
    return { ok: false, error: "Field 'price' harus angka >= 0." }
  }
  const value = {
    id: data.id,
    sku: String(data.sku),
    name: String(data.name),
    slug: data.slug ? slugify(data.slug) : slugify(data.name),
    brand: data.brand ?? null,
    category: String(data.category),
    price: data.price,
    description: data.description ?? null,
    videoUrl: data.videoUrl ?? null,
    published: data.published ?? true,
    isFeatured: data.isFeatured ?? false,
    featuredOrder: data.featuredOrder ?? null,
    images: Array.isArray(data.images) ? data.images : [],
    compatibleWith: Array.isArray(data.compatibleWith) ? data.compatibleWith : [],
  }
  return { ok: true, value }
}

export async function listProducts(sql, { publishedOnly = false, category, q, featured } = {}) {
  const rows = await sql`
    select p.*,
      coalesce((select json_agg(i.url order by i.position)
                from product_images i where i.product_id = p.id), '[]'::json) as images,
      coalesce((select json_agg(c.model)
                from product_compatibility c where c.product_id = p.id), '[]'::json) as compat
    from products p
    where (${!publishedOnly} or p.published = true)
      and (${category ?? null}::text is null or p.category_id = ${category ?? null})
      and (${q ?? null}::text is null or p.name ilike ${'%' + (q ?? '') + '%'})
      and (${featured ?? null}::bool is null or p.is_featured = ${featured ?? null})
    order by coalesce(p.featured_order, 999999), p.created_at desc`
  return rows.map(shapeProduct)
}

export async function getProduct(sql, id) {
  const rows = await sql`
    select p.*,
      coalesce((select json_agg(i.url order by i.position)
                from product_images i where i.product_id = p.id), '[]'::json) as images,
      coalesce((select json_agg(c.model)
                from product_compatibility c where c.product_id = p.id), '[]'::json) as compat
    from products p where p.id = ${id}`
  if (rows.length === 0) return null
  return shapeProduct(rows[0])
}

// Build the child-row replacement as an array of statements so they run in a
// single transaction (atomic: never delete-then-fail-to-reinsert).
function childStatements(sql, id, images, compat) {
  const stmts = [
    sql`delete from product_images where product_id = ${id}`,
    sql`delete from product_compatibility where product_id = ${id}`,
  ]
  images.forEach((url, i) => {
    stmts.push(sql`insert into product_images (product_id, url, position) values (${id}, ${url}, ${i})`)
  })
  compat.forEach((model) => {
    stmts.push(sql`insert into product_compatibility (product_id, model) values (${id}, ${model})`)
  })
  return stmts
}

export async function createProduct(sql, v) {
  const id = v.id || v.sku.toLowerCase()
  await sql.transaction([
    sql`insert into products
      (id, sku, name, slug, brand, category_id, price, description, video_url, published, is_featured, featured_order)
      values (${id}, ${v.sku}, ${v.name}, ${v.slug}, ${v.brand}, ${v.category}, ${v.price},
              ${v.description}, ${v.videoUrl}, ${v.published}, ${v.isFeatured}, ${v.featuredOrder})`,
    ...childStatements(sql, id, v.images, v.compatibleWith),
  ])
  return getProduct(sql, id)
}

export async function updateProduct(sql, id, v) {
  const rows = await sql`update products set
    sku = ${v.sku}, name = ${v.name}, slug = ${v.slug}, brand = ${v.brand},
    category_id = ${v.category}, price = ${v.price},
    description = ${v.description}, video_url = ${v.videoUrl}, published = ${v.published},
    is_featured = ${v.isFeatured}, featured_order = ${v.featuredOrder}, updated_at = now()
    where id = ${id} returning id`
  if (rows.length === 0) return null
  await sql.transaction(childStatements(sql, id, v.images, v.compatibleWith))
  return getProduct(sql, id)
}

export async function deleteProduct(sql, id) {
  const rows = await sql`delete from products where id = ${id} returning id`
  return rows.length > 0
}
