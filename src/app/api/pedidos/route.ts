import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const paymentMethod = searchParams.get('paymentMethod')
  const sellerId = searchParams.get('sellerId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')
  const minValue = searchParams.get('minValue')
  const maxValue = searchParams.get('maxValue')
  const tracking = searchParams.get('tracking') // 'with' | 'without'
  const src = searchParams.get('src')
  const dateField = searchParams.get('dateField') || 'createdAt'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const andConditions: Record<string, unknown>[] = [{ userId }]

  if (status) {
    const statuses = status.split(',').filter(Boolean)
    if (statuses.length) andConditions.push({ status: { in: statuses } })
  }
  if (paymentMethod) andConditions.push({ paymentMethod })
  if (sellerId) andConditions.push({ sellerId })

  if (from || to) {
    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = startOfDay(new Date(from))
    if (to) dateFilter.lte = endOfDay(new Date(to))
    andConditions.push({ [dateField === 'paidAt' ? 'paidAt' : 'createdAt']: dateFilter })
  }

  if (search) {
    andConditions.push({
      OR: [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
        { offerName: { contains: search } },
      ],
    })
  }

  if (minValue || maxValue) {
    const value: Record<string, number> = {}
    if (minValue) value.gte = Number(minValue)
    if (maxValue) value.lte = Number(maxValue)
    andConditions.push({ value })
  }

  if (tracking === 'with') andConditions.push({ trackingCode: { not: null } })
  if (tracking === 'without') andConditions.push({ trackingCode: null })

  if (src) {
    const matchingSellers = await prisma.seller.findMany({
      where: { userId, name: { contains: src } },
      select: { id: true },
    })
    if (matchingSellers.length === 0) {
      return NextResponse.json({ orders: [], total: 0, page, pages: 0 })
    }
    andConditions.push({ sellerId: { in: matchingSellers.map((s) => s.id) } })
  }

  const where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { seller: true, checkout: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({
    orders,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const order = await prisma.order.create({
    data: {
      userId,
      offerName: body.offerName,
      value: body.value,
      status: body.status || 'PENDING',
      paymentMethod: body.paymentMethod || 'PIX',
      installments: body.installments || 1,
      netValue: body.netValue || 0,
      directPayment: body.directPayment || false,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerCpf: body.customerCpf,
      zipCode: body.zipCode,
      street: body.street,
      number: body.number,
      complement: body.complement,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      sellerId: body.sellerId,
      checkoutId: body.checkoutId,
      paidAt: body.status === 'PAID' ? new Date() : undefined,
    },
    include: { seller: true },
  })

  return NextResponse.json(order, { status: 201 })
}
