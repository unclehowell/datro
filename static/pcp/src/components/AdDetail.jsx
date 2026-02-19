import React from 'react'
import { handleDownload } from '../utils/bannerExport.js'
import { BannerArtwork } from './BannerCard.jsx'

function DownloadSelector({ svgRef, item }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="download-switcher">
      {!open ? (
        <button className="download-btn" onClick={() => setOpen(true)}>Download</button>
      ) : (
        <select
          aria-label="Export format"
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return
            if (svgRef.current) handleDownload(svgRef.current, item.size, e.target.value)
            e.target.value = ''
          }}
        >
          <option value="" disabled>Select format</option>
          <option value="svg">SVG</option>
          <option value="png">PNG</option>
        </select>
      )}
    </div>
  )
}

export default function AdDetail({ item, variants = [], onBack }) {
  if (!item) return null

  const allFormats = variants.length ? variants : [item]
  const svgRef = React.useRef(null)

  return (
    <div className="ad-detail" aria-label={`Ad detail ${item.id}`}>
      <h2>Display Ad Formats</h2>
      <div className="formats-grid">
        {allFormats.map((format) => (
          <div className="format-item" key={format.id}>
            <div className="format-label">{format.size.w} × {format.size.h}</div>
            <div className="format-canvas">
              <BannerArtwork item={{ ...format, headline: item.headline, smallPrint: item.smallPrint }} svgRef={format.id === item.id ? svgRef : undefined} />
            </div>
          </div>
        ))}
      </div>

      <DownloadSelector svgRef={svgRef} item={item} />

      <section className="exploded-view">
        <h3>Exploded View</h3>
        <div className="exploded-canvas">
          <svg width="100%" viewBox={`0 0 ${item.size.w} ${item.size.h}`} xmlns="http://www.w3.org/2000/svg">
            <image href="/background.png" x={0} y={0} width={item.size.w} height={item.size.h} preserveAspectRatio="xMidYMid slice" />
            <rect x="0" y="0" width={item.size.w} height={item.size.h} fill="none" stroke="#fff" strokeWidth="5" />
            <text x="50%" y="12%" fill="#fff" textAnchor="middle" fontSize="42" fontWeight="800">{item.headline}</text>
            <line x1="0" y1="85%" x2="100%" y2="85%" stroke="#fff" strokeDasharray="14 8" />
            <text x="50%" y="95%" fill="#ddd" textAnchor="middle" fontSize="18">{item.smallPrint}</text>
          </svg>
        </div>
      </section>

      <div className="ad-description">
        <strong>Description:</strong> {item.description || 'No description set in CMS.'}
      </div>

      <footer className="ad-detail-footer">
        <a href={import.meta.env.VITE_PUCK_API_URL ? `${import.meta.env.VITE_PUCK_API_URL}/admin` : '#'} target="_blank" rel="noreferrer">Open Puck CMS</a>
        <button onClick={onBack}>Back to showcase</button>
      </footer>
    </div>
  )
}
