"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CartPage() {
  // Mock cart data
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Linden Sofa",
      category: "Living Room",
      color: "Maroon Velvet",
      price: 45000,
      quantity: 1,
      stock: 3, // Marketing: Scarcity
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Dahila Armchair",
      category: "Living Room",
      color: "Forest Green",
      price: 18500,
      quantity: 2,
      stock: 10,
      image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop",
    },
  ]);

  const updateQuantity = (id: number, change: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + change) };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const formattedSubtotal = subtotal.toLocaleString('en-US');

  // Marketing: Free Shipping Logic
  const freeShippingThreshold = 60000;
  const amountAway = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Cross-sell products
  const recommendedProducts = [
    { name: "Modern Floor Lamp", price: "\u09F3 8,500", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400&auto=format&fit=crop" },
    { name: "Teak Coffee Table", price: "\u09F3 15,000", image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=400&auto=format&fit=crop" },
    { name: "Wool Throw Blanket", price: "\u09F3 3,500", image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?q=80&w=400&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--brand-text)] font-sans overflow-x-hidden">
      <Header forceSolid={true} />

      {/* ============ ANNIVERSARY PROMO BANNER ============ */}
      <div className="bg-[var(--brand-maroon)] text-white py-3 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <p className="relative z-10 text-xs md:text-sm tracking-widest font-medium">
          🎉 <strong>16th Anniversary Offer:</strong> Use code <span className="bg-white text-[var(--brand-maroon)] px-2 py-0.5 rounded font-bold mx-1">16YEARS</span> at checkout for 15% OFF selected items.
        </p>
      </div>

      {/* ============ PAGE HEADER ============ */}
      <div className="bg-white py-8 md:py-12 px-4 md:px-6 border-b border-[var(--brand-border)]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--brand-text)]">Your Shopping Cart</h1>
            <p className="text-[var(--brand-muted)] text-sm mt-1">
              {cartItems.length === 0 ? "Your cart is empty." : `You have ${cartItems.reduce((a, b) => a + b.quantity, 0)} items in your cart.`}
            </p>
          </div>
          <a href="/shop" className="text-xs font-bold uppercase tracking-wider text-[var(--brand-maroon)] border-b-2 border-[var(--brand-maroon)] pb-1 hover:text-black hover:border-black transition">
            Continue Shopping
          </a>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16">
        
        {cartItems.length === 0 ? (
          /* ============ EMPTY STATE ============ */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-[var(--brand-cream)] rounded-full flex items-center justify-center mb-6 text-[var(--brand-maroon)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h2 className="font-display text-2xl md:text-3xl mb-3">Your cart is waiting.</h2>
            <p className="text-[var(--brand-muted)] mb-8 max-w-md">Looks like you haven't added any furniture to your cart yet. Explore our collections to find the perfect piece for your home.</p>
            <a href="/shop" className="btn-primary px-10 py-4 text-xs font-bold uppercase tracking-wider shadow-lg">
              Explore Collections
            </a>
          </div>
        ) : (
          /* ============ CART LAYOUT ============ */
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            
            {/* LEFT: Cart Items */}
            <div className="flex-1">
              
              {/* Marketing: Free Shipping Progress */}
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

              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[var(--brand-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              <div className="flex flex-col">
                {cartItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-[var(--brand-border)] items-center">
                    
                    {/* Product Image & Info */}
                    <div className="col-span-1 md:col-span-6 flex items-center gap-6">
                      <div className="w-24 h-32 md:w-32 md:h-40 shrink-0 bg-[var(--brand-surface)] overflow-hidden border border-[var(--brand-border)]">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-wider mb-1">{item.category}</p>
                        <h3 className="font-display text-xl md:text-2xl text-[var(--brand-text)] font-bold mb-1">{item.name}</h3>
                        <p className="text-sm text-[var(--brand-muted)] mb-2">Color: {item.color}</p>
                        
                        {/* Marketing: Urgency / Scarcity */}
                        {item.stock < 5 && (
                          <p className="text-xs text-red-600 font-semibold mb-3 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            Only {item.stock} left in stock - order soon!
                          </p>
                        )}

                        <button onClick={() => removeItem(item.id)} className="text-xs text-[var(--brand-muted)] hover:text-red-600 underline underline-offset-4 flex items-center gap-1 transition-colors mt-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 md:col-span-2 text-left md:text-center">
                      <span className="md:hidden text-xs text-[var(--brand-muted)] mr-2">Price:</span>
                      <span className="text-sm font-semibold text-[var(--brand-muted)]">৳ {item.price.toLocaleString('en-US')}</span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                      <div className="flex items-center border border-[var(--brand-border)] bg-white">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-2 text-gray-500 hover:text-[var(--brand-maroon)] hover:bg-gray-50 transition text-lg">&minus;</button>
                        <span className="px-4 py-2 text-sm font-semibold w-12 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-2 text-gray-500 hover:text-[var(--brand-maroon)] hover:bg-gray-50 transition text-lg">+</button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-1 md:col-span-2 text-left md:text-right">
                      <span className="md:hidden text-xs text-[var(--brand-muted)] mr-2">Total:</span>
                      <span className="text-base font-bold text-[var(--brand-maroon)]">৳ {(item.price * item.quantity).toLocaleString('en-US')}</span>
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

                <div className="mb-6">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Promo code" className="flex-1 border border-[var(--brand-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand-maroon)] transition" />
                    <button className="border border-[var(--brand-text)] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[var(--brand-text)] hover:text-white transition">Apply</button>
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

                <a href="/checkout" className="block w-full bg-[var(--brand-maroon)] text-white text-center py-4 text-sm font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-lg mb-6">
                  Proceed to Checkout
                </a>
                
                {/* Marketing: Trust Signals */}
                <div className="space-y-3 bg-white p-4 border border-[var(--brand-border)]">
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)] font-medium">
                    <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>100% Secure SSL Checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)] font-medium">
                    <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    <span>5-Year Structural Warranty</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)] font-medium">
                    <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>Easy 7-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ MARKETING: CROSS-SELL (COMPLETE YOUR SPACE) ============ */}
      {cartItems.length > 0 && (
        <div className="bg-[var(--brand-cream)] py-16 px-4 md:px-6 border-t border-[var(--brand-border)]">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl mb-2">Complete Your Space</h2>
              <p className="text-[var(--brand-muted)] text-sm">Pieces that pair beautifully with your selection.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedProducts.map((prod, idx) => (
                <div key={idx} className="bg-white border border-[var(--brand-border)] p-4 flex items-center justify-between hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-24 bg-[var(--brand-surface)] overflow-hidden shrink-0">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold mb-1">{prod.name}</h3>
                      <p className="text-sm text-[var(--brand-maroon)] font-semibold">{prod.price}</p>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-maroon)] hover:bg-[var(--brand-maroon)] hover:text-white transition-colors">
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}