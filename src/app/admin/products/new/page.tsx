import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { addProduct } from "../actions";

export default async function NewProductPage() {
  // Fetch categories to populate the dropdown
  const categories = await prisma.category.findMany();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-gray-400 hover:text-[var(--brand-maroon)] transition">
          &larr; Back
        </Link>
        <h2 className="text-2xl font-display font-bold text-gray-900">Add New Product</h2>
      </div>

      {/* Form */}
      <form action={addProduct} className="bg-white border border-gray-200 shadow-sm p-8 space-y-6">
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Product Name *</label>
          <input type="text" name="name" required placeholder="e.g. Modern Teak Sofa" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
          <select name="categoryId" required className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] bg-white transition">
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-red-500 mt-1">You must create a category first.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
          <textarea name="description" rows={4} placeholder="Describe the materials, design, and craftsmanship..." className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition resize-none"></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Price (BDT) *</label>
            <input type="number" name="price" step="0.01" required placeholder="e.g. 45000" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition" />
            <p className="text-[10px] text-gray-500 mt-1">System will automatically convert to Poisha.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock *</label>
            <input type="number" name="stock" required placeholder="e.g. 10" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Product Images (Select Multiple)</label>
          <input 
            type="file" 
            name="images" 
            accept="image/*" 
            multiple
            required
            className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-[var(--brand-maroon)] transition file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand-maroon)] file:text-white hover:file:bg-[var(--brand-maroon-dark)] file:cursor-pointer" 
          />
          <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple angles (Front, Side, Detail, Lifestyle).</p>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button type="submit" className="bg-[var(--brand-maroon)] text-white px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-sm">
            Save Product
          </button>
        </div>

      </form>
    </div>
  );
}
