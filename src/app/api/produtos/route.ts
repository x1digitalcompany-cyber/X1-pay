import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const products = await prisma.product.findMany({
    where: { userId },
    include: { checkouts: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, description, category, type, unitCost, logisticsId, imageUrl, checkoutName, price } = body

  const slug = generateSlug(checkoutName || name)
  const existingSlug = await prisma.checkout.findUnique({ where: { slug } })
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

  const product = await prisma.product.create({
    data: {
      userId,
      name,
      description,
      category,
      type: type || 'Cápsula',
      unitCost: unitCost || 0,
      logisticsId,
      imageUrl,
      checkouts: {
        create: {
          name: checkoutName || name,
          slug: finalSlug,
          price: price || 0,
        },
      },
    },
    include: { checkouts: true },
  })

  return NextResponse.json(product, { status: 201 })
}
