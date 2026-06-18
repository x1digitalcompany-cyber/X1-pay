import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@x1pay.com' },
    update: {},
    create: {
      email: 'admin@x1pay.com',
      password,
      name: 'Administrador',
      role: 'ADMIN',
      brandName: 'X1 Pay',
      settings: { create: {} },
    },
  })

  const product = await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: {
      id: 'seed-product-1',
      userId: user.id,
      name: 'Produto Exemplo',
      description: 'Produto de demonstração',
      category: 'Suplementos',
      type: 'Cápsula',
      unitCost: 25,
      isActive: true,
      checkouts: {
        create: {
          name: 'Oferta Principal',
          slug: 'produto-exemplo',
          price: 197,
          isActive: true,
        },
      },
    },
    include: { checkouts: true },
  })

  await prisma.seller.upsert({
    where: { id: 'seed-seller-1' },
    update: {},
    create: {
      id: 'seed-seller-1',
      userId: user.id,
      name: 'Vendedor Demo',
      email: 'vendedor@x1pay.com',
      phone: '11999999999',
      commission: 10,
      isActive: true,
    },
  })

  console.log('Seed concluído!')
  console.log('Login: admin@x1pay.com / admin123')
  console.log('Checkout: /checkout/produto-exemplo')
  console.log('Produto:', product.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
