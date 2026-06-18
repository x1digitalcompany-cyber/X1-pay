import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const product = await prisma.product.findFirst({
    where: { id: params.id, userId },
    include: { checkouts: true },
  })

  if (!product) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, description, category, type, unitCost, logisticsId, imageUrl, isActive, checkouts } = body

  const product = await prisma.product.updateMany({
    where: { id: params.id, userId },
    data: { name, description, category, type, unitCost, logisticsId, imageUrl, isActive },
  })

  if (checkouts?.length) {
    for (const checkout of checkouts) {
      if (checkout.id) {
        await prisma.checkout.update({
          where: { id: checkout.id },
          data: {
            name: checkout.name,
            price: checkout.price,
            isActive: checkout.isActive,
            ...(checkout.slug ? { slug: checkout.slug } : {}),
          },
        })
      } else {
        const slug = generateSlug(checkout.name)
        await prisma.checkout.create({
          data: {
            productId: params.id,
            name: checkout.name,
            slug: `${slug}-${Date.now()}`,
            price: checkout.price,
          },
        })
      }
    }
  }

  const updated = await prisma.product.findFirst({
    where: { id: params.id },
    include: { checkouts: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.product.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ success: true })
}
