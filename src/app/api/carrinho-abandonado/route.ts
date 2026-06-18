import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { checkoutSlug, name, email, phone } = body

  if (!checkoutSlug || !name) {
    return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
  }

  const checkout = await prisma.checkout.findUnique({
    where: { slug: checkoutSlug },
    include: { product: true },
  })
  if (!checkout) return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })

  const userId = checkout.product.userId
  const emailKey = email || `no-email-${phone || Date.now()}`

  await prisma.abandonedCart.upsert({
    where: {
      userId_checkoutSlug_email: {
        userId,
        checkoutSlug,
        email: emailKey,
      },
    },
    create: { userId, checkoutSlug, name, email: emailKey, phone },
    update: { name, phone, updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = { userId }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  }

  if (from || to) {
    const updatedAt: Record<string, Date> = {}
    if (from) updatedAt.gte = startOfDay(new Date(from))
    if (to) updatedAt.lte = endOfDay(new Date(to))
    where.updatedAt = updatedAt
  }

  const carts = await prisma.abandonedCart.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })

  const withCheckout = await Promise.all(
    carts.map(async (cart) => {
      const checkout = await prisma.checkout.findUnique({
        where: { slug: cart.checkoutSlug },
        include: { product: true },
      })
      return {
        ...cart,
        checkoutName: checkout?.name,
        productName: checkout?.product.name,
      }
    })
  )

  return NextResponse.json(withCheckout)
}
