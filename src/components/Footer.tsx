export default function Footer() {
  return (
    <footer className="bg-white text-[var(--brand-text)] pt-12 md:pt-16 pb-8 md:pb-10 px-4 md:px-6 border-t-4 border-[var(--brand-maroon)]">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-12">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Asian Furniture" className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-full mb-4 md:mb-6" />
            <p className="text-xs md:text-sm text-[var(--brand-muted)] leading-relaxed mb-4 md:mb-6">
              Premium quality home & office furniture.<br />
              Design, customization & factory-direct pricing since 2010.
            </p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs tracking-[0.15em] mb-3 md:mb-6 text-[var(--brand-maroon)] font-bold uppercase">Collections</p>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-[var(--brand-muted)] font-medium">
              <li><a href="/collections/bedroom" className="hover:text-[var(--brand-maroon)] transition">Bedroom</a></li>
              <li><a href="/collections/living-room" className="hover:text-[var(--brand-maroon)] transition">Living Room</a></li>
              <li><a href="/collections/dining" className="hover:text-[var(--brand-maroon)] transition">Dining Room</a></li>
              <li><a href="/collections/office" className="hover:text-[var(--brand-maroon)] transition">Office Furniture</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] md:text-xs tracking-[0.15em] mb-3 md:mb-6 text-[var(--brand-maroon)] font-bold uppercase">Company</p>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-[var(--brand-muted)] font-medium">
              <li><a href="/about" className="hover:text-[var(--brand-maroon)] transition">About Us</a></li>
              <li><a href="/showrooms" className="hover:text-[var(--brand-maroon)] transition">Showrooms</a></li>
              <li><a href="/journal" className="hover:text-[var(--brand-maroon)] transition">Journal</a></li>
              <li><a href="/contact" className="hover:text-[var(--brand-maroon)] transition">Contact Us</a></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-[10px] md:text-xs tracking-[0.15em] mb-3 md:mb-6 text-[var(--brand-maroon)] font-bold uppercase">Customer Care</p>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-[var(--brand-muted)] font-medium">
              <li><a href="/policies/warranty" className="hover:text-[var(--brand-maroon)] transition">5 Year Warranty</a></li>
              <li><a href="/policies/delivery" className="hover:text-[var(--brand-maroon)] transition">Delivery Info</a></li>
              <li><a href="/policies/returns" className="hover:text-[var(--brand-maroon)] transition">Returns</a></li>
              <li><a href="/policies/privacy" className="hover:text-[var(--brand-maroon)] transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 md:pt-8 border-t border-[var(--brand-border)] flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[10px] md:text-xs text-[var(--brand-muted)] font-medium text-center md:text-left">
          <p>&copy; 2026 Asian Furniture. All rights reserved.</p>
          <p className="uppercase tracking-widest text-[var(--brand-maroon)] font-bold">Made in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}