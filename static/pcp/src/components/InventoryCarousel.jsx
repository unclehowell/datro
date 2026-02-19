import React from 'react'
import BannerCard from './BannerCard.jsx'

export default function InventoryCarousel({ items, onOpenModal, onOpen }) {
  return (
    <div className="inventory-carousel" style={{ overflowX: 'auto', display: 'flex', gap: 16, padding: '12px 20px', scrollSnapType: 'x mandatory' }}>
      {items.map((it) => (
        <div key={it.id} style={{ minWidth: '72vw', maxWidth: 800, scrollSnapAlign: 'start' }}>
          <BannerCard
            item={it}
            smallPrint={it.smallPrint}
            onOpen={onOpen}
            onOpenModal={onOpenModal}
          />
        </div>
      ))}
    </div>
  )
}
