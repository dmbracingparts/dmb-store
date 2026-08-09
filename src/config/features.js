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
