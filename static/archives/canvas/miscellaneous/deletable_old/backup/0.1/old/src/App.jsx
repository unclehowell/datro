import React from 'react'
import BannerCard from './components/BannerCard.jsx'
import AdDetail from './components/AdDetail.jsx'
import { fetchBanners as fetchBannersCMS } from './puckClient.js'
import InventoryCarousel from './components/InventoryCarousel.jsx'

const HEADLINES = [
  'Example Outcome: £1,846.23 Recovered',
  'Up to £1,846.23 in a Recent PCP Case*',
  'Recent Case Secured £1,846.23*',
  '£1,846.23 Recovered – Individual Result',
  'Past Client Recovered £1,846.23*',
]

const SMALL_PRINT =
  'Fountain Finances LTD is a Claims Management Company (CMC). You can claim for free without using a CMC, first to your finance partner or to the FOS. The FCA is likely to introduce a free consumer redress scheme. We will pass your case to a CMC/Solicitor who will pay us a referral fee. £1,846.23* is the average redress achieved by our partner law firm.'

const SIZES = [
  { w: 1200, h: 628, name: '1200x628 Landscape' },
  { w: 1200, h: 1200, name: '1200x1200 Square' },
  { w: 300, h: 300, name: '300x300' },
  { w: 320, h: 100, name: '320x100 Mobile' },
  { w: 300, h: 250, name: '300x250' },
  { w: 728, h: 90, name: '728x90 Leaderboard' },
  { w: 300, h: 600, name: '300x600' },
  { w: 160, h: 600, name: '160x600' },
  { w: 970, h: 250, name: '970x250' },
]

const CATEGORY_ORDER = ['desktop', 'desktop', 'mobile', 'mobile', 'mobile', 'desktop', 'tv', 'tv', 'desktop']
// Social items (to be CMS-driven with real data in the future)
const SOCIAL_ITEMS = [
  {
    id: 10,
    size: { w: 1200, h: 628 },
    headline: 'Facebook Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for Facebook.',
    background: '#333',
    category: 'Social Media',
    subcategory: 'facebook',
  },
  {
    id: 11,
    size: { w: 1200, h: 628 },
    headline: 'Instagram Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for Instagram.',
    background: '#333',
    category: 'Social Media',
    subcategory: 'instagram',
  },
  {
    id: 12,
    size: { w: 1200, h: 300 },
    headline: 'X.com Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for X.com.',
    background: '#333',
    category: 'Social Media',
    subcategory: 'xcom',
  },
  {
    id: 13,
    size: { w: 1200, h: 628 },
    headline: 'LinkedIn Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for LinkedIn.',
    background: '#333',
    category: 'Social Media',
    subcategory: 'linkedin',
  },
]
// Base inventory items (non-socials)
const PLACEHOLDER_ITEMS = [
  {
    id: 14,
    size: { w: 1200, h: 628 },
    headline: 'Video Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for Video.',
    background: '#333',
    category: 'Video',
    subcategory: 'video',
    type: 'video'
  },
  {
    id: 15,
    size: { w: 1200, h: 628 },
    headline: 'Animated Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for Animated.',
    background: '#333',
    category: 'Animated',
    subcategory: 'animated',
    type: 'animated'
  },
  {
    id: 16,
    size: { w: 1200, h: 300 },
    headline: 'Text Ad Headline',
    smallPrint: SMALL_PRINT,
    description: 'Editable CMS description for Text ad.',
    background: '#333',
    category: 'Text',
    subcategory: 'text',
    type: 'text'
  }
]
const BASE_INVENTORY = SIZES.map((size, idx) => ({
  id: idx + 1,
  size,
  headline: HEADLINES[idx % HEADLINES.length],
  smallPrint: SMALL_PRINT,
  description: `Editable CMS description for ${size.name}.`,
  background: '#333',
  category: CATEGORY_ORDER[idx],
  type: 'image'
}))
const INVENTORY = BASE_INVENTORY.concat(SOCIAL_ITEMS, PLACEHOLDER_ITEMS)

export default function App() {
  const splashRef = React.useRef(null)
  const handleSplashKey = (e) => {
    if (!splashRef.current) return
    if (e.key === 'ArrowRight') splashRef.current.scrollBy({ left: 320, behavior: 'smooth' })
    else if (e.key === 'ArrowLeft') splashRef.current.scrollBy({ left: -320, behavior: 'smooth' })
  }
  const [banners, setBanners] = React.useState(INVENTORY)
  const [route, setRoute] = React.useState(window.location.pathname)

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  React.useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  React.useEffect(() => {
    let mounted = true
    fetchBannersCMS()
      .then((cms) => {
        if (!mounted || !Array.isArray(cms) || cms.length === 0) return
        const merged = INVENTORY.map((base) => {
          const cmsItem = cms.find((entry) => Number(entry.id) === base.id) || {}
          return {
            ...base,
            size: cmsItem.size || base.size,
            headline: cmsItem.headline ?? base.headline,
            smallPrint: cmsItem.smallPrint ?? base.smallPrint,
            description: cmsItem.description ?? base.description,
            background: cmsItem.background ?? base.background,
          }
        })
        setBanners(merged)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const normalizedRoute = route.endsWith('/') && route !== '/' ? route.slice(0, -1) : route
  const detailId = normalizedRoute.startsWith('/ad/') ? Number(normalizedRoute.split('/ad/')[1]) : null
  const detailItem = detailId ? banners.find((banner) => banner.id === detailId) : null
  const selectedCategory = normalizedRoute.startsWith('/catalogue/') ? normalizedRoute.split('/catalogue/')[1] : null
  // Support social media subcategories
  let filtered = selectedCategory ? banners.filter((banner) => banner.category === selectedCategory) : banners
  if (normalizedRoute.startsWith('/catalogue/social/')) {
    const subcat = normalizedRoute.split('/catalogue/social/')[1].toLowerCase()
    filtered = banners.filter((banner) => (banner.category?.toLowerCase() === 'social media') && (banner.subcategory?.toLowerCase?.() || '').includes(subcat))
  }
  const detailFormats = detailItem
    ? SIZES.map((size, idx) => ({
        ...detailItem,
        id: idx + 1,
        size,
      }))
    : []

  if (normalizedRoute === '/') {
    return (
      <div className="site-shell">
        <header className="site-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand">SVG Display Ads Showcase</div>
        <nav className="category-menu" aria-label="top-categories" style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <a href="#" className="category-link" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/desktop');}}>Desktop</a>
          <a href="#" className="category-link" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/mobile');}}>Mobile</a>
          <a href="#" className="category-link" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/tv');}}>TV</a>
        </nav>
        <div className="social-dropdown" style={{ position: 'relative', marginLeft: 8 }}>
          <span style={{ cursor: 'default' }}>Social Media ▾</span>
          <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, background: '#111', border: '1px solid #333', borderRadius: 6, padding: 6, minWidth: 180 }}>
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/facebook');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>Facebook</a>
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/instagram');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>Instagram</a>
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/xcom');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>X.com</a>
              <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/linkedin');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>LinkedIn</a>
            </div>
          </div>
        </header>
        <InventoryCarousel items={banners} onOpenModal={(it) => navigate(`/ad/${it.id}`)} onOpen={(id) => navigate(`/ad/${id}`)} />
      </div>
    )
  }

  return (
    <div className="site-shell">
      <header className="site-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="brand">SVG Display Ads Showcase</div>
        <div className="social-dropdown" style={{ position: 'relative', marginLeft: 'auto' }}>
          <span style={{ cursor: 'default' }}>Social Media ▾</span>
          <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, background: '#111', border: '1px solid #333', borderRadius: 6, padding: 6, minWidth: 180 }}>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/facebook');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>Facebook</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/instagram');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>Instagram</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/xcom');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>X.com</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/catalogue/social/linkedin');}} style={{ display: 'block', padding: '6px 8px', color: '#fff', textDecoration: 'none' }}>LinkedIn</a>
          </div>
        </div>
      </header>
      <main className="container" aria-label="inventory">
        {normalizedRoute.startsWith('/ad/') ? (
          detailItem ? <AdDetailModal item={detailItem} onClose={() => navigate('/')} /> : <div>Banner not found.</div>
        ) : (
          filtered.map((item) => (
            <BannerCard
              key={item.id}
              item={item}
              onOpen={(id) => navigate(`/ad/${id}`)}
              onDoubleOpen={(id) => navigate(`/ad/${id}`)}
            />
          ))
        )}
      </main>
    </div>
  )
}
