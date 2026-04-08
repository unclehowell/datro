import type { TimelineEntry } from './types'
import { TIMELINE as GENERATED_TIMELINE } from './static/bpvsbuckler/timeline_from_json.generated'

// Runtime script timeline loader that favors a published script from localStorage
export function validateTimelinePayload(payload: any): string[] {
  const errors: string[] = []
  if (!Array.isArray(payload)) {
    errors.push('Payload must be an array of timeline entries')
    return errors
  }
  payload.forEach((entry, idx) => {
    if (typeof entry.year !== 'string') errors.push(`Entry ${idx}: year must be a string`)
    if (typeof entry.location !== 'string') errors.push(`Entry ${idx}: location must be a string`)
    if (typeof entry.locationType !== 'string') errors.push(`Entry ${idx}: locationType must be a string`)
    if (typeof entry.narration !== 'string') errors.push(`Entry ${idx}: narration must be a string`)
    if (!Array.isArray(entry.scenes)) errors.push(`Entry ${idx}: scenes must be an array`)
  })
  return errors
}

export function getPublishedTimeline(): TimelineEntry[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('script_payload')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const errs = validateTimelinePayload(parsed)
    if (errs.length > 0) return null
    return parsed as TimelineEntry[]
  } catch {
    return null
  }
}

export function getScriptTimeline(): TimelineEntry[] {
  const published = getPublishedTimeline()
  if (published && published.length > 0) return published
  // Fallback to generated timeline from JSON
  return GENERATED_TIMELINE
}
