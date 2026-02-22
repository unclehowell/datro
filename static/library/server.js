// Lightweight local server: static docs UI + JSON-based API for inventory/exceptions/archive
// Run: node server.js
// Serves static UI from gh-pages/static/docs and provides API under /api/* using data/* JSON files.

const http = require('http')
const fs = require('fs')
const path = require('path')

const STATIC_ROOT = path.resolve(__dirname, 'gh-pages', 'static', 'docs')
const INVENTORY_PATH = path.resolve(__dirname, 'data', 'inventory.json')
const EXCEPTIONS_PATH = path.resolve(__dirname, 'data', 'exceptions.json')
const OUTTRAY_PATH = path.resolve(__dirname, 'data', 'outtray.json')
const REGISTRY_PATH = path.resolve(__dirname, 'gh-pages', 'static', 'docs', '_registry.json')
const VERSIONS_ROOT = path.resolve(__dirname, 'gh-pages', 'static', 'docs', 'versions')
const EXPORTS_ROOT = path.resolve(__dirname, 'data', 'exports')
const LANGS_PATH = path.resolve(__dirname, 'gh-pages', 'static', 'docs', 'langs.json')
// New registry and versioning helpers
const REGISTRY_PATH = path.resolve(__dirname, 'gh-pages', 'static', 'docs', '_registry.json')
const VERSIONS_ROOT = path.resolve(__dirname, 'gh-pages', 'static', 'docs', 'versions')
const EXPORTS_ROOT = path.resolve(__dirname, 'data', 'exports')
function cloneDir(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const items = fs.readdirSync(src, { withFileTypes: true })
  items.forEach(it => {
    const s = path.join(src, it.name)
    const d = path.join(dest, it.name)
    if (it.isDirectory()) cloneDir(s, d)
    else fs.copyFileSync(s, d)
  })
}
 
function cloneDir(src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  const items = fs.readdirSync(src, { withFileTypes: true })
  items.forEach(it => {
    const s = path.join(src, it.name)
    const d = path.join(dest, it.name)
    if (it.isDirectory()) {
      cloneDir(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  })
}

function isLeaveAlone(targetDir) {
  // Block if LEAVE_ALONE.md exists in target or any ancestor up to docs root
  let p = targetDir
  while (p.startsWith(__dirname)) {
    const marker = path.join(p, 'LEAVE_ALONE.md')
    if (fs.existsSync(marker)) return true
    const next = path.dirname(p)
    if (next === p) break
    p = next
  }
  return false
}

function readJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2))
  return obj
}

function handleAPI(req, res) {
  const url = req.url
  const method = (req.method || 'GET').toUpperCase()
  if (url.startsWith('/api/inventory')) {
    if (method === 'GET') {
      const data = readJSON(INVENTORY_PATH, [])
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
      return
    }
    if (method === 'POST') {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        const payload = JSON.parse(body || '{}')
        const targetDir = path.resolve(__dirname, 'gh-pages', 'static', 'docs', payload.path || '')
        if (isLeaveAlone(targetDir)) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'blocked by LEAVE_ALONE.md' }))
          return
        }
        const list = readJSON(INVENTORY_PATH, [])
        if (!payload.id) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'missing id' }))
          return
        }
        const idx = list.findIndex(i => i.id === payload.id)
        if (idx >= 0) list[idx] = { ...list[idx], ...payload }
        else list.push(payload)
        writeJSON(INVENTORY_PATH, list)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, item: payload }))
      })
      return
    }
  }
  if (url.startsWith('/api/exceptions')) {
    if (method === 'GET') {
      const data = readJSON(EXCEPTIONS_PATH, [])
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
      return
    }
    if (method === 'POST') {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        const payload = JSON.parse(body || '{}')
        const list = readJSON(EXCEPTIONS_PATH, [])
        payload.id = payload.id || ('ex-' + Date.now())
        list.push(payload)
        writeJSON(EXCEPTIONS_PATH, list)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, exception: payload }))
      })
      return
    }
  }
  if (url.startsWith('/api/archive')) {
    if (method === 'POST') {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        const payload = JSON.parse(body || '{}')
        const id = payload.id
        const inventory = readJSON(INVENTORY_PATH, [])
        const idx = inventory.findIndex(i => i.id === id)
        if (idx < 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'item not found' }))
          return
        }
        const item = inventory[idx]
        const targetDir = path.resolve(__dirname, 'gh-pages', 'static', 'docs', item.path || '')
        if (isLeaveAlone(targetDir)) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'blocked by LEAVE_ALONE.md' }))
          return
        }
        item.status = 'archived'
        item.archived_path = item.path + '.pdf'
        writeJSON(INVENTORY_PATH, inventory)
        // add to outtray
        const outtray = readJSON(OUTTRAY_PATH, [])
        outtray.push({ id: item.id, path: item.archived_path, target_version: item.version, timestamp: new Date().toISOString() })
        writeJSON(OUTTRAY_PATH, outtray)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, item, outtray }))
      })
      return
    }
  }

  // Fallback: 404 for unknown API
  // Additional API endpoints
  if (url.startsWith('/api/registry') && method === 'GET') {
    const reg = readJSON(REGISTRY_PATH, { languages: [], items: [] })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(reg))
    return
  }
  if (url.startsWith('/api/versions') && method === 'GET') {
    try {
      const vers = fs.existsSync(VERSIONS_ROOT) ? fs.readdirSync(VERSIONS_ROOT, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) : []
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ versions: vers }))
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'listing versions failed' }))
    }
    return
  }
  if (url.startsWith('/api/version/new') && method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      const payload = JSON.parse(body || '{}')
      const version = payload.version
      if (!version) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'missing version' }))
        return
      }
      const src = path.join(__dirname, 'gh-pages', 'static', 'docs', 'latest')
      const dest = path.join(VERSIONS_ROOT, version)
      if (fs.existsSync(dest)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'version exists' }))
        return
      }
      cloneDir(src, dest)
      // prune artifacts in new version
      const buildPath = path.join(dest, 'build')
      if (fs.existsSync(buildPath)) {
        const removeDir = (p) => {
          if (fs.existsSync(p)) {
            fs.readdirSync(p).forEach(n => {
              const s = path.join(p, n)
              if (fs.lstatSync(s).isDirectory()) removeDir(s)
              else fs.unlinkSync(s)
            })
            fs.rmdirSync(p)
          }
        }
        removeDir(buildPath)
      }
      // update registry
      const reg = readJSON(REGISTRY_PATH, { languages: [], items: [] })
      reg.items = reg.items || []
      reg.items.push({ version, path: 'versions/' + version })
      writeJSON(REGISTRY_PATH, reg)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, version }))
    })
    return
  }
  if (url.startsWith('/api/export') && method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      const payload = JSON.parse(body || '{}')
      const version = payload.version
      const format = payload.format || 'zip'
      if (!version) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'missing version' }))
        return
      }
      const srcDir = path.join(VERSIONS_ROOT, version)
      if (!fs.existsSync(srcDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'version not found' }))
        return
      }
      if (!fs.existsSync(EXPORTS_ROOT)) fs.mkdirSync(EXPORTS_ROOT, { recursive: true })
      const archivePath = path.join(EXPORTS_ROOT, version + '.zip')
      const tarCmd = `tar -czf ${archivePath} -C ${srcDir} .`
      try {
        const cp = require('child_process')
        cp.execSync(tarCmd)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, file: archivePath }))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'export failed', detail: e.message }))
      }
    })
    return
  }
  if (url.startsWith('/api/build') && method === 'POST') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      const payload = JSON.parse(body || '{}')
      const version = payload.version || 'latest'
      const dest = path.join(VERSIONS_ROOT, version)
      if (!fs.existsSync(dest)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'version not found' }))
        return
      }
      const buildDir = path.join(dest, 'build')
      if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })
      fs.writeFileSync(path.join(buildDir, 'README_BUILD.txt'), 'serverless build placeholder')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, version, built: true }))
    })
    return
  }
  if (url.startsWith('/api/langs') && method === 'GET') {
    const langs = readJSON(LANGS_PATH, [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(langs))
    return
  }
  if (url.startsWith('/api/outtray') && method === 'GET') {
    const o = readJSON(OUTTRAY_PATH, [])
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(o))
    return
  }
  // Fallback: unknown API
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
}

function serveStatic(req, res) {
  let p = path.join(STATIC_ROOT, req.url === '/' ? '/index.html' : req.url)
  if (!p.startsWith(STATIC_ROOT)) p = STATIC_ROOT
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    const ext = path.extname(p).toLowerCase()
    const typeMap = {
      '.html': 'text/html',
      '.htm': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    }
    const ct = typeMap[ext] || 'text/plain'
    res.writeHead(200, { 'Content-Type': ct })
    res.end(fs.readFileSync(p))
    return
  }
  // not found
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return handleAPI(req, res)
  return serveStatic(req, res)
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
