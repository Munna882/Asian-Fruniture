"use client";
import { useState } from "react";

export default function ProductGallery({ images, productName }: { images: { url: string }[], productName: string }) {
  const [activeImage, setActiveImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] md:aspect-[3/4] bg-[var(--brand-surface)] flex items-center justify-center border border-[var(--brand-border)]">
        <span className="text-sm text-gray-400">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible w-full md:w-24 shrink-0">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveImage(idx)} 
              className={`relative w-20 h-24 md:w-full md:h-32 shrink-0 overflow-hidden border-2 transition-all ${
                activeImage === idx ? 'border-[var(--brand-maroon)] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={`${productName} thumbnail ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div className="relative w-full aspect-[4/5] md:aspect-[3/4] bg-[var(--brand-surface)] overflow-hidden border border-[var(--brand-border)] flex-1">
        <img src={images[activeImage].url} alt={productName} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}