import React from 'react'

export default function SplashScreen({ onSelectCategory }) {
  const categories = [
    { id: 'mobile', name: 'Mobile' },
    { id: 'desktop', name: 'Desktop' },
    { id: 'tv', name: 'TV' },
  ]
  return (
    <div className="splash" style={{ padding: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="/logo.svg" alt="Brand Logo" style={{ height: 72 }} />
      </div>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Categories</h2>
      <div className="splash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {categories.map((c) => (
          <div key={c.id} className="splash-card" onClick={() => onSelectCategory(c.name)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelectCategory(c.name) }}
            style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.svg" alt={c.name} style={{ width: 64, height: 64, marginBottom: 8 }} />
            <div style={{ fontWeight: 600 }}>{c.name}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <span>Click a category to view inventory.</span>
      </div>
    </div>
  )
}
