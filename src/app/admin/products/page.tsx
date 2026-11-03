import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminProductsPage() {
  // Fetch products from the database, including their category and variants
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      
      {/* Header section with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Catalogue</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your furniture products, prices, and inventory.</p>
        </div>
        <button className="bg-[var(--brand-maroon)] text-white px-6 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-[var(--brand-maroon-dark)] transition-colors shadow-sm">
          + Add New Product
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No products found. Click "Add New Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  // Assuming a product has at least one variant (base price)
                  const baseVariant = product.variants[0];
                  // Convert BigInt poisha to BDT
                  const priceBdt = baseVariant ? (Number(baseVariant.price) / 100).toLocaleString('en-US') : 'N/A';
                  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded-sm text-xs font-medium">
                          {product.category.name}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 font-mono">{baseVariant?.sku || 'N/A'}</td>
                      <td className="p-4 text-sm font-semibold text-[var(--brand-maroon)]">
                        ৳ {priceBdt}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-bold uppercase ${
                          totalStock > 5 ? 'text-green-700 bg-green-50' :
                          totalStock > 0 ? 'text-yellow-700 bg-yellow-50' :
                          'text-red-700 bg-red-50'
                        }`}>
                          {totalStock} in stock
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-[var(--brand-maroon)] transition-colors mr-4">Edit</button>
                        <button className="text-gray-400 hover:text-red-600 transition-colors">Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}