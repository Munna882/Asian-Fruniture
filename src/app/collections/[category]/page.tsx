import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CategoryPage({ params }: { params: { category: string } }) {
  // Format the slug (e.g., "living-room" -> "Living Room")
  const categoryName = params.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const products = [
    { name: "Linden Sofa", price: "\u09F3 45,000", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop" },
    { name: "Dahila Armchair", price: "\u09F3 18,500", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop" },
    { name: "Marigold Lounge", price: "\u09F3 32,000", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop" },
    { name: "Teak Dining Table", price: "\u09F3 55,000", image: "https://images.unsplash.com/photo-1617806118233-18e1c48e3b64?q=80&w=800&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans pt-20 md:pt-24">
      <Header forceSolid={true} />
      
      <div className="bg-[var(--brand-cream)] py-16 px-6 border-b border-[var(--brand-border)] text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-4">{categoryName}</h1>
        <p className="text-[var(--brand-muted)]">Discover our premium {categoryName.toLowerCase()} collection.</p>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((prod, idx) => (
            <a key={idx} href="/product" className="group cursor-pointer block">
              <div className="relative aspect-[4/5] bg-[var(--brand-surface)] overflow-hidden mb-4 border border-[var(--brand-border)] img-hover-zoom">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg text-[var(--brand-text)] font-bold mb-1">{prod.name}</h3>
                <p className="text-sm text-[var(--brand-maroon)] font-semibold">{prod.price}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}