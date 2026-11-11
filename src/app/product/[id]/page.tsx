import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id, status: "PUBLISHED" },
    select: { name: true, description: true }
  });

  if (!product) {
    return { title: "Product Not Found | Asian Furniture" };
  }

  return {
    title: `${product.name} | Asian Furniture`,
    description: product.description || `Buy ${product.name} from Asian Furniture.`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // ✅ CRITICAL FIX: Await params for Next.js 15
  const resolvedParams = await params;
  
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id, status: "PUBLISHED" },
    include: {
      category: true,
      variants: true,
      images: true,
    }
  });

  if (!product) {
    notFound();
  }

  const baseVariant = product.variants[0];
  const priceBdt = baseVariant ? Number(baseVariant.price) / 100 : 0;
  const primaryImage = product.images[0]?.url || "";
  const stock = baseVariant?.stock || 0;

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden pb-20 lg:pb-0">
      <Header forceSolid={true} />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 text-[10px] md:text-xs text-[var(--brand-muted)] font-medium mt-20">
        <Link href="/" className="hover:text-[var(--brand-maroon)]">Home</Link> <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-[var(--brand-maroon)]">Shop</Link> <span className="mx-2">/</span>
        <span className="text-[var(--brand-text)]">{product.name}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Images Section */}
        <div className="flex flex-col-reverse md:flex-row gap-4">
          {product.images.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible w-full md:w-24 shrink-0">
              {product.images.map((img, idx) => (
                <div key={img.id} className="relative w-20 h-24 md:w-full md:h-32 shrink-0 overflow-hidden border border-[var(--brand-border)]">
                  <img src={img.url} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          
          <div className="relative w-full aspect-[4/5] md:aspect-[3/4] bg-[var(--brand-surface)] overflow-hidden">
            {primaryImage ? (
              <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
            <span className="absolute top-4 left-4 bg-[var(--brand-maroon)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
              {product.category.name}
            </span>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="flex flex-col">
          <p className="text-[10px] md:text-xs text-[var(--brand-muted)] uppercase tracking-widest mb-2">Asian Furniture Collection</p>
          <h1 className="font-display text-3xl md:text-5xl text-[var(--brand-text)] mb-2 leading-tight">{product.name}</h1>
          <p className="text-xl md:text-2xl text-[var(--brand-maroon)] font-semibold mb-6">৳ {priceBdt.toLocaleString('en-US')}</p>

          <p className="text-[var(--brand-muted)] text-sm leading-relaxed mb-8">
            {product.description || "No description available for this product."}
          </p>

          <AddToCartButton 
            variantId={baseVariant?.id || "default-variant"}
            productId={product.id}
            name={product.name}
            price={Number(baseVariant?.price || 0)}
            image={primaryImage}
            stock={stock}
          />

          <div className="border-t border-[var(--brand-border)] mt-10">
            <div className="border-b border-[var(--brand-border)] py-4 text-sm text-[var(--brand-muted)]">
              <strong>SKU:</strong> {baseVariant?.sku || "N/A"}
            </div>
            <div className="border-b border-[var(--brand-border)] py-4 text-sm text-[var(--brand-muted)]">
              <strong>Availability:</strong> {stock > 0 ? "Available for enquiry" : "Contact showroom for availability"}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
