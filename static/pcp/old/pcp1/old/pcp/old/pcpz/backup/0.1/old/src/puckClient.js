// Simple Puck CMS client (content fetcher)
// This module fetches banner items from a Puck CMS instance when configured.
// Environment (Vite):
//   VITE_PUCK_API_URL: base URL for the Puck CMS API
//   VITE_PUCK_API_TOKEN: bearer token if required
// Returns an array of banner-like records: [{ id, size: {w,h}, headline, smallPrint, background }]

async function tryFetch(url, headers = {}) {
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  return data
}

function normalizeBanner(rec, idx) {
  // Accept multiple CMS shapes
  const id = rec.id ?? idx + 1
  const attrs = rec.attributes ?? rec
  const headline = attrs.headline ?? attrs.title ?? rec.headline ?? ''
  const smallPrint = attrs.smallPrint ?? attrs.description ?? rec.smallPrint ?? ''
  const background = attrs.backgroundColor ?? attrs.background ?? rec.background ?? '#333'
  const size = attrs.size ?? { w: 1200, h: 628 }
  // Normalize size fields
  const w = size.w ?? size.width ?? 1200
  const h = size.h ?? size.height ?? 628
  const description = attrs.description ?? rec.description ?? ''
  return {
    id,
    size: { w, h },
    headline,
    smallPrint,
    background,
    description,
  }
}

export async function fetchBanners() {
  const api = import.meta.env.VITE_PUCK_API_URL
  const token = import.meta.env.VITE_PUCK_API_TOKEN
  if (!api) {
    // No CMS configured; return empty to let UI fall back to local data
    return []
  }
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  // Try a few known common endpoints to maximize compatibility
  const endpoints = [
    '/banners',
    '/collections/banners/entries',
    '/api/banners',
    '/content/banners',
  ]
  let data = null
  for (const p of endpoints) {
    try {
      data = await tryFetch(`${api}${p}`, headers)
      if (data) break
    } catch {
      // try next
    }
  }
  if (!data) return []
  // Normalize to a flat array of banner-like objects
  const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
  const banners = items.map((rec, idx) => normalizeBanner(rec, idx))
  // Some APIs wrap in { data: [...] }
  if (banners.length === 0 && Array.isArray(data)) {
    return data.map((rec, idx) => normalizeBanner(rec, idx))
  }
  return banners
}

// Convenience: fetch a single banner by id (CMS-backed if available)
export async function fetchBannerById(id) {
  const banners = await fetchBanners()
  return banners.find((b) => b.id === Number(id)) || null
}
