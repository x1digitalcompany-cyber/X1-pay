import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { checkoutSlug, name, email, phone, src } = body

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
    create: { userId, checkoutSlug, name, email: emailKey, phone, src: src || null },
    update: { name, phone, src: src || undefined, updatedAt: new Date() },
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

  // Batch checkout lookup
  const slugs = carts.map((c) => c.checkoutSlug).filter((s, i, a) => a.indexOf(s) === i)
  const checkouts = await prisma.checkout.findMany({
    where: { slug: { in: slugs } },
    include: { product: true },
  })
  const checkoutMap = new Map(checkouts.map((c) => [c.slug, c]))

  // Batch conversion check
  const emails = carts
    .filter((c) => c.email && !c.email.startsWith('no-email-'))
    .map((c) => c.email!)
  const phones = carts.filter((c) => c.phone).map((c) => c.phone!)

  const orConditions: Record<string, unknown>[] = []
  if (emails.length > 0) orConditions.push({ customerEmail: { in: emails } })
  if (phones.length > 0) orConditions.push({ customerPhone: { in: phones } })

  const convertedOrders = orConditions.length > 0
    ? await prisma.order.findMany({
        where: { userId, OR: orConditions },
        select: { customerEmail: true, customerPhone: true },
      })
    : []

  const convertedEmails = convertedOrders
    .map((o) => o.customerEmail)
    .filter((e): e is string => e != null)
  const convertedPhones = convertedOrders
    .map((o) => o.customerPhone)
    .filter((p): p is string => p != null)

  const result = carts.map((cart) => {
    const co = checkoutMap.get(cart.checkoutSlug)
    const isConverted =
      (cart.email && !cart.email.startsWith('no-email-') && convertedEmails.includes(cart.email)) ||
      (cart.phone && convertedPhones.includes(cart.phone))

    return {
      ...cart,
      checkoutName: co?.name ?? null,
      productName: co?.product?.name ?? null,
      converted: !!isConverted,
    }
  })

  return NextResponse.json(result)
}
