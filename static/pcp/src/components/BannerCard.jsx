import React from 'react'
import { handleDownload } from '../utils/bannerExport.js'

export default function BannerCard({ item, smallPrint, onOpen, onOpenModal }) {
  const svgRef = React.useRef(null)
  const w = item.size.w
  const h = item.size.h
  const fontH = Math.max(12, Math.floor(Math.min(w, h) / 12))
  const headline = item.headline
  const print = smallPrint || ''

  // Simple text wrap for the small print; keep it within the bottom 25% area
  const wrapText = (text, maxChars) => {
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
  const printLines = wrapText(print, 40)
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onOpen?.(item.id)
    }
  }
  // bottom print overlay styling (computed in render)
  const bottomFont = Math.min(12, Math.floor(h * 0.15))
  const bottomStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '6px 12px',
    fontSize: bottomFont,
    textAlign: 'justify',
    textJustify: 'inter-word',
    color: '#ddd',
    background: 'rgba(0,0,0,0.25)',
    borderTop: '1px solid rgba(0,0,0,.4)'
  }
  return (
    <div className="banner-card" aria-label={`Banner ${item.id}`} role="button" tabIndex={0} onClick={() => onOpen?.(item.id)} onDoubleClick={() => onOpenModal?.(item)} onKeyDown={handleKey} style={{ cursor: 'pointer', position: 'relative' }}>
      <div className="svg-wrap" style={{ background: '#111' }}>
        <svg
          ref={svgRef}
          className="banner-svg"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background image for all ads */}
          <image href="/background.png" x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
          {/* Logo from root/logo.svg */}
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
            {headline}
          </text>
          
        </svg>
      </div>
      <div className="banner-bottom" style={bottomStyle}>{print}</div>
      <div className="controls" aria-label="Export format" style={{ justifyContent: 'center' }}>
        <select onChange={(e) => { const fmt = e.target.value; const el = svgRef.current; if (el) handleDownload(el, item.size, fmt); }} defaultValue="svg" aria-label="Export format" style={{ marginLeft: 8 }}>
          <option value="svg">SVG</option>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
    </div>
  )
}
