import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CollectionsPage() {
  const collections = [
    { name: "Living Room", slug: "living-room", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop" },
    { name: "Bedroom", slug: "bedroom", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=800&auto=format&fit=crop" },
    { name: "Dining Room", slug: "dining-room", image: "https://images.unsplash.com/photo-1617806118233-18e1c48e3b64?q=80&w=800&auto=format&fit=crop" },
    { name: "Office", slug: "office", image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans pt-20 md:pt-24">
      <Header forceSolid={true} />
      
      <div className="bg-[var(--brand-cream)] py-16 px-6 border-b border-[var(--brand-border)] text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-4">Our Collections</h1>
        <p className="text-[var(--brand-muted)]">Browse furniture curated for every room in your home.</p>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {collections.map((col) => (
          <a key={col.slug} href={`/collections/${col.slug}`} className="group relative h-[400px] overflow-hidden">
            <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300"></div>
            <div className="absolute bottom-8 left-8">
              <h2 className="font-display text-4xl text-white mb-2">{col.name}</h2>
              <p className="text-white text-xs font-bold uppercase tracking-widest">Explore &rarr;</p>
            </div>
          </a>
        ))}
      </div>
      
      <Footer />
    </div>
  );
}