import React from 'react'
import { handleDownload } from '../utils/bannerExport.js'
import { BannerArtwork } from './BannerCard.jsx'

function DownloadSelector({ svgRef, item }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="download-switcher">
      {!open ? (
        <button type="button" className="download-btn" onClick={() => setOpen(true)}>Download</button>
      ) : (
        <select
          aria-label="Export format"
          defaultValue=""
          onChange={(e) => {
            const format = e.target.value
            if (!format) return
            if (svgRef.current) handleDownload(svgRef.current, item.size, format)
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

  const formats = variants.length ? variants : [item]
  const svgRef = React.useRef(null)

  return (
    <div className="ad-detail" aria-label={`Ad detail ${item.id}`}>
      <h2>Display Ad Formats</h2>

      <div className="formats-grid">
        {formats.map((format) => (
          <article className="format-item" key={`${format.id}-${format.size.w}x${format.size.h}`}>
            <div className="format-label">{format.size.w} × {format.size.h}</div>
            <div className="format-canvas">
              <BannerArtwork
                item={{ ...format, headline: item.headline, smallPrint: item.smallPrint }}
                svgRef={format.id === item.id ? svgRef : undefined}
                className="banner-svg-actual"
              />
            </div>
          </article>
        ))}
      </div>

      <DownloadSelector svgRef={svgRef} item={item} />

      <section className="exploded-view">
        <h3>Exploded View</h3>
        <div className="exploded-canvas">
          <BannerArtwork item={item} className="banner-svg-exploded" />
        </div>
      </section>

      <div className="ad-description">
        <strong>Description:</strong> {item.description || 'No description set in CMS.'}
      </div>

      <footer className="ad-detail-footer">
        <a href={import.meta.env.VITE_PUCK_API_URL ? `${import.meta.env.VITE_PUCK_API_URL}/admin` : '#'} target="_blank" rel="noreferrer">Open Puck CMS</a>
        <button type="button" onClick={onBack}>Back to showcase</button>
      </footer>
    </div>
  )
}
