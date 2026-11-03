"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("Maroon");
  const [openAccordion, setOpenAccordion] = useState<string | null>("specs");

  const images = [
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop",
  ];

  const colors = [
    { name: "Maroon", hex: "#5E1914" },
    { name: "Forest Green", hex: "#1B5E3A" },
    { name: "Charcoal", hex: "#333333" },
    { name: "Beige", hex: "#D4C4B7" },
  ];

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden pb-20 lg:pb-0">
      <Header forceSolid={true} />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 text-[10px] md:text-xs text-[var(--brand-muted)] font-medium">
        <a href="/" className="hover:text-[var(--brand-maroon)]">Home</a> <span className="mx-2">/</span>
        <a href="/shop" className="hover:text-[var(--brand-maroon)]">Living Room</a> <span className="mx-2">/</span>
        <span className="text-[var(--brand-text)]">Linden Sofa</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible w-full md:w-24 shrink-0">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setActiveImage(idx)} className={`relative w-20 h-24 md:w-full md:h-32 shrink-0 overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-[var(--brand-maroon)] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          
          <div className="relative w-full aspect-[4/5] md:aspect-[3/4] bg-[var(--brand-surface)] overflow-hidden">
            <img src={images[activeImage]} alt="Linden Sofa" className="w-full h-full object-cover" />
            <span className="absolute top-4 left-4 bg-[var(--brand-maroon)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Best Seller</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-[10px] md:text-xs text-[var(--brand-muted)] uppercase tracking-widest mb-2">Asian Furniture Collection</p>
          <h1 className="font-display text-3xl md:text-5xl text-[var(--brand-text)] mb-2 leading-tight">Linden Sofa</h1>
          <p className="text-xl md:text-2xl text-[var(--brand-maroon)] font-semibold mb-6">\u09F3 45,000</p>

          <p className="text-[var(--brand-muted)] text-sm leading-relaxed mb-8">
            A masterpiece of comfort and design. The Linden Sofa features deep seating, premium high-density foam, and a solid wood frame crafted by our master carpenters. Perfect for modern Bangladeshi living rooms.
          </p>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text)]">Color: <span className="text-[var(--brand-muted)]">{selectedColor}</span></span>
            </div>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-[var(--brand-maroon)] scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={`Select ${color.name}`}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:flex gap-4 mb-10">
            <div className="flex items-center border border-[var(--brand-border)]">
              <button className="px-4 py-3 text-lg hover:text-[var(--brand-maroon)]">&minus;</button>
              <span className="px-4 py-3 text-sm font-semibold">1</span>
              <button className="px-4 py-3 text-lg hover:text-[var(--brand-maroon)]">+</button>
            </div>
            <button className="flex-1 bg-[var(--brand-maroon)] text-white text-sm font-bold uppercase tracking-wider py-3 hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-lg">
              Add to Cart
            </button>
          </div>

          <div className="border-t border-[var(--brand-border)]">
            <div className="border-b border-[var(--brand-border)]">
              <button onClick={() => toggleAccordion('specs')} className="w-full flex justify-between items-center py-4 text-sm font-bold uppercase tracking-wider text-[var(--brand-text)]">
                Specifications
                <svg className={`w-4 h-4 transition-transform ${openAccordion === 'specs' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openAccordion === 'specs' && (
                <div className="pb-4 text-sm text-[var(--brand-muted)] space-y-2">
                  <p><strong>Dimensions:</strong> W 210cm x D 90cm x H 85cm</p>
                  <p><strong>Frame Material:</strong> Solid Teak Wood</p>
                  <p><strong>Upholstery:</strong> Premium Velvet</p>
                  <p><strong>Seating Capacity:</strong> 3 Seater</p>
                </div>
              )}
            </div>

            <div className="border-b border-[var(--brand-border)]">
              <button onClick={() => toggleAccordion('delivery')} className="w-full flex justify-between items-center py-4 text-sm font-bold uppercase tracking-wider text-[var(--brand-text)]">
                Delivery & Warranty
                <svg className={`w-4 h-4 transition-transform ${openAccordion === 'delivery' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openAccordion === 'delivery' && (
                <div className="pb-4 text-sm text-[var(--brand-muted)] space-y-2">
                  <p><strong>Delivery:</strong> 5-7 business days inside Dhaka. 10-14 days outside Dhaka.</p>
                  <p><strong>Warranty:</strong> 5 Years structural warranty against manufacturing defects.</p>
                  <p><strong>Assembly:</strong> Free assembly provided at delivery.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[var(--brand-border)] p-3 flex gap-3 z-50 lg:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center border border-[var(--brand-border)]">
          <button className="px-3 py-2 text-lg">&minus;</button>
          <span className="px-3 py-2 text-sm font-semibold">1</span>
          <button className="px-3 py-2 text-lg">+</button>
        </div>
        <button className="flex-1 bg-[var(--brand-maroon)] text-white text-xs font-bold uppercase tracking-wider py-2 hover:bg-[var(--brand-maroon-dark)] transition-colors">
          Add to Cart
        </button>
      </div>

      <Footer />
    </div>
  );
}