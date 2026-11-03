"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const values = [
    {
      title: "Uncompromising Quality",
      description: "We source the finest materials and employ master carpenters to ensure every piece is built to last generations.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      )
    },
    {
      title: "16 Years of Heritage",
      description: "Founded in 2010, we have spent over a decade understanding the needs of Bangladeshi homes, evolving our designs while staying true to our roots.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      title: "Dedicated Service",
      description: "From our showrooms to your living room, our team is committed to providing a seamless, transparent, and premium experience.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      {/* ============ PAGE HERO ============ */}
      <section className="relative bg-[var(--brand-cream)] py-24 md:py-32 px-4 md:px-6 border-b border-[var(--brand-border)] text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-[var(--brand-maroon)] text-xs md:text-sm tracking-[0.25em] font-bold uppercase mb-4">
            Our Story
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-[var(--brand-text)] mb-6 leading-[1.1]">
            Crafting Homes <br className="hidden md:block" /> Since 2010.
          </h1>
          <p className="text-[var(--brand-muted)] text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Asian Furniture was born from a simple idea: that the families of Bangladesh deserve world-class furniture that is built to last, crafted with integrity, and designed for the way we actually live.
          </p>
        </div>
      </section>

      {/* ============ THE BRAND STORY ============ */}
      <section className="py-16 md:py-24 px-4 md:px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative h-[400px] lg:h-[600px] w-full">
            <img 
              src="https://images.unsplash.com/photo-1622398925373-3f91b1e275f5?q=80&w=1200&auto=format&fit=crop" 
              alt="Asian Furniture Workshop" 
              className="w-full h-full object-cover border border-[var(--brand-border)] shadow-xl"
            />
            {/* Floating Gold Frame Element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-4 border-[var(--brand-gold)] z-[-1] hidden md:block"></div>
          </div>
          
          <div>
            <h2 className="font-display text-3xl md:text-5xl mb-6 leading-[1.1]">
              From Our Workshop <br/> To Your Living Room.
            </h2>
            <div className="space-y-6 text-[var(--brand-muted)] text-base leading-relaxed">
              <p>
                What started in 2010 as a small carpentry workshop in the heart of Dhaka has grown into one of the most trusted names in Bangladeshi furniture. For over 16 years, we have been shaping wood, refining designs, and listening to our customers.
              </p>
              <p>
                We don't just sell furniture; we manufacture it. This means we control every step of the process—from selecting the raw timber to the final hand-polish. By cutting out the middlemen, we deliver factory-direct pricing without ever compromising on quality.
              </p>
              <p>
                Today, our showrooms across Bangladesh stand as a testament to our commitment to craftsmanship, offering families a place to touch, feel, and experience the difference of true Asian Furniture quality.
              </p>
            </div>
            <div className="mt-10">
              <img src="/logo.png" alt="Asian Furniture Logo" className="h-16 w-auto object-contain opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ CRAFTSMANSHIP IMAGES ============ */}
      <section className="py-16 md:py-24 bg-[var(--brand-maroon)] text-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl mb-4 text-white">The Art of Craftsmanship</h2>
            <p className="text-white/70 max-w-2xl mx-auto">Every joint, every curve, and every finish is a result of decades of combined experience from our master carpenters.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative h-[300px] overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800&auto=format&fit=crop" alt="Woodworking detail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20"></div>
              <p className="absolute bottom-6 left-6 font-display text-xl drop-shadow-md">Raw Timber Selection</p>
            </div>
            <div className="relative h-[300px] overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop" alt="Master carpenter at work" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20"></div>
              <p className="absolute bottom-6 left-6 font-display text-xl drop-shadow-md">Handcrafted Joinery</p>
            </div>
            <div className="relative h-[300px] overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop" alt="Polishing and finish" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20"></div>
              <p className="absolute bottom-6 left-6 font-display text-xl drop-shadow-md">Premium Hand-Finishing</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BRAND VALUES ============ */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-[var(--brand-cream)]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl mb-4">Our Promise to You</h2>
            <div className="w-16 h-[2px] bg-[var(--brand-gold)] mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto bg-white border border-[var(--brand-border)] rounded-full flex items-center justify-center text-[var(--brand-maroon)] mb-6 shadow-sm">
                  {value.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--brand-text)] mb-4">{value.title}</h3>
                <p className="text-sm text-[var(--brand-muted)] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="bg-white py-20 px-4 md:px-6 border-t border-[var(--brand-border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl mb-6">Experience the Difference</h2>
          <p className="text-[var(--brand-muted)] mb-8">Visit one of our showrooms to see the craftsmanship up close and speak with our furniture experts.</p>
          <a href="/showrooms" className="btn-primary inline-block px-10 py-4 text-xs font-bold tracking-wider uppercase shadow-lg hover:shadow-xl transition-all">
            Find a Showroom
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}