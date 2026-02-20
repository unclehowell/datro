const fs = require('fs')
const path = require('path')

;(function prepare() {
  const base = __dirname
  const distDir = path.resolve(base, 'dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }

  const copies = [
    { src: path.resolve(base, 'index.html'), dst: path.resolve(distDir, 'index.html') },
    { src: path.resolve(base, 'admin', 'puck.js'), dst: path.resolve(distDir, 'puck.js') },
  ]

  copies.forEach(({ src, dst }) => {
    try {
      if (fs.existsSync(src)) {
        const dstDir = path.dirname(dst)
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
        fs.copyFileSync(src, dst)
      }
    } catch (err) {
      console.warn(`Warning: failed to copy ${src} -> ${dst}:`, err)
    }
  })

  // Try to copy the admin assets directory if present (optional)
  const adminDir = path.resolve(base, 'admin')
  if (fs.existsSync(adminDir)) {
    const dstAdmin = path.resolve(distDir, 'admin')
    try {
      if (fs.existsSync(dstAdmin) || !fs.existsSync(adminDir)) {
        // ok
      } else {
        fs.mkdirSync(dstAdmin, { recursive: true })
      }
      // Use cp if available, fallback to simple recursion
      if (fs.cpSync) {
        fs.cpSync(adminDir, dstAdmin, { recursive: true })
      } else {
        // simple shallow copy for known files
        for (const file of fs.readdirSync(adminDir)) {
          const s = path.join(adminDir, file)
          const d = path.join(dstAdmin, file)
          if (fs.statSync(s).isDirectory()) continue
          fs.copyFileSync(s, d)
        }
      }
    } catch (err) {
      console.warn('Warning: could not copy admin assets to dist/', err)
    }
  }
})()

// Also copy legacy assets from the old build if present to dist/assets
try {
  const legacyAssetsSrcDir = require('path').resolve(__dirname, '..', 'old', 'src', 'dist', 'assets')
  const legacyIndex = require('path').resolve(legacyAssetsSrcDir, 'index-DOv-iOI0.js')
  const legacyCss = require('path').resolve(legacyAssetsSrcDir, 'index-p6SUfEFx.css')
  const distDir = require('path').resolve(__dirname, 'dist')
  const distAssetsDir = require('path').resolve(distDir, 'assets')
  const fs = require('fs')
  if (!fs.existsSync(distAssetsDir)) fs.mkdirSync(distAssetsDir, { recursive: true })
  if (fs.existsSync(legacyIndex)) {
    fs.copyFileSync(legacyIndex, require('path').resolve(distAssetsDir, 'index-DOv-iOI0.js'))
  }
  if (fs.existsSync(legacyCss)) {
    fs.copyFileSync(legacyCss, require('path').resolve(distAssetsDir, 'index-p6SUfEFx.css'))
  }
} catch (e) {
  // ignore if legacy assets are not present
}

// Also copy legacy assets from the old build if present to dist/assets
try {
  const legacyAssetsSrcDir = require('path').resolve(__dirname, '..', '..', 'old', 'src', 'dist', 'assets')
  const legacyIndex = require('path').resolve(legacyAssetsSrcDir, 'index-DOv-iOI0.js')
  const legacyCss = require('path').resolve(legacyAssetsSrcDir, 'index-p6SUfEFx.css')
  const distDir = require('path').resolve(__dirname, 'dist')
  const distAssetsDir = require('path').resolve(distDir, 'assets')
  const fs = require('fs')
  if (!fs.existsSync(distAssetsDir)) fs.mkdirSync(distAssetsDir, { recursive: true })
  if (fs.existsSync(legacyIndex)) {
    fs.copyFileSync(legacyIndex, require('path').resolve(distAssetsDir, 'index-DOv-iOI0.js'))
  }
  if (fs.existsSync(legacyCss)) {
    fs.copyFileSync(legacyCss, require('path').resolve(distAssetsDir, 'index-p6SUfEFx.css'))
  }
} catch (e) {
  // ignore if legacy assets are not present
}
