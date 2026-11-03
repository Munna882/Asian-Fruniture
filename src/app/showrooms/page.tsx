"use client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShowroomsPage() {
  const showrooms = [
    {
      name: "Gulshan Flagship Showroom",
      address: "House 12, Road 113, Gulshan-2, Dhaka 1212",
      phone: "+880 1711 000000",
      hours: "10:00 AM - 8:00 PM (Fri: 10:00 AM - 1:00 PM)",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1200&auto=format&fit=crop",
      mapLink: "https://maps.google.com/?q=Gulshan+2+Dhaka"
    },
    {
      name: "Dhanmondi Showroom",
      address: "Level 2, House 45, Road 27, Dhanmondi, Dhaka 1209",
      phone: "+880 1711 111111",
      hours: "10:00 AM - 8:00 PM (Fri: 10:00 AM - 1:00 PM)",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      mapLink: "https://maps.google.com/?q=Dhanmondi+Dhaka"
    },
    {
      name: "Chattogram Branch",
      address: "CDA Avenue, Nasirabad, Chattogram 4000",
      phone: "+880 1711 222222",
      hours: "10:00 AM - 8:00 PM (Fri: 10:00 AM - 1:00 PM)",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop",
      mapLink: "https://maps.google.com/?q=CDA+Avenue+Chattogram"
    },
    {
      name: "Sylhet Showroom",
      address: "Zindabazar Point, Sylhet 3100",
      phone: "+880 1711 333333",
      hours: "10:00 AM - 8:00 PM (Fri: 10:00 AM - 1:00 PM)",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
      mapLink: "https://maps.google.com/?q=Zindabazar+Sylhet"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      {/* ============ PAGE HERO ============ */}
      <section className="bg-[var(--brand-cream)] py-20 md:py-28 px-4 md:px-6 border-b border-[var(--brand-border)] text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-[var(--brand-maroon)] text-xs md:text-sm tracking-[0.25em] font-bold uppercase mb-4">
            The Physical Experience
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[var(--brand-text)] mb-6 leading-[1.1]">
            Visit Our Showrooms.
          </h1>
          <p className="text-[var(--brand-muted)] text-base md:text-lg leading-relaxed">
            A photograph can only capture so much. Come feel the texture of the wood, test the comfort of the upholstery, and experience the true craftsmanship of Asian Furniture in person.
          </p>
        </div>
      </section>

      {/* ============ SHOWROOM GRID ============ */}
      <section className="py-16 md:py-24 px-4 md:px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {showrooms.map((room, index) => (
            <div key={index} className="group flex flex-col bg-white border border-[var(--brand-border)] shadow-sm hover:shadow-xl transition-shadow duration-300">
              
              {/* Image */}
              <div className="relative h-[300px] md:h-[400px] overflow-hidden">
                <img 
                  src={room.image} 
                  alt={room.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 bg-[var(--brand-maroon)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                  Showroom
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <h2 className="font-display text-2xl md:text-3xl text-[var(--brand-text)] font-bold mb-4">
                  {room.name}
                </h2>
                
                <div className="space-y-3 text-sm text-[var(--brand-muted)] mb-8 flex-1">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 text-[var(--brand-maroon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{room.address}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 text-[var(--brand-maroon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{room.hours}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 text-[var(--brand-maroon)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span>{room.phone}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-6 border-t border-[var(--brand-border)]">
                  <a href={room.mapLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[var(--brand-maroon)] text-white text-center py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors">
                    Get Directions
                  </a>
                  <a href={`tel:${room.phone.replace(/\s/g, '')}`} className="flex-1 border border-[var(--brand-text)] text-[var(--brand-text)] text-center py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-[var(--brand-text)] hover:text-white transition-colors">
                    Call Showroom
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="bg-[var(--brand-maroon)] py-16 md:py-24 px-4 md:px-6 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl mb-6">Need help finding us?</h2>
          <p className="text-white/80 text-base md:text-lg mb-10 max-w-xl mx-auto">
            Our team is ready to assist you with directions, stock availability, or booking a private viewing.
          </p>
          <a href="/contact" className="bg-white text-[var(--brand-maroon)] px-10 py-4 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition shadow-lg inline-block">
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}