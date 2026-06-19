import { PrismaClient, ProductType, ItemStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@greenestoque.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@greenestoque.com',
      password: adminPassword,
    },
  });

  const userPassword = await bcrypt.hash('User@123', 10);
  await prisma.user.upsert({
    where: { email: 'usuario@greenestoque.com' },
    update: {},
    create: {
      name: 'Usuário Padrão',
      email: 'usuario@greenestoque.com',
      password: userPassword,
    },
  });

  // Categories removed from seed data

  // Seed Product 1
  const p1 = await prisma.product.create({
    data: {
      name: 'Painel Solar Canadian Solar 400W',
      description: 'Painel solar monocristalino de alto desempenho 400W',
      vendor: 'Canadian Solar',
      type: ProductType.SOLAR_PANEL,
      purchaseDate: new Date('2024-01-15T00:00:00.000Z'),
      cost: 850.0,
    },
  });

  // Seed Product 2
  const p2 = await prisma.product.create({
    data: {
      name: 'Painel Solar Jinko Tiger 550W',
      description: 'Painel solar monocristalino bifacial de alta potência 550W',
      vendor: 'Jinko Solar',
      type: ProductType.SOLAR_PANEL,
      purchaseDate: new Date('2024-01-20T00:00:00.000Z'),
      cost: 1200.0,
    },
  });

  // Seed Product 3
  const p3 = await prisma.product.create({
    data: {
      name: 'Painel Solar Longi 330W Policristalino',
      description: 'Painel solar policristalino econômico 330W',
      vendor: 'Longi Solar',
      type: ProductType.SOLAR_PANEL,
      purchaseDate: new Date('2024-01-25T00:00:00.000Z'),
      cost: 620.0,
    },
  });

  // Create some inventory movements for these products
  const products = [p1, p2, p3];
  for (const p of products) {
    const existingMovements = await prisma.inventoryMovement.count({
      where: { productId: p.id },
    });
    if (existingMovements === 0) {
      // Create 5 units in stock
      const inStockUnits = Array.from({ length: 5 }, () => ({
        productId: p.id,
        status: ItemStatus.EM_ESTOQUE,
        observations: 'Unidade inicial de semente',
      }));
      // Create 2 installed units
      const installedUnits = Array.from({ length: 2 }, () => ({
        productId: p.id,
        status: ItemStatus.INSTALADO,
        observations: 'Unidade instalada na semente',
      }));
      await prisma.inventoryMovement.createMany({
        data: [...inStockUnits, ...installedUnits],
      });
    }
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log(`👤 Usuário 1: admin@greenestoque.com / Admin@123`);
  console.log(`👤 Usuário 2: usuario@greenestoque.com / User@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
