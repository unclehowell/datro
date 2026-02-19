import React from 'react'

function wrapWords(text, maxCharsPerLine, maxLines) {
  if (!text) return []
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length <= maxCharsPerLine || !line) {
      line = next
    } else {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    }
  }

  if (line && lines.length < maxLines) lines.push(line)
  if (lines.length === maxLines && words.length > 0) {
    const consumed = lines.join(' ').split(/\s+/).length
    if (consumed < words.length) lines[maxLines - 1] = `${lines[maxLines - 1]}…`
  }
  return lines
}

export function BannerArtwork({ item, svgRef }) {
  const w = item.size.w
  const h = item.size.h
  const headlineSize = Math.max(16, Math.floor(Math.min(w, h) * 0.16))
  const headlineLines = wrapWords(item.headline || '', Math.max(10, Math.floor(w / (headlineSize * 0.62))), 2)
  const smallPrintSize = Math.min(10, Math.max(6, Math.floor(h * 0.03)))
  const smallPrintHeight = Math.floor(h * 0.15)

  return (
    <svg
      ref={svgRef}
      className="banner-svg"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href="/background.png" x={0} y={0} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
      <image href="/logo.svg" x={Math.max(8, w * 0.04)} y={Math.max(8, h * 0.04)} width={Math.min(170, w * 0.2)} height={Math.min(56, h * 0.14)} preserveAspectRatio="xMidYMid meet" />
      <text
        x="50%"
        y={h * 0.34}
        fill="#fff"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontSize={headlineSize}
        stroke="#000"
        strokeWidth={Math.max(1, Math.floor(headlineSize * 0.06))}
        paintOrder="stroke"
      >
        {headlineLines.map((line, i) => (
          <tspan key={line + i} x="50%" dy={i === 0 ? 0 : headlineSize * 1.05}>{line}</tspan>
        ))}
      </text>
      <foreignObject x={Math.max(6, w * 0.02)} y={h - smallPrintHeight} width={w - Math.max(12, w * 0.04)} height={smallPrintHeight}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          color: '#e8e8e8',
          fontFamily: 'Arial, sans-serif',
          fontSize: `${smallPrintSize}px`,
          lineHeight: 1.1,
          textAlign: 'justify',
          textJustify: 'inter-word',
          overflow: 'hidden',
          paddingBottom: '1px',
        }}>
          {item.smallPrint || ''}
        </div>
      </foreignObject>
    </svg>
  )
}

export default function BannerCard({ item, onOpen, onDoubleOpen, footer }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') onOpen?.(item.id)
  }

  return (
    <div
      className="banner-card"
      aria-label={`Banner ${item.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item.id)}
      onDoubleClick={() => onDoubleOpen?.(item.id)}
      onKeyDown={handleKey}
      style={{ cursor: 'pointer' }}
    >
      <div className="svg-wrap">
        <BannerArtwork item={item} />
      </div>
      {footer ? <div className="banner-card-footer">{footer}</div> : null}
    </div>
  )
}
