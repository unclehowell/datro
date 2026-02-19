import React from 'react'
import BannerCard from './components/BannerCard.jsx'
import AdDetail from './components/AdDetail.jsx'
import { fetchBanners as fetchBannersCMS } from './puckClient.js'
import SplashScreen from './components/SplashScreen.jsx'
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

const INVENTORY = SIZES.map((size, idx) => ({
  id: idx + 1,
  size,
  headline: HEADLINES[idx % HEADLINES.length],
  smallPrint: SMALL_PRINT,
  description: `Editable CMS description for ${size.name}.`,
  background: '#333',
  category: CATEGORY_ORDER[idx],
}))

export default function App() {
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
          const cmsItem = cms.find((c) => Number(c.id) === base.id) || {}
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

  const detailId = route.startsWith('/ad/') ? Number(route.split('/ad/')[1]) : null
  const detailItem = detailId ? banners.find((b) => b.id === detailId) : null
  const filtered = route.startsWith('/catalogue/') ? banners.filter((b) => b.category === route.split('/catalogue/')[1]) : banners

  if (route === '/') {
    return (
      <div className="site-shell">
        <header className="site-header"><div className="brand">SVG Display Ads Showcase</div></header>
        <SplashScreen onSelectCategory={(cat) => navigate(`/catalogue/${cat.toLowerCase()}`)} />
        <InventoryCarousel items={banners} onOpen={(id) => navigate(`/ad/${id}`)} />
      </div>
    )
  }

  return (
    <div className="site-shell">
      <header className="site-header"><div className="brand">SVG Display Ads Showcase</div></header>
      <main className="container" aria-label="inventory">
        {route.startsWith('/ad/') ? (
          detailItem ? <AdDetail item={detailItem} variants={banners} onBack={() => navigate('/')} /> : <div>Banner not found.</div>
        ) : (
          filtered.map((item) => <BannerCard key={item.id} item={item} onOpen={(id) => navigate(`/ad/${id}`)} onDoubleOpen={(id) => navigate(`/ad/${id}`)} />)
        )}
      </main>
    </div>
  )
}
