import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addProduct } from "../actions";

export default async function NewProductPage() {
  const session = await auth();
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!actorId) redirect("/login");

  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { role: true, isActive: true },
  });
  if (!actor?.isActive || actor.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="text-sm text-gray-600 hover:underline">
          Back to products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Product Draft</h1>
      </div>

      <div role="note" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
        Staging safety mode: this form creates unpublished product drafts only.
        Image uploads, stock entries and publication are disabled until approved
        private-media, inventory and maker/checker workflows are implemented.
      </div>

      <form action={addProduct} className="space-y-5 border border-gray-200 bg-white p-6">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold">Product name *</label>
          <input id="name" name="name" type="text" maxLength={160} required
            className="w-full border border-gray-300 p-3" placeholder="e.g. Signature Luxury Bed" />
        </div>
        <div>
          <label htmlFor="sku" className="mb-2 block text-sm font-semibold">Approved SKU *</label>
          <input id="sku" name="sku" type="text" maxLength={64} required
            pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
            className="w-full border border-gray-300 p-3" placeholder="AFS-BD-042" />
          <p className="mt-1 text-xs text-gray-600">
            The SKU is entered from the approved asset manifest; never auto-generated.
          </p>
        </div>
        <div>
          <label htmlFor="categoryId" className="mb-2 block text-sm font-semibold">Category *</label>
          <select id="categoryId" name="categoryId" required className="w-full border border-gray-300 bg-white p-3">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-semibold">Description</label>
          <textarea id="description" name="description" maxLength={4000} rows={5}
            className="w-full border border-gray-300 p-3" />
        </div>
        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-semibold">Approved price (BDT) *</label>
          <input id="price" name="price" type="text" inputMode="decimal"
            pattern="[0-9]+([.][0-9]{1,2})?" required className="w-full border border-gray-300 p-3"
            placeholder="45000.00" />
          <p className="mt-1 text-xs text-gray-600">The server converts decimal BDT to integer poisha exactly.</p>
        </div>
        <div className="flex justify-end border-t border-gray-200 pt-5">
          <button type="submit" disabled={categories.length === 0}
            className="bg-[#6b1020] px-6 py-3 font-semibold text-white disabled:opacity-50">
            Save unpublished draft
          </button>
        </div>
      </form>
    </div>
  );
}
