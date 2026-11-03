"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("categoryId") as string;
  const priceBdt = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  
  // Get multiple images
  const imageFiles = formData.getAll("images") as File[];

  if (!name || !categoryId || isNaN(priceBdt) || isNaN(stock)) {
    throw new Error("Missing required fields");
  }

  const pricePoisha = BigInt(Math.round(priceBdt * 100));
  const sku = name.toUpperCase().replace(/[^A-Z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

  const uploadedUrls: string[] = [];

  // NOTE: In the Phase 3 backend rewrite, this must move to S3/R2 storage.
  // For now, we fix the Prisma client leak. 
  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + '-' + file.name.replace(/\s/g, '-');
      const uploadDir = path.join(process.cwd(), "public/uploads");
      
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
      
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${filename}`);
    }
  }

  // Use the singleton prisma client here
  await prisma.product.create({
    data: {
      name,
      description,
      categoryId,
      variants: {
        create: [
          { sku, price: pricePoisha, stock }
        ]
      },
      images: {
        create: uploadedUrls.map(url => ({ url }))
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop"); // Added this so the shop updates immediately
  redirect("/admin/products");
}
