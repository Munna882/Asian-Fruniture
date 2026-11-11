"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * G0-safe staging path: create unpublished catalogue drafts only.
 * Public media uploads and stock-opening transactions are intentionally blocked
 * until the approved private-media service and inventory workflows exist.
 * Never enable either by adding local filesystem writes to this action.
 */
function requiredText(value: FormDataEntryValue | null, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const result = value.trim();
  if (!result || result.length > maxLength) throw new Error(`Invalid ${field}`);
  return result;
}

function parsePoisha(value: FormDataEntryValue | null): bigint {
  if (typeof value !== "string") throw new Error("Price is required");
  const price = value.trim();
  // Exact decimal-to-integer conversion; never use floating-point for money.
  if (!/^(?:0|[1-9][0-9]{0,8})(?:[.][0-9]{1,2})?$/.test(price)) {
    throw new Error("Enter a valid BDT price with at most two decimal places");
  }
  const [whole, fractional = ""] = price.split(".");
  const amount = BigInt(whole) * 100n + BigInt(fractional.padEnd(2, "0"));
  if (amount <= 0n) throw new Error("Price must be greater than zero");
  return amount;
}

export async function addProduct(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Authentication required");

  // Auth is enforced on the server action itself, not only in middleware/layout.
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  // Temporary least-privilege policy until a dedicated Product Editor permission
  // and its independent publication approver are implemented and reviewed.
  if (!actor?.isActive || actor.role !== "SUPER_ADMIN") {
    throw new Error("Not authorized to create product drafts");
  }

  // The old action wrote arbitrary files directly into public/uploads, exposing
  // unapproved media. Fail closed until the private storage workflow is approved.
  if (formData.has("images")) {
    throw new Error("Direct media upload is disabled until secure private storage is approved");
  }
  if (formData.has("stock")) {
    throw new Error("Opening stock must use an authorized location inventory workflow");
  }

  const name = requiredText(formData.get("name"), "product name", 160);
  const categoryId = requiredText(formData.get("categoryId"), "category", 80);
  const sku = requiredText(formData.get("sku"), "SKU", 64).toUpperCase();
  const rawDescription = formData.get("description");
  if (rawDescription !== null && typeof rawDescription !== "string") {
    throw new Error("Invalid description");
  }
  const description = (rawDescription ?? "").trim();
  if (description.length > 4000) throw new Error("Description is too long");
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(sku)) {
    throw new Error("SKU must contain letters, numbers and hyphens only");
  }
  const price = parsePoisha(formData.get("price"));

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new Error("Unknown category");

  await prisma.product.create({
    data: {
      name,
      description: description || null,
      categoryId: category.id,
      status: "DRAFT",
      variants: { create: [{ sku, price, stock: 0 }] },
    },
  });

  revalidatePath("/admin/products");
  // Drafts are never published or visible on public catalogue routes.
  redirect("/admin/products");
}
