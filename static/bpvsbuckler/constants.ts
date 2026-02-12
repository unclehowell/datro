import { TimelineEntry } from './types'
import { TIMELINE as TIMELINE_FROM_JSON } from './timeline_from_json'
import { TIMELINE as TIMELINE_FROM_GENERATED } from './static/bpvsbuckler/timeline_from_json.generated'

// Prefer generated timeline if present; otherwise fall back to original data
export const TIMELINE: TimelineEntry[] = (TIMELINE_FROM_GENERATED && TIMELINE_FROM_GENERATED.length > 0)
  ? TIMELINE_FROM_GENERATED
  : TIMELINE_FROM_JSON
