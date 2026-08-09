// Feature flags for the catalog-only phase.
//
// While we rework the storefront into a landing-page catalog, the customer
// commerce + auth flows (login, cart, checkout, account) are hidden. Flip
// CATALOG_ONLY back to false to restore all of them at once — no other code
// needs to change.
export const CATALOG_ONLY = true

// Store WhatsApp used by the "Hubungi" CTA while checkout is disabled.
// Format: country code + number, no "+" or leading 0 (wa.me format).
export const STORE_WHATSAPP = '6281234567890'

// Public storefront, linked from the admin ("Lihat Storefront" / the sidebar
// banner). Lives here rather than in each component: it was duplicated in two
// files and both still pointed at the old dmb-store.vercel.app preview domain
// long after the shop moved to its own.
export const STOREFRONT_URL = 'https://dmbracingparts.com'
