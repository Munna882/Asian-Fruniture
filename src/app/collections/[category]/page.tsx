import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";


export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryName = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // Fetch products for this specific category from DB
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        name: categoryName
      }
    },
    include: {
      category: true,
      variants: true,
      images: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />
      
      <div className="bg-[var(--brand-cream)] py-16 px-6 border-b border-[var(--brand-border)] text-center mt-20">
        <h1 className="font-display text-4xl md:text-5xl mb-4">{categoryName}</h1>
        <p className="text-[var(--brand-muted)]">Discover our premium {categoryName.toLowerCase()} collection.</p>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-16">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-6">No products found in this category yet.</p>
            <Link href="/shop" className="btn-primary inline-block px-8 py-3 text-xs font-bold uppercase tracking-wider">
              View Full Catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const baseVariant = product.variants[0];
              const priceBdt = baseVariant ? (Number(baseVariant.price) / 100).toLocaleString('en-US') : '0';
              
              return (
                <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer block">
                  <div className="relative aspect-[4/5] bg-[var(--brand-surface)] overflow-hidden mb-4 border border-[var(--brand-border)] img-hover-zoom">
                    {product.images.length > 0 ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-display text-lg text-[var(--brand-text)] font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-[var(--brand-maroon)] font-semibold">৳ {priceBdt}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}