// Minimal dist prep for remote builds
const fs = require('fs')
const path = require('path')
const distDir = path.resolve(__dirname, 'dist')
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })

try {
  const indexSrc = path.resolve(__dirname, 'index.html')
  const indexDst = path.resolve(distDir, 'index.html')
  if (fs.existsSync(indexSrc)) fs.copyFileSync(indexSrc, indexDst)
} catch (e) { /* ignore */ }

try {
  const puckSrc = path.resolve(__dirname, 'admin', 'puck.js')
  const puckDst = path.resolve(distDir, 'puck.js')
  if (fs.existsSync(puckSrc)) {
    const dstDir = path.dirname(puckDst)
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
    fs.copyFileSync(puckSrc, puckDst)
  }
} catch (e) { /* ignore */ }
