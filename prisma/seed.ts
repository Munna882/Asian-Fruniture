import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@asianfurniture.com' },
    update: {},
    create: {
      email: 'admin@asianfurniture.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // 2. Create Categories
  const livingRoom = await prisma.category.upsert({
    where: { name: 'Living Room' },
    update: {},
    create: { name: 'Living Room' },
  });

  // 3. Create Product (Price in Poisha: 45,000 BDT = 4,500,000 Poisha)
  const sofa = await prisma.product.create({
    data: {
      name: 'Linden Sofa',
      description: 'A masterpiece of comfort and design.',
      categoryId: livingRoom.id,
      variants: {
        create: [
          { sku: 'SOFA-LIN-01', price: BigInt(4500000), stock: 10 },
          { sku: 'SOFA-LIN-02', price: BigInt(4800000), stock: 5 }
        ]
      }
    }
  });

  console.log('Seed completed successfully!', { admin, sofa });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });