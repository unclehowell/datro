import React from 'react'
import BannerCard from './BannerCard.jsx'

export default function InventoryCarousel({ items, onOpen }) {
  return (
    <div className="inventory-carousel">
      {items.map((it) => (
        <div key={it.id} className="inventory-slide">
          <BannerCard
            item={it}
            onOpen={() => {}}
            onDoubleOpen={onOpen}
            footer={<div className="inventory-hint">Double-click to open dedicated ad page</div>}
          />
        </div>
      ))}
    </div>
  )
}
