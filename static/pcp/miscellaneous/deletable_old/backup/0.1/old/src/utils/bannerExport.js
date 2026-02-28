// Shared banner export utilities (SVG/PNG/JPEG/PDF)
// Exports are used by both BannerCard and AdDetail components.

export async function downloadSVG(svgEl, filename) {
  const svg = svgEl.outerHTML
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function svgToRaster(svgEl, format) {
  return new Promise((resolve, reject) => {
    const svg = svgEl.outerHTML
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const w = svgEl.clientWidth || svgEl.getAttribute('width') || 600
      const h = svgEl.clientHeight || svgEl.getAttribute('height') || 400
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const dataURL = canvas.toDataURL(mime, 0.92)
      URL.revokeObjectURL(url)
      resolve({ dataURL, w, h })
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

// Lazy load jsPDF for PDF export
export function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) {
      resolve(window.jspdf)
      return
    }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf)
      else reject(new Error('jsPDF not available after load'))
    }
    s.onerror = () => reject(new Error('Failed to load jsPDF'))
    document.head.appendChild(s)
  })
}

export function handleDownload(svgEl, size, format) {
  const base = `banner-${size.w}x${size.h}-${format}-${Date.now()}`
  if (format === 'svg') {
    downloadSVG(svgEl, base + '.svg')
    return
  }
  svgToRaster(svgEl, format).then(({ dataURL, w, h }) => {
    if (format === 'png' || format === 'jpeg') {
      const a = document.createElement('a')
      a.href = dataURL
      a.download = base + '.' + format
      document.body.appendChild(a)
      a.click()
      a.remove()
    } else if (format === 'pdf') {
      loadJsPDF().then((jspdf) => {
        const { jsPDF } = jspdf
        const orientation = w > h ? 'landscape' : 'portrait'
        const doc = new jsPDF({ orientation, unit: 'px', format: [w, h] })
        doc.addImage(dataURL, 'PNG', 0, 0, w, h)
        doc.save(base + '.pdf')
      })
    }
  }).catch((err) => {
    console.error('Export failed', err)
    alert('Failed to export banner: ' + (err?.message || err))
  })
}
