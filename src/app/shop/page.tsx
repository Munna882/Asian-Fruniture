"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShopPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const products = [
    { name: "Linden Sofa", price: "\u09F3 45,000", category: "Living Room", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop" },
    { name: "Dahila Armchair", price: "\u09F3 18,500", category: "Living Room", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop" },
    { name: "Marigold Lounge", price: "\u09F3 32,000", category: "Living Room", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop" },
    { name: "Teak Dining Table", price: "\u09F3 55,000", category: "Dining Room", image: "https://images.unsplash.com/photo-1617806118233-18e1c48e3b64?q=80&w=800&auto=format&fit=crop" },
    { name: "Royal Bed Frame", price: "\u09F3 85,000", category: "Bedroom", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=800&auto=format&fit=crop" },
    { name: "Executive Desk", price: "\u09F3 40,000", category: "Office", image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop" },
    { name: "Modern Wardrobe", price: "\u09F3 60,000", category: "Bedroom", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop" },
    { name: "Oak Dining Chair", price: "\u09F3 12,000", category: "Dining Room", image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      <div className="bg-[var(--brand-cream)] py-10 md:py-16 px-4 md:px-6 border-b border-[var(--brand-border)] ">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl text-[var(--brand-text)] mb-2">All Furniture</h1>
          <p className="text-[var(--brand-muted)] text-sm">Discover premium pieces for every room in your home.</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16 flex flex-col lg:flex-row gap-10">
        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="lg:hidden flex items-center justify-center gap-2 w-full py-3 border border-[var(--brand-border)] bg-white text-sm font-bold uppercase tracking-wider">
          {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>

        <aside className={`lg:w-64 shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-28 space-y-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--brand-maroon)] mb-4">Categories</h3>
              <ul className="space-y-3 text-sm text-[var(--brand-muted)]">
                <li><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="accent-[var(--brand-maroon)] w-4 h-4" /> Living Room</label></li>
                <li><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="accent-[var(--brand-maroon)] w-4 h-4" /> Bedroom</label></li>
                <li><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="accent-[var(--brand-maroon)] w-4 h-4" /> Dining Room</label></li>
                <li><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="accent-[var(--brand-maroon)] w-4 h-4" /> Office</label></li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--brand-border)]">
            <span className="text-sm text-[var(--brand-muted)]">Showing 8 products</span>
            <select className="text-sm border border-[var(--brand-border)] bg-white py-2 px-4 rounded-none outline-none focus:border-[var(--brand-maroon)]">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((prod, idx) => (
              <a key={idx} href="/product" className="group cursor-pointer block">
                <div className="relative aspect-[4/5] bg-[var(--brand-surface)] overflow-hidden mb-4 border border-[var(--brand-border)]">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-wider mb-1">{prod.category}</p>
                  <h3 className="font-display text-lg text-[var(--brand-text)] font-bold mb-1">{prod.name}</h3>
                  <p className="text-sm text-[var(--brand-maroon)] font-semibold">{prod.price}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}