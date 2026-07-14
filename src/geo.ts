import type { Geo } from './types'

/** Grab a one-shot GPS fix. Resolves null if unavailable or denied. */
export function getCurrentLocation(): Promise<Geo | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  })
}

/**
 * Best-effort reverse geocode to a short human place name via OpenStreetMap.
 * Returns '' on any failure (offline, blocked, rate-limited) so callers can
 * simply fall back to coordinates.
 */
export async function reverseGeocode(geo: Geo): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${geo.lat}&lon=${geo.lng}&zoom=18`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return ''
    const data = (await res.json()) as { address?: Record<string, string> }
    const a = data.address ?? {}
    // Prefer a house-number + street, else a named place / suburb.
    const street = [a.house_number, a.road].filter(Boolean).join(' ')
    return street || a.building || a.suburb || a.neighbourhood || a.city || ''
  } catch {
    return ''
  }
}

export function mapsLink(geo: Geo): string {
  return `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`
}

export function formatCoords(geo: Geo): string {
  return `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`
}
