import React, { useEffect, useState } from 'react'
import { handleDownload } from '../utils/bannerExport.js'

// Simple text wrap for description or small print (used if needed in detail view)
function wrapText(text, maxChars) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (test.length <= maxChars) {
      line = test
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

export default function AdDetail({ item, onBack }) {
  if (!item) {
    return (
      <div className="ad-detail">
        <div className="container" style={{ padding: 20 }}>
          <p>No banner selected.</p>
          <button onClick={onBack}>Back to catalogue</button>
        </div>
      </div>
    )
  }

  const w = item.size?.w ?? 1200
  const h = item.size?.h ?? 628
  const svgRef = React.useRef(null)
  const fontH = Math.max(12, Math.floor(Math.min(w, h) / 12))
  const lines = wrapText(item.description ?? (item.headline ?? ''), 40)
  const bottomLines = wrapText(item.smallPrint ?? '', 40)
  const allLines = [...lines, ...bottomLines]
  const [enlargedW, setEnlargedW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [enlargedH, setEnlargedH] = useState(() => Math.round((h / w) * (typeof window !== 'undefined' ? window.innerWidth : 1024)))
  useEffect(() => {
    const onResize = () => {
      const ww = window.innerWidth
      setEnlargedW(ww)
      setEnlargedH(Math.round((h / w) * ww))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [w, h])

  // Description fallback content
  const description = item.description ?? (item.headline ?? '') + ' ' + (item.smallPrint ?? '')

  return (
    <div className="ad-detail" aria-label={`Ad detail ${item.id}`}>
      <div className="banner-detail" style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>Size: {w} × {h}</div>
        <svg
          ref={svgRef}
          className="banner-svg"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <image href="/background.png" x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
          <image href="/logo.svg" x={Math.max(8, w * 0.04)} y={Math.max(8, h * 0.04)} width={Math.min(160, w * 0.18)} height={Math.min(40, h * 0.1)} preserveAspectRatio="xMidYMid meet" />
          <text
            x="50%"
            y={h * 0.28}
            fill="#fff"
            textAnchor="middle"
            fontFamily="Arial"
            fontWeight="bold"
            fontSize={fontH}
            stroke="#000"
            strokeWidth={1}
          >
            {item.headline}
          </text>
          <text
            x="50%"
            y={h * 0.78}
            fill="#cccccc"
            textAnchor="middle"
            fontFamily="Arial"
            fontSize={Math.max(9, fontH * 0.45)}
            stroke="#000"
            strokeWidth={1}
          >
            {allLines.map((ln, i) => (
              <tspan key={i} x="50%" dy={i === 0 ? 0 : fontH * 1.0}>{ln}</tspan>
            ))}
          </text>
        </svg>
      </div>
      <div className="enlarged-section" style={{ padding: 20 }}>
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Enlarged View</div>
        <div className="enlarged-banner" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <svg width={enlargedW} height={enlargedH} viewBox={`0 0 ${enlargedW} ${enlargedH}`} xmlns="http://www.w3.org/2000/svg">
            <image href="/background.png" x={0} y={0} width={enlargedW} height={enlargedH} preserveAspectRatio="xMidYMid slice" />
            <image href="/logo.svg" x={Math.max(8, enlargedW * 0.04)} y={Math.max(8, enlargedH * 0.04)} width={Math.min(160, enlargedW * 0.18)} height={Math.min(40, enlargedH * 0.1)} preserveAspectRatio="xMidYMid meet" />
            <text
              x="50%"
              y={enlargedH * 0.28}
              fill="#fff"
              textAnchor="middle"
              fontFamily="Arial"
              fontWeight="bold"
              fontSize={Math.max(12, Math.floor(Math.min(enlargedW, enlargedH) / 12))}
              stroke="#000"
              strokeWidth={1}
            >
              {item.headline}
            </text>
            <text
              x="50%"
              y={enlargedH * 0.78}
              fill="#cccccc"
              textAnchor="middle"
              fontFamily="Arial"
              fontSize={Math.max(9, Math.floor(Math.min(enlargedW, enlargedH) / 28))}
              stroke="#000"
              strokeWidth={1}
            >
              {allLines.map((ln, i) => (
                <tspan key={i} x="50%" dy={i === 0 ? 0 : (Math.max(9, Math.floor(Math.min(enlargedW, enlargedH) / 28)))}>{ln}</tspan>
              ))}
            </text>
          </svg>
        </div>
      </div>
      <div className="ad-detail-content" style={{ padding: 20 }}>
        <div className="ad-description" style={{ marginBottom: 12 }}>
          <strong>Description:</strong>
          <div style={{ marginTop: 6, color: '#333' }}>{description}</div>
        </div>
        <div className="download-area" style={{ marginTop: 8 }}>
          <label htmlFor={`export-${item.id}`}>Export format:</label>
          <select id={`export-${item.id}`} onChange={(e) => { const fmt = e.target.value; const el = svgRef.current; if (el) handleDownload(el, item.size, fmt); }} defaultValue="svg" aria-label="Export format" style={{ marginLeft: 8 }}>
            <option value="svg">SVG</option>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>
      <footer className="ad-detail-footer" style={{ padding: 20, borderTop: '1px solid #eee' }}>
        <a href={import.meta.env.VITE_PUCK_API_URL ? `${import.meta.env.VITE_PUCK_API_URL}/admin/edit-banner/${item.id}` : '#'} target="_blank" rel="noreferrer">CMS</a>
        <span style={{ marginLeft: 12 }}>
          <button onClick={onBack}>Back to catalogue</button>
        </span>
      </footer>
    </div>
  )
}
