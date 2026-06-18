import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cart = await prisma.abandonedCart.findFirst({
    where: { id: params.id, userId },
  })

  if (!cart) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const checkout = await prisma.checkout.findUnique({
    where: { slug: cart.checkoutSlug },
    include: { product: true },
  })

  const orConditions: Record<string, unknown>[] = []
  if (cart.email && !cart.email.startsWith('no-email-')) {
    orConditions.push({ customerEmail: cart.email })
  }
  if (cart.phone) {
    orConditions.push({ customerPhone: cart.phone })
  }

  const convertedOrder = orConditions.length > 0
    ? await prisma.order.findFirst({
        where: { userId, OR: orConditions },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
    : null

  return NextResponse.json({
    ...cart,
    checkoutName: checkout?.name ?? null,
    productName: checkout?.product?.name ?? null,
    converted: !!convertedOrder,
    convertedOrderId: convertedOrder?.id ?? null,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.abandonedCart.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ success: true })
}
