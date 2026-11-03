"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomePage() {
  const categories = [
    { name: "Sofa", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop", gridClass: "col-span-2 row-span-2 md:col-span-2 md:row-span-2 lg:col-span-3 lg:row-span-2" },
    { name: "Bed", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=800&auto=format&fit=crop", gridClass: "col-span-1 row-span-1 md:col-span-1 md:row-span-1 lg:col-span-3 lg:row-span-1" },
    { name: "Dining", image: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?q=80&w=800&auto=format&fit=crop", gridClass: "col-span-1 row-span-1 md:col-span-1 md:row-span-1 lg:col-span-3 lg:row-span-1" },
    { name: "Wardrobe", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop", gridClass: "col-span-1 row-span-1 md:col-span-2 md:row-span-1 lg:col-span-2 lg:row-span-1" },
    { name: "Dressing Table", image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=800&auto=format&fit=crop", gridClass: "col-span-1 row-span-1 md:col-span-1 md:row-span-1 lg:col-span-2 lg:row-span-1" },
    { name: "Office", image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop", gridClass: "col-span-2 row-span-1 md:col-span-1 md:row-span-1 lg:col-span-2 lg:row-span-1" },
  ];

  const products = [
    { name: "Linden-361", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1000&auto=format&fit=crop" },
    { name: "Dahila-130", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop" },
    { name: "Marigold-113", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      
      {/* GLOBAL HEADER */}
      <Header />

      {/* ============ HERO ============ */}
      <section className="relative w-full h-[85vh] md:h-[90vh] bg-gray-200">
        <img 
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop" 
          alt="Living Room Collection" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-6 pt-32 md:pt-40">
          <p className="text-white text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase mb-3 md:mb-4 drop-shadow-md">
            The 2024 Collection
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-white mb-6 md:mb-8 drop-shadow-lg max-w-3xl leading-tight">
            Furniture for living.
          </h1>
          <a href="/collections" className="btn-outline px-8 md:px-10 py-3 md:py-4 text-[10px] md:text-xs font-bold tracking-widest uppercase bg-transparent">
            Shop The Collection
          </a>
        </div>
      </section>

      {/* ============ 16-YEAR ANNIVERSARY CAMPAIGN ============ */}
      <section className="bg-[var(--brand-maroon)] section-padding px-4 md:px-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-20 opacity-5 pointer-events-none hidden md:block">
          <span className="font-display text-[400px] leading-none text-white font-bold">16</span>
        </div>

        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">
          <div>
            <div className="inline-block border border-[var(--brand-gold)] text-[var(--brand-gold)] px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4 md:mb-6">
              Anniversary Milestone
            </div>
            
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-white mb-4 md:mb-6 leading-[1.1]">
              16 Years of Making <br className="hidden sm:block"/> Homes Beautiful.
            </h2>
            
            <p className="text-lg md:text-2xl text-[var(--brand-cream)] font-medium mb-8 md:mb-10">
              Celebrate with us â€” Enjoy Up to <span className="text-[var(--brand-gold)] font-bold">15% OFF</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10">
              <div className="bg-white/10 border border-white/20 p-4 md:p-5 backdrop-blur-sm">
                <p className="text-[var(--brand-gold)] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">In-Store Offer</p>
                <p className="text-white text-xs md:text-sm">Up to 15% off on <strong>all products</strong>. Visit any showroom to claim.</p>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 md:p-5 backdrop-blur-sm">
                <p className="text-[var(--brand-gold)] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">Online Offer</p>
                <p className="text-white text-xs md:text-sm">Up to 15% off on <strong>selected products</strong>. Look for the anniversary tag.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <a href="/collections/anniversary" className="bg-[var(--brand-gold)] text-[var(--brand-maroon-dark)] px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-bold tracking-wider uppercase hover:bg-[var(--brand-gold-light)] transition shadow-lg text-center">
                Shop Anniversary Offers
              </a>
              <a href="/showrooms" className="border border-white text-white px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-bold tracking-wider uppercase hover:bg-white hover:text-[var(--brand-maroon)] transition text-center">
                Visit Our Showrooms
              </a>
            </div>
          </div>

          <div className="relative h-[300px] md:h-[500px] block mt-8 lg:mt-0">
            <img 
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop" 
              alt="Asian Furniture 16 Year Anniversary Collection" 
              className="w-full h-full object-cover border-[4px] border-[var(--brand-gold)]/30"
            />
            <div className="absolute -bottom-4 -left-2 md:-bottom-6 md:-left-6 bg-white p-4 md:p-6 shadow-2xl">
              <p className="font-display text-2xl md:text-4xl text-[var(--brand-maroon)] font-bold">16</p>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">Years of Trust</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PREMIUM COLLECTION ============ */}
      <section className="relative w-full h-[500px] md:h-[600px] lg:h-[800px] flex items-center bg-black">
        <img 
          src="/premium-bedroom.png" 
          alt="Asian Furniture Premium Collection - Bedroom Suite" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/50 md:bg-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/30 md:to-transparent"></div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 w-full text-center md:text-left">
          <div className="max-w-xl text-white mx-auto md:mx-0">
            <p className="text-[var(--brand-gold)] text-[10px] md:text-xs tracking-[0.25em] font-bold uppercase mb-3 md:mb-6 drop-shadow-md">
              The Signature Series
            </p>
            <h2 className="font-display text-4xl md:text-7xl mb-6 md:mb-10 leading-[1.1] drop-shadow-lg">
              Uncompromising <br/> Luxury.
            </h2>
            <a href="/collections/signature" className="bg-white text-[var(--brand-maroon)] px-8 md:px-10 py-3 md:py-4 text-[10px] md:text-xs font-bold tracking-wider uppercase inline-block hover:bg-gray-100 transition-colors shadow-xl">
              Explore The Collection
            </a>
          </div>
        </div>
      </section>

      {/* ============ RESPONSIVE CATEGORY GRID ============ */}
      <section className="section-padding px-4 md:px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[var(--brand-text)]">Explore by Category</h2>
            <div className="w-12 md:w-16 h-[2px] bg-[var(--brand-gold)] mx-auto mt-3 md:mt-4"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 lg:gap-6 auto-rows-[160px] md:auto-rows-[240px] lg:auto-rows-[300px]">
            {categories.map((cat) => (
              <a 
                key={cat.name} 
                href={`/collections/${cat.name.toLowerCase().replace(' ', '-')}`} 
                className={`group relative overflow-hidden bg-gray-100 img-hover-zoom ${cat.gridClass}`}
              >
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover "
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:bg-black/50 transition-colors duration-300"></div>
                
                <div className="absolute bottom-0 left-0 p-3 md:p-6 w-full">
                  <h3 className="font-display text-lg md:text-2xl lg:text-3xl text-white font-bold drop-shadow-lg mb-0.5 md:mb-1 leading-tight">{cat.name}</h3>
                  <p className="text-white/80 text-[8px] md:text-[10px] lg:text-xs font-bold uppercase tracking-widest group-hover:text-[var(--brand-gold)] transition-colors">
                    Shop Now &rarr;
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      <section className="section-padding px-4 md:px-6 bg-white border-t border-[var(--brand-border)]">
        <div className="max-w-[1400px] mx-auto">
          
          <div className="flex items-center gap-8 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <a href="#" className="flex items-center gap-2 text-xl md:text-2xl font-semibold text-black whitespace-nowrap">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              New Arrivals
            </a>
            <a href="#" className="text-xl md:text-2xl font-semibold text-gray-400 whitespace-nowrap hover:text-gray-600 transition">
              What's Trending
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {products.map((prod, idx) => (
              <a href="/product" key={idx} className="group cursor-pointer block">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-full h-full object-cover "
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-sans text-sm md:text-base text-gray-700">{prod.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INSPIRATION ============ */}
      <section className="section-padding px-4 md:px-6 bg-white border-t border-[var(--brand-border)]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-display text-3xl md:text-5xl text-[var(--brand-text)]">Inspiration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <a href="/inspiration/living" className="group relative h-[300px] md:h-[600px] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop" 
                alt="Living Room Inspiration" 
                className="w-full h-full object-cover "
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10">
                <h3 className="font-display text-3xl md:text-4xl text-white mb-1 md:mb-2 drop-shadow-md">The Living Room</h3>
                <p className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">Explore &rarr;</p>
              </div>
            </a>
            <a href="/inspiration/bedroom" className="group relative h-[300px] md:h-[600px] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop" 
                alt="Bedroom Inspiration" 
                className="w-full h-full object-cover "
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10">
                <h3 className="font-display text-3xl md:text-4xl text-white mb-1 md:mb-2 drop-shadow-md">The Bedroom</h3>
                <p className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest">Explore &rarr;</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ============ SHOWROOM DISCOVERY (Editorial) ============ */}
      <section className="bg-[var(--brand-cream)] border-t border-[var(--brand-border)] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
          <div className="relative h-[400px] lg:h-[700px] w-full overflow-hidden">
             <img 
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1500&auto=format&fit=crop" 
              alt="Asian Furniture Showroom Experience" 
              className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <div className="flex flex-col justify-center px-6 py-16 md:px-20 lg:px-24">
            <div className="max-w-md border-l-2 border-[var(--brand-gold)] pl-6 md:pl-8">
              <p className="text-[var(--brand-maroon)] text-xs md:text-sm tracking-[0.25em] font-bold uppercase mb-4">
                The Showroom Experience
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[var(--brand-text)] mb-6 leading-[1.1]">
                Feel the <br/> Craftsmanship.
              </h2>
              <p className="text-[var(--brand-muted)] text-sm md:text-base leading-relaxed mb-10">
                A photograph can only capture so much. Visit one of our showrooms to feel the texture of the wood, test the comfort of the upholstery, and speak directly with our furniture experts.
              </p>
              <a href="/showrooms" className="btn-primary inline-block px-10 py-4 text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all">
                Locate a Showroom
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}