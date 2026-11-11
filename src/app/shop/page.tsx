import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default async function ShopPage() {
  // Fetch live products from the database
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: true,
      variants: true,
      images: true, // FIXED: Include images array
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      <div className="bg-[var(--brand-cream)] py-10 md:py-16 px-4 md:px-6 border-b border-[var(--brand-border)] mt-20">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl text-[var(--brand-text)] mb-2">All Furniture</h1>
          <p className="text-[var(--brand-muted)] text-sm">Discover premium pieces for every room in your home.</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500">No products found in the database. Please add some via the Admin Dashboard.</p>
            </div>
          ) : (
            products.map((product) => {
              const baseVariant = product.variants[0];
              const priceBdt = baseVariant ? (Number(baseVariant.price) / 100).toLocaleString('en-US') : '0';
              
              // FIXED: Read from images array instead of imageUrl
              const primaryImage = product.images[0]?.url;

              return (
                <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer block">
                  <div className="relative aspect-[4/5] bg-[var(--brand-surface)] overflow-hidden mb-4 border border-[var(--brand-border)] img-hover-zoom">
                    {primaryImage ? (
                      <img 
                        src={primaryImage} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                    
                    {/* Display Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[var(--brand-text)] text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                      {product.category.name}
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-display text-lg text-[var(--brand-text)] font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-[var(--brand-maroon)] font-semibold">৳ {priceBdt}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
