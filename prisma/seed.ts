import { PrismaClient, Role, ProductType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenestoque.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@greenestoque.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const operatorPassword = await bcrypt.hash('Operator@123', 10);
  await prisma.user.upsert({
    where: { email: 'operador@greenestoque.com' },
    update: {},
    create: {
      name: 'Operador Padrão',
      email: 'operador@greenestoque.com',
      password: operatorPassword,
      role: Role.OPERATOR,
    },
  });

  const residential = await prisma.category.upsert({
    where: { name: 'Residencial' },
    update: {},
    create: { name: 'Residencial', description: 'Painéis para uso residencial' },
  });

  const commercial = await prisma.category.upsert({
    where: { name: 'Comercial' },
    update: {},
    create: { name: 'Comercial', description: 'Painéis para uso comercial' },
  });

  const industrial = await prisma.category.upsert({
    where: { name: 'Industrial' },
    update: {},
    create: { name: 'Industrial', description: 'Painéis para uso industrial' },
  });

  await prisma.product.upsert({
    where: { code: 'CS-MONO-400W' },
    update: {},
    create: {
      code: 'CS-MONO-400W',
      name: 'Painel Solar Canadian Solar 400W',
      description: 'Painel solar monocristalino de alto desempenho 400W',
      brand: 'Canadian Solar',
      type: ProductType.MONOCRYSTALLINE,
      wattage: 400,
      categoryId: residential.id,
      price: 850.0,
      quantity: 50,
    },
  });

  await prisma.product.upsert({
    where: { code: 'JK-MONO-550W' },
    update: {},
    create: {
      code: 'JK-MONO-550W',
      name: 'Painel Solar Jinko Tiger 550W',
      description: 'Painel solar monocristalino bifacial de alta potência 550W',
      brand: 'Jinko Solar',
      type: ProductType.BIFACIAL,
      wattage: 550,
      categoryId: commercial.id,
      price: 1200.0,
      quantity: 30,
    },
  });

  await prisma.product.upsert({
    where: { code: 'LON-POLY-330W' },
    update: {},
    create: {
      code: 'LON-POLY-330W',
      name: 'Painel Solar Longi 330W Policristalino',
      description: 'Painel solar policristalino econômico 330W',
      brand: 'Longi Solar',
      type: ProductType.POLYCRYSTALLINE,
      wattage: 330,
      categoryId: residential.id,
      price: 620.0,
      quantity: 80,
    },
  });

  await prisma.product.upsert({
    where: { code: 'RISEN-BIFACIAL-600W' },
    update: {},
    create: {
      code: 'RISEN-BIFACIAL-600W',
      name: 'Painel Solar Risen Energy 600W Bifacial',
      description: 'Painel solar bifacial para uso industrial 600W',
      brand: 'Risen Energy',
      type: ProductType.BIFACIAL,
      wattage: 600,
      categoryId: industrial.id,
      price: 1500.0,
      quantity: 20,
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log(`👤 Admin: admin@greenestoque.com / Admin@123`);
  console.log(`👤 Operador: operador@greenestoque.com / Operator@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
