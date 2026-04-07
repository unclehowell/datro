import React, { useEffect, useState } from 'react'
import type { TimelineEntry } from '../../types'
import { validatePayload } from './validation'
import { getPublishedTimeline, getScriptTimeline } from '../script-loader'

// Simple CMS Script Uploader: uploads a JSON payload, validates, and publishes to localStorage
export const ScriptUploader: React.FC = () => {
  const [raw, setRaw] = useState<string>('')
  const [data, setData] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [published, setPublished] = useState<boolean>(false)

  useEffect(() => {
    const existing = localStorage.getItem('script_payload')
    if (existing) {
      setRaw(existing)
      try { setData(JSON.parse(existing)) } catch {}
    }
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      const text = String(r.result)
      setRaw(text)
      try {
        const parsed = JSON.parse(text)
        setData(parsed)
        const errs = validatePayload(parsed)
        setErrors(errs)
        setPublished(false)
      } catch (err) {
        setErrors(['Invalid JSON'])
        setData(null)
      }
    }
    r.readAsText(f)
  }

  function onTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const t = e.target.value
    setRaw(t)
    try {
      const parsed = JSON.parse(t)
      setData(parsed)
      const errs = validatePayload(parsed)
      setErrors(errs)
      setPublished(false)
    } catch {
      setErrors(['Invalid JSON'])
      setData(null)
    }
  }

  function publish() {
    if (!data) return
    const errs = validatePayload(data)
    setErrors(errs)
    if (errs.length === 0) {
      localStorage.setItem('script_payload', raw)
      setPublished(true)
      alert('Script published to local CMS storage (script_payload).')
    }
  }

  // For previewing, also fetch the current published timeline from storage if any.
  const currentTimeline = getPublishedTimeline() || getScriptTimeline()

  return (
    <div style={{ border: '1px solid #2c3e50', padding: 12, borderRadius: 8, marginTop: 12 }}>
      <h3>CMS Script Editor</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input type="file" accept="application/json" onChange={onFileChange} />
        <span style={{ fontSize: 12, color: '#888' }}>Upload a JSON file containing the script timeline.</span>
      </div>
      <textarea value={raw} onChange={onTextChange} placeholder="Paste or edit the JSON script here" rows={14} style={{ width: '100%', marginTop: 8 }} />
      <div>
        <strong>Validation</strong>
        {errors.length === 0 ? (
          <span style={{ marginLeft: 8, color: '#2ecc71' }}>OK</span>
        ) : (
          <span style={{ marginLeft: 8, color: '#e74c3c' }}>{errors.length} error(s)</span>
        )}
      </div>
      {errors.length > 0 && (
        <ul style={{ color: '#e74c3c', marginTop: 6 }}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => { const errs = (validatePayload as any)(data); setErrors(errs); }}>
          Validate
        </button>
        <button onClick={publish} disabled={errors.length > 0} title="Publish to local storage so the frontend can read it">
          Publish
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>
          Current source: {currentTimeline ? 'Loaded' : 'None'}
        </span>
      </div>
      {published && <div style={{ color: '#2ecc71', marginTop: 6 }}>Script published. Reload front-end to pick up changes.</div>}
    </div>
  )
}

export default ScriptUploader
