import React from 'react'
import AdDetail from './AdDetail.jsx'
export default function AdDetailModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="modal-overlay" role="dialog" aria-label={`Ad detail ${item.id}`} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000 }}>
      <div className="modal-content" style={{ position: 'relative', width: 'min(1200px, 92vw)', height: '90vh', margin: '5vh auto', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <button aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: '#333', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>×</button>
        <AdDetail item={item} onBack={onClose} />
      </div>
    </div>
  )
}
