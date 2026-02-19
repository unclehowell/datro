import React from 'react'
import BannerCard from './components/BannerCard.jsx'
import AdDetail from './components/AdDetail.jsx'
import { fetchBanners as fetchBannersCMS } from './puckClient.js'
import SplashScreen from './components/SplashScreen.jsx'
import InventoryCarousel from './components/InventoryCarousel.jsx'
import AdDetailModal from './components/AdDetailModal.jsx'

// Headlines for banners (fallback/defaults)
const HEADLINES = [
  "Example Outcome: £1,846.23 Recovered",
  "Up to £1,846.23 in a Recent PCP Case*",
  "Recent Case Secured £1,846.23*",
  "£1,846.23 Recovered – Individual Result",
  "Past Client Recovered £1,846.23*",
]

// Small print text shown on every banner (fallback)
const SMALL_PRINT =
  "Fountain Finances LTD is a Claims Management Company (CMC).You can claim for free without using a CMC, first to your finance partner or to the FOS. The FCA is likely to introduce a free consumer redress scheme. We will pass your case to a CMC/Solicitor who will pay us a referral fee. £1,846.23* is the average redress achieved by our partner law firm. This figure is an average claim value per agreement of our partner law firm HD Law, as of July 31st 2025";

// Banner sizes (width x height)
const SIZES = [
  { w: 1200, h: 628, name: '1200x628 Landscape' },
  { w: 1200, h: 1200, name: '1200x1200 Square' },
  { w: 300, h: 300, name: '300x300' },
  { w: 320, h: 100, name: '320x100 Mobile' },
  { w: 300, h: 250, name: '300x250' },
  { w: 28, h: 90, name: '28x90' },
  { w: 300, h: 600, name: '300x600' },
  { w: 160, h: 600, name: '160x600' },
  { w: 970, h: 250, name: '970x250' },
]

// Category map for inventory items
const CATEGORY_ORDER = ['Desktop','Desktop','Mobile','Mobile','Mobile','Mobile','TV','TV','Desktop']
// Build inventory items (default static until CMS loads)
const INVENTORY = SIZES.map((size, idx) => ({
  id: idx + 1,
  size,
  headline: HEADLINES[idx % HEADLINES.length],
  smallPrint: SMALL_PRINT,
  background: '#333',
  category: CATEGORY_ORDER[idx],
}))

export default function App() {
  const [banners, setBanners] = React.useState(INVENTORY)
  const [route, setRoute] = React.useState(window.location.pathname)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [modalItem, setModalItem] = React.useState(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  // Splash categories navigation
  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
  }
  React.useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    // Update page title
    document.title = 'Brand Catalogue'
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // Resolve current item for detail view if route matches /ad/:id
  const detailMatch = route.startsWith('/ad/') ? route.split('/ad/')[1] : null
  const detailId = detailMatch ? parseInt(detailMatch, 10) : null
  const detailItem = detailId ? banners.find((b) => b.id === detailId) : null
  React.useEffect(() => {
    let mounted = true
    // Try to load CMS content
    fetchBannersCMS()
      .then((cms) => {
        if (!mounted) return
        if (Array.isArray(cms) && cms.length > 0) {
          // Merge CMS data with default inventory by index id
          const merged = INVENTORY.map((base, idx) => {
            const cmsItem = cms.find((c) => c.id === base.id) || {}
            return {
              ...base,
              size: cmsItem.size || base.size,
              headline: cmsItem.headline ?? base.headline,
              smallPrint: cmsItem.smallPrint ?? base.smallPrint,
              background: cmsItem.background ?? base.background,
            }
          })
          setBanners(merged)
        }
      })
      .catch(() => {
        // ignore CMS errors; show defaults
      })
    return () => {
      mounted = false
    }
  }, [])
  // Splash screen and showcase on landing
  if (route === '/') {
    return (
      <div className="site-shell">
        <header className="site-header" role="navigation" aria-label="main navigation">
          <div className="brand">Brand Catalogue</div>
          <button className="menu-btn" aria-label="Toggle menu" onClick={() => setMobileNavOpen((s) => !s)}>☰</button>
          <nav className={`main-menu ${mobileNavOpen ? 'open' : ''}`} aria-label="category-menu" style={{ display: 'flex', gap: 16 }}>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/desktop');}}>Desktop</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/mobile');}}>Mobile</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/tv');}}>TV</a>
          </nav>
        </header>
        <div className={`mobile-menu ${mobileNavOpen ? 'open' : ''}`} style={{ display: mobileNavOpen ? 'block' : 'none', position: 'fixed', top: 56, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #ddd', padding: 8 }}>
          <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/desktop'); setMobileNavOpen(false);}} style={{ display: 'block', padding: '8px 0' }}>Desktop</a>
          <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/mobile'); setMobileNavOpen(false);}} style={{ display: 'block', padding: '8px 0' }}>Mobile</a>
          <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/tv'); setMobileNavOpen(false);}} style={{ display: 'block', padding: '8px 0' }}>TV</a>
        </div>
        <div className="header-wrap" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <SplashScreen onSelectCategory={(cat) => navigate(`/catalogue/${cat.toLowerCase()}`)} />
        </div>
        <div className="inventory-row" style={{ display:'flex', gap:16, width:'100%', overflowX:'auto' }}>
          <InventoryCarousel items={banners} onOpenModal={(it) => { setModalItem(it); setModalOpen(true); }} onOpen={(id) => navigate(`/ad/${id}`)} />
        </div>
        {modalOpen && (
          <AdDetailModal item={modalItem} onClose={() => setModalOpen(false)} />
        )}
        <footer className="site-footer">© {new Date().getFullYear()} Fountain Finances – Demo, serverless by design.
          {import.meta.env.VITE_PUCK_API_URL ? (
            <><span> | </span><a href={import.meta.env.VITE_PUCK_API_URL} target="_blank" rel="noreferrer">Puck CMS</a></>
          ) : null}
        </footer>
      </div>
    )
  }
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand">Brand Catalogue</div>
        <nav className="nav-dots" aria-label="demo-nav">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </nav>
      </header>
      <main className="container" aria-label="inventory">
        {route.startsWith('/ad/') ? (
          detailItem ? (
            <AdDetail item={detailItem} onBack={() => navigate('/')} />
          ) : (
            <div className="not-found" style={{ padding: 20 }}>Banner not found. <button onClick={() => navigate('/')}>Back to catalogue</button></div>
          )
        ) : (
          banners
            .filter((b) => {
              const cat = route.startsWith('/catalogue/') ? route.split('/catalogue/')[1] : null
              return !cat || b.category?.toLowerCase() === cat
            })
            .map((item) => (
              <BannerCard key={item.id} item={item} smallPrint={item.smallPrint || SMALL_PRINT} onOpen={(id) => navigate(`/ad/${id}`)} />
            ))
        )}
      </main>
      <footer className="site-footer">© {new Date().getFullYear()} Fountain Finances – Demo, serverless by design.
        {import.meta.env.VITE_PUCK_API_URL ? (
          <><span> | </span><a href={import.meta.env.VITE_PUCK_API_URL} target="_blank" rel="noreferrer">Puck CMS</a></>
        ) : null}
      </footer>
    </div>
  )
}
