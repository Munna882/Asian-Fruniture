"use client";
import { useState, useEffect } from "react";

export default function Header({ forceSolid = false }: { forceSolid?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (forceSolid) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceSolid]);

  const isSolid = forceSolid || isScrolled;

  const navigationData = [
    {
      title: "Living Room",
      columns: [
        { heading: "Sofa Set", items: ["Fabric Sofa", "Wooden Sofa", "L-Shaped Sofa", "Leather Sofa", "Rexin Sofa", "Sofa-Bed"] },
        { heading: "Center Table", items: ["Center Table With Glass Top", "Center Table With Wooden Top", "Center Table With Storage", "Modular Center Table", "Nested Table"] },
        { heading: "Divan", items: ["Fabric Divan", "Wooden Divan", "Modular Divan"] },
        { heading: "TV Cabinet", items: ["TV Cabinet With Hanging Unit", "Low Height TV Cabinet", "Modular TV Cabinet"] }
      ]
    },
    {
      title: "Bedroom",
      columns: [
        { heading: "Bed", items: ["King Size Bed", "Queen Size Bed", "Single Bed", "Bunk Bed"] },
        { heading: "Wardrobe", items: ["2 Door Wardrobe", "3 Door Wardrobe", "4 Door Wardrobe", "Sliding Wardrobe"] },
        { heading: "Dressing Table", items: ["Wooden Dressing Table", "Mirror Dressing Table", "Modular Dressing Table"] }
      ]
    },
    {
      title: "Dining Room",
      columns: [
        { heading: "Dining Table", items: ["4 Seater Dining", "6 Seater Dining", "8 Seater Dining", "Round Dining Table"] },
        { heading: "Dining Chair", items: ["Wooden Chair", "Cushioned Chair", "Bar Stool"] }
      ]
    },
    {
      title: "Office",
      columns: [
        { heading: "Office Desk", items: ["Executive Desk", "Workstation", "Reception Desk"] },
        { heading: "Office Chair", items: ["Ergonomic Chair", "Visitor Chair", "Boss Chair"] },
        { heading: "Storage", items: ["File Cabinet", "Office Almirah", "Book Shelf"] }
      ]
    },
    { title: "Showrooms", columns: [] },
    { title: "About", columns: [] }
  ];

  return (
    <>
      {/* FIXED WRAPPER FOR BOTH BARS */}
      <div className="fixed top-0 left-0 w-full z-[100] flex flex-col">
        
        {/* Maroon Announcement Bar (Hides on scroll) */}
        <div className={`bg-[var(--brand-maroon)] text-white text-center text-[9px] md:text-[10px] tracking-[0.1em] font-medium uppercase transition-all duration-300 overflow-hidden ${
          isSolid ? "max-h-0 py-0 opacity-0" : "max-h-[30px] py-1.5 opacity-100"
        }`}>
          Free Delivery Inside City &middot; 5 Year Warranty
        </div>

        {/* Main Header */}
        <header className={`w-full transition-all duration-300 ${
          isSolid ? "bg-white shadow-md border-b border-[var(--brand-border)] py-1" : "bg-transparent border-b border-white/20 py-2 md:py-4"
        }`}>
          <nav className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 md:gap-3 group">
              <img src="/logo.png" alt="Asian Furniture" className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full shadow-sm" />
              <div className="flex flex-col justify-center">
                <p className={`font-display text-base md:text-lg tracking-[0.1em] font-bold leading-tight transition-colors duration-300 ${isSolid ? "text-[var(--brand-maroon)]" : "text-white drop-shadow-md"}`}>
                  ASIAN FURNITURE
                </p>
                <p className={`text-[8px] md:text-[9px] tracking-[0.2em] uppercase font-bold mt-0.5 transition-colors duration-300 ${isSolid ? "text-[var(--brand-maroon)]" : "text-white/80 drop-shadow-md"}`}>
                  Since 2010
                </p>
              </div>
            </a>
            
            <div className={`hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] xl:text-sm font-semibold tracking-wide transition-colors duration-300 ${isSolid ? "text-[var(--brand-text)]" : "text-white"}`}>
              {navigationData.map((item) => (
                <div 
                  key={item.title}
                  className="relative group py-4"
                  onMouseEnter={() => item.columns.length > 0 && setActiveDropdown(item.title)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a href={item.columns.length > 0 ? "#" : `/${item.title.toLowerCase().replace(' ', '-')}`} className="hover:text-[var(--brand-maroon)] transition flex items-center gap-1">
                    {item.title}
                    {item.columns.length > 0 && <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                  </a>

                  {item.columns.length > 0 && activeDropdown === item.title && (
                    <div className="absolute top-[90%] left-1/2 -translate-x-1/2 mt-2 w-max min-w-[600px] bg-white shadow-2xl border border-[var(--brand-border)] p-8 grid grid-cols-4 gap-8 z-[100] rounded-none transition-all duration-200">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-[var(--brand-border)] rotate-45"></div>
                      {item.columns.map((col) => (
                        <div key={col.heading} className="min-w-[120px]">
                          <h4 className="font-bold text-[var(--brand-text)] mb-4 text-sm">{col.heading} &rarr;</h4>
                          <ul className="space-y-2 text-sm text-[var(--brand-muted)]">
                            {col.items.map((subItem) => <li key={subItem}><a href="#" className="hover:text-[var(--brand-maroon)] transition-colors">{subItem}</a></li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={`flex items-center gap-4 md:gap-6 transition-colors duration-300 ${isSolid ? "text-[var(--brand-text)]" : "text-white"}`}>
              <a href="/search" className="hidden md:block hover:text-[var(--brand-maroon)] transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></a>
              <a href="/cart" className="relative hover:text-[var(--brand-maroon)] transition group">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="absolute -top-1 -right-2 bg-[var(--brand-maroon)] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full group-hover:bg-black transition">0</span>
              </a>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </nav>

          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-[var(--brand-border)] shadow-lg py-4 px-6 flex flex-col gap-4 text-sm font-semibold text-[var(--brand-text)] max-h-[80vh] overflow-y-auto">
              {navigationData.map((item) => (
                <div key={item.title}>
                  <a href={`/${item.title.toLowerCase().replace(' ', '-')}`} className="block py-2 border-b border-gray-100 hover:text-[var(--brand-maroon)] transition">{item.title}</a>
                </div>
              ))}
            </div>
          )}
        </header>
      </div>
      
      {/* SPACER: Only renders on pages that need it (Shop, Product) to push content down */}
      {forceSolid && <div className="h-[60px] md:h-[72px]" />}
    </>
  );
}