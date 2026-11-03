"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const subtotal = getTotal();
  const subtotalBdt = subtotal / 100;
  const formattedSubtotal = subtotalBdt.toLocaleString('en-US');

  const freeShippingThreshold = 60000; // 60,000 BDT
  const amountAway = Math.max(0, freeShippingThreshold - subtotalBdt);
  const progressPercent = Math.min(100, (subtotalBdt / freeShippingThreshold) * 100);

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      {/* PAGE HEADER */}
      <div className="bg-white py-8 md:py-12 px-4 md:px-6 border-b border-[var(--brand-border)] mt-20">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--brand-text)]">Your Shopping Cart</h1>
            <p className="text-[var(--brand-muted)] text-sm mt-1">
              {items.length === 0 ? "Your cart is empty." : `You have ${items.reduce((a, b) => a + b.quantity, 0)} items in your cart.`}
            </p>
          </div>
          <Link href="/shop" className="text-xs font-bold uppercase tracking-wider text-[var(--brand-maroon)] border-b-2 border-[var(--brand-maroon)] pb-1 hover:text-black hover:border-black transition">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-[var(--brand-cream)] rounded-full flex items-center justify-center mb-6 text-[var(--brand-maroon)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h2 className="font-display text-2xl md:text-3xl mb-3">Your cart is waiting.</h2>
            <p className="text-[var(--brand-muted)] mb-8 max-w-md">Looks like you haven't added any furniture to your cart yet. Explore our collections to find the perfect piece for your home.</p>
            <Link href="/shop" className="btn-primary px-10 py-4 text-xs font-bold uppercase tracking-wider shadow-lg">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            
            {/* LEFT: Cart Items */}
            <div className="flex-1">
              
              {/* Free Shipping Progress */}
              <div className="bg-[var(--brand-cream)] border border-[var(--brand-border)] p-4 mb-8">
                <p className="text-sm text-center mb-2 font-medium">
                  {amountAway > 0 
                    ? <>You are <span className="font-bold text-[var(--brand-maroon)]">৳ {amountAway.toLocaleString('en-US')}</span> away from <strong>FREE Delivery!</strong></>
                    : <>🎉 <strong>Congratulations!</strong> You have unlocked FREE Delivery.</>}
                </p>
                <div className="w-full bg-white border border-[var(--brand-border)] h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[var(--brand-maroon)] h-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-[var(--brand-border)] items-center">
                    
                    <div className="col-span-1 md:col-span-6 flex items-center gap-6">
                      <div className="w-24 h-32 md:w-32 md:h-40 shrink-0 bg-[var(--brand-surface)] overflow-hidden border border-[var(--brand-border)]">
                        <img src={item.image || "/placeholder.png"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl md:text-2xl text-[var(--brand-text)] font-bold mb-1">
                          <Link href={`/product/${item.productId}`} className="hover:text-[var(--brand-maroon)] transition">{item.name}</Link>
                        </h3>
                        
                        <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--brand-muted)] hover:text-red-600 underline underline-offset-4 flex items-center gap-1 transition-colors mt-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Remove
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 text-left md:text-center">
                      <span className="md:hidden text-xs text-[var(--brand-muted)] mr-2">Price:</span>
                      <span className="text-sm font-semibold text-[var(--brand-muted)]">৳ {(item.price / 100).toLocaleString('en-US')}</span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                      <div className="flex items-center border border-[var(--brand-border)] bg-white">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2 text-gray-500 hover:text-[var(--brand-maroon)] hover:bg-gray-50 transition text-lg">&minus;</button>
                        <span className="px-4 py-2 text-sm font-semibold w-12 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 text-gray-500 hover:text-[var(--brand-maroon)] hover:bg-gray-50 transition text-lg">+</button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 text-left md:text-right">
                      <span className="md:hidden text-xs text-[var(--brand-muted)] mr-2">Total:</span>
                      <span className="text-base font-bold text-[var(--brand-maroon)]">৳ {((item.price * item.quantity) / 100).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Sticky Order Summary */}
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="sticky top-32 bg-[var(--brand-cream)] p-6 md:p-8 border border-[var(--brand-border)] shadow-sm">
                <h2 className="font-display text-2xl text-[var(--brand-text)] mb-6 border-b border-[var(--brand-border)] pb-4">Order Summary</h2>
                
                <div className="space-y-4 text-sm text-[var(--brand-muted)] mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[var(--brand-text)]">৳ {formattedSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span className="text-xs italic">{amountAway > 0 ? 'Calculated at checkout' : 'FREE'}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--brand-border)] pt-4 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-[var(--brand-text)] uppercase tracking-wider">Total</span>
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--brand-muted)] block mb-1">Including VAT</span>
                      <span className="text-2xl font-bold text-[var(--brand-maroon)]">৳ {formattedSubtotal}</span>
                    </div>
                  </div>
                </div>

                <Link href="/checkout" className="block w-full bg-[var(--brand-maroon)] text-white text-center py-4 text-sm font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-lg mb-6">
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
