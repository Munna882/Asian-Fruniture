"use client";
import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";

export default function AddToCartButton({ 
  variantId, 
  productId, 
  name, 
  price, 
  image, 
  stock 
}: { 
  variantId: string, 
  productId: string, 
  name: string, 
  price: number, 
  image: string,
  stock: number 
}) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id: variantId, productId, name, price, image, quantity });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (stock <= 0) {
    return (
      <div className="w-full bg-gray-200 text-gray-500 text-center py-4 text-sm font-bold uppercase tracking-wider cursor-not-allowed">
        Out of Stock
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-[var(--brand-border)]">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-lg hover:text-[var(--brand-maroon)]">&minus;</button>
          <span className="px-4 py-3 text-sm font-semibold w-12 text-center">{quantity}</span>
          <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="px-4 py-3 text-lg hover:text-[var(--brand-maroon)]">+</button>
        </div>
        <button 
          onClick={handleAdd}
          className={`flex-1 text-white text-sm font-bold uppercase tracking-wider py-3 transition-colors shadow-lg ${
            isAdded ? 'bg-[var(--brand-green)]' : 'bg-[var(--brand-maroon)] hover:bg-[var(--brand-maroon-dark)]'
          }`}
        >
          {isAdded ? 'Added to Cart ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
