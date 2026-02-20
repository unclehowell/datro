const fs = require('fs')
const path = require('path')

// Simple dist preparer for remote builds.
// Ensures dist/ exists and copies essential assets if present.
(function prepare() {
  const base = __dirname
  const distDir = path.resolve(base, 'dist')
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })

  // Copy main entry if present
  const indexSrc = path.resolve(base, 'index.html')
  const indexDst = path.resolve(distDir, 'index.html')
  try {
    if (fs.existsSync(indexSrc)) {
      fs.copyFileSync(indexSrc, indexDst)
    }
  } catch (e) {
    // ignore copy errors on remote
  }

  // Copy puck.js if present in admin build dir
  const puckSrc = path.resolve(base, 'admin', 'puck.js')
  const puckDst = path.resolve(distDir, 'puck.js')
  try {
    if (fs.existsSync(puckSrc)) {
      const dstDir = path.dirname(puckDst)
      if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
      fs.copyFileSync(puckSrc, puckDst)
    }
  } catch (e) {
    // ignore
  }
})();
