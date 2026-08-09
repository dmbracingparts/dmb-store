import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { apiBridge } from './dev/api-bridge.js'

// One repo, two builds. VITE_APP_TARGET selects which app the single entry
// (src/main.jsx → '@app') resolves to. Because the alias points at exactly one
// file, Rollup only ever walks that app's module graph — the other app is
// structurally excluded from the bundle, not merely dead-code-eliminated.
//
//   VITE_APP_TARGET=admin  → admin dashboard
//   (unset / anything else) → public storefront catalog
const target = process.env.VITE_APP_TARGET === 'admin' ? 'admin' : 'storefront'
const appEntry = target === 'admin' ? './src/AdminApp.jsx' : './src/StorefrontApp.jsx'

// Keep the admin panel out of search results. Both builds share one index.html,
// so this MUST stay conditional — putting the tag in index.html directly would
// de-index the storefront too, which is the opposite of what a shop wants.
// Injected into the static HTML so crawlers see it without running any JS.
function adminNoindex() {
  return {
    name: 'admin-noindex',
    transformIndexHtml(html) {
      if (target !== 'admin') return html
      return html.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n  </head>')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env* including non-VITE keys so the dev API bridge (dev/api-bridge.js)
  // can reach Neon and honour the admin auth gate locally. These never ship to
  // the client — only VITE_-prefixed vars do.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL
  if (env.SESSION_SECRET) process.env.SESSION_SECRET = env.SESSION_SECRET
  // The admin dev server (dev:admin) enables the write endpoints locally.
  process.env.APP_TARGET = target === 'admin' ? 'admin' : env.APP_TARGET || ''

  return {
    plugins: [react(), apiBridge(), adminNoindex()],
    resolve: {
      alias: {
        '@app': fileURLToPath(new URL(appEntry, import.meta.url)),
      },
    },
  }
})
