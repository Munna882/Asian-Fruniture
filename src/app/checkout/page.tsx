"use client";
import { useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("bkash");

  // Mock cart data for the summary
  const cartItems = [
    { id: 1, name: "Linden Sofa", color: "Maroon Velvet", price: 45000, quantity: 1, image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "Dahila Armchair", color: "Forest Green", price: 18500, quantity: 2, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=200&auto=format&fit=crop" },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const delivery = 1500;
  const total = subtotal + delivery;

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]/30 text-[var(--brand-text)] font-sans">
      
      {/* ============ MINIMALIST SECURE HEADER ============ */}
      <header className="bg-white border-b border-[var(--brand-border)] py-4 px-4 md:px-6 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Asian Furniture" className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-full" />
            <div className="hidden sm:flex flex-col justify-center">
              <p className="font-display text-lg tracking-[0.1em] font-bold text-[var(--brand-maroon)] leading-tight">ASIAN FURNITURE</p>
              <p className="text-[8px] tracking-[0.2em] text-[var(--brand-maroon)] uppercase font-bold mt-0.5">Since 2010</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-[var(--brand-green)] bg-[var(--brand-green)]/10 px-4 py-2 rounded-full">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* ============ LEFT: CHECKOUT FORM ============ */}
          <div className="flex-1 bg-white p-6 md:p-10 border border-[var(--brand-border)] shadow-sm">
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-4 mb-10 text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)] border-b border-[var(--brand-border)] pb-6">
              <Link href="/cart" className="hover:text-[var(--brand-maroon)] transition">Cart</Link>
              <span className="text-[var(--brand-border)]">&rarr;</span>
              <span className="text-[var(--brand-maroon)] border-b-2 border-[var(--brand-maroon)] pb-1">Information</span>
              <span className="text-[var(--brand-border)]">&rarr;</span>
              <span>Payment</span>
            </div>

            <form className="space-y-10">
              
              {/* Section 1: Contact Info */}
              <div>
                <h2 className="font-display text-2xl mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">Phone Number *</label>
                    <input type="tel" placeholder="017XXXXXXXX" className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">Email Address (Optional)</label>
                    <input type="email" placeholder="you@example.com" className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition" />
                  </div>
                </div>
              </div>

              {/* Section 2: Shipping Address */}
              <div>
                <h2 className="font-display text-2xl mb-6">Delivery Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">Full Name *</label>
                    <input type="text" placeholder="Your Name" className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">Street Address *</label>
                    <input type="text" placeholder="House, Road, Area" className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">District *</label>
                    <select className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition appearance-none">
                      <option>Dhaka</option>
                      <option>Chittagong</option>
                      <option>Sylhet</option>
                      <option>Rajshahi</option>
                      <option>Khulna</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-wider mb-2">City / Area *</label>
                    <input type="text" placeholder="e.g. Gulshan" className="w-full border border-[var(--brand-border)] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] focus:ring-1 focus:ring-[var(--brand-maroon)] transition" required />
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div>
                <h2 className="font-display text-2xl mb-6">Payment Method</h2>
                <div className="space-y-3">
                  
                  <label className={`flex items-center justify-between border p-4 cursor-pointer transition ${paymentMethod === 'bkash' ? 'border-[var(--brand-maroon)] bg-[var(--brand-maroon)]/5' : 'border-[var(--brand-border)] hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'bkash'} onChange={() => setPaymentMethod('bkash')} className="accent-[var(--brand-maroon)] w-4 h-4" />
                      <span className="font-bold text-sm">bKash</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-muted)]">Pay securely via bKash</span>
                  </label>

                  <label className={`flex items-center justify-between border p-4 cursor-pointer transition ${paymentMethod === 'card' ? 'border-[var(--brand-maroon)] bg-[var(--brand-maroon)]/5' : 'border-[var(--brand-border)] hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-[var(--brand-maroon)] w-4 h-4" />
                      <span className="font-bold text-sm">Credit / Debit Card</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-muted)]">Visa, Mastercard, Amex</span>
                  </label>

                  <label className={`flex items-center justify-between border p-4 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-[var(--brand-maroon)] bg-[var(--brand-maroon)]/5' : 'border-[var(--brand-border)] hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-[var(--brand-maroon)] w-4 h-4" />
                      <span className="font-bold text-sm">Cash on Delivery</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-muted)]">Pay when it arrives</span>
                  </label>

                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[var(--brand-border)]">
                <button type="submit" className="w-full bg-[var(--brand-maroon)] text-white text-sm font-bold uppercase tracking-wider py-4 hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-lg">
                  Complete Order &rarr;
                </button>
                <p className="text-[10px] text-center text-[var(--brand-muted)] mt-4 font-medium">By placing this order, you agree to our Terms & Conditions and Privacy Policy.</p>
              </div>

            </form>
          </div>

          {/* ============ RIGHT: REDESIGNED ORDER SUMMARY ============ */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="sticky top-28 bg-white border border-[var(--brand-border)] shadow-xl overflow-hidden">
              
              {/* Card Header */}
              <div className="bg-[var(--brand-maroon)] p-6 text-white">
                <h2 className="font-display text-2xl">Order Summary</h2>
                <p className="text-white/70 text-xs mt-1">Review your items before placing the order.</p>
              </div>

              <div className="p-6 md:p-8">
                {/* Items List */}
                <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="relative w-20 h-24 shrink-0 bg-[var(--brand-surface)] border border-[var(--brand-border)] overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-base font-bold text-[var(--brand-text)] leading-tight">{item.name}</h3>
                        <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-wider mt-1">{item.color}</p>
                        <p className="text-xs text-[var(--brand-muted)] mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold text-[var(--brand-text)]">
                        ৳ {(item.price * item.quantity).toLocaleString('en-US')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="flex gap-2 mb-8 border-t border-[var(--brand-border)] pt-6">
                  <input type="text" placeholder="Discount code" className="flex-1 border border-[var(--brand-border)] bg-[var(--brand-cream)]/50 px-4 py-2 text-xs outline-none focus:border-[var(--brand-maroon)] transition" />
                  <button className="border border-[var(--brand-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--brand-text)] hover:text-white transition">Apply</button>
                </div>

                {/* Totals */}
                <div className="space-y-3 text-sm border-b border-[var(--brand-border)] pb-6 mb-6">
                  <div className="flex justify-between text-[var(--brand-muted)]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[var(--brand-text)]">৳ {subtotal.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between text-[var(--brand-muted)]">
                    <span>Delivery</span>
                    <span className="font-medium text-[var(--brand-text)]">৳ {delivery.toLocaleString('en-US')}</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-base font-bold text-[var(--brand-text)] uppercase tracking-wider">Total</span>
                  <div className="text-right">
                    <span className="text-[10px] text-[var(--brand-muted)] block mb-1">Including VAT</span>
                    <span className="text-3xl font-bold text-[var(--brand-maroon)]">৳ {total.toLocaleString('en-US')}</span>
                  </div>
                </div>

                {/* Trust Signals */}
                <div className="bg-[var(--brand-cream)]/50 p-4 border border-[var(--brand-border)] space-y-3">
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-text)] font-medium">
                    <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>100% Secure SSL Checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--brand-text)] font-medium">
                    <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    <span>5-Year Structural Warranty</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}