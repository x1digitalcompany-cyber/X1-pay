import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

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

  const where: Record<string, unknown> = { userId }

  if (status) {
    const statuses = status.split(',').filter(Boolean)
    if (statuses.length) where.status = { in: statuses }
  }
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (sellerId) where.sellerId = sellerId
  if (from || to) {
    const createdAt: Record<string, Date> = {}
    if (from) createdAt.gte = startOfDay(new Date(from))
    if (to) createdAt.lte = endOfDay(new Date(to))
    where.createdAt = createdAt
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
      { customerPhone: { contains: search } },
      { offerName: { contains: search } },
    ]
  }
  if (minValue || maxValue) {
    const value: Record<string, number> = {}
    if (minValue) value.gte = Number(minValue)
    if (maxValue) value.lte = Number(maxValue)
    where.value = value
  }

  const orders = await prisma.order.findMany({
    where,
    include: { seller: true, checkout: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
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
