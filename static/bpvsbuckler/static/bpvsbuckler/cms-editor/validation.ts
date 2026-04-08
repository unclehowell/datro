export function validatePayload(payload: any): string[] {
  const errs: string[] = []
  if (!Array.isArray(payload)) {
    errs.push('Payload must be an array of timeline entries')
    return errs
  }
  payload.forEach((entry, idx) => {
    if (typeof entry.year !== 'string') errs.push(`Entry ${idx}: year must be string`)
    if (typeof entry.location !== 'string') errs.push(`Entry ${idx}: location must be string`)
    if (typeof entry.locationType !== 'string') errs.push(`Entry ${idx}: locationType must be string`)
    if (typeof entry.description !== 'string') errs.push(`Entry ${idx}: description must be string`)
    if (!Array.isArray(entry.scenes)) errs.push(`Entry ${idx}: scenes must be array`)
  })
  return errs
}
