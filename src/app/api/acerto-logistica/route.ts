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
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: Record<string, unknown> = {
    userId,
    status: { in: ['PAID', 'CONFIRMED'] },
  }

  if (from || to) {
    const paidAt: Record<string, Date> = {}
    if (from) paidAt.gte = startOfDay(new Date(from))
    if (to) paidAt.lte = endOfDay(new Date(to))
    where.paidAt = paidAt
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      checkout: {
        include: { product: true },
      },
      seller: true,
    },
    orderBy: { paidAt: 'desc' },
  })

  const rows = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    offerName: o.offerName,
    customerName: o.customerName,
    paymentMethod: o.paymentMethod,
    value: o.value,
    discountAmount: o.discountAmount,
    netValue: o.netValue,
    logisticsCost: o.checkout?.product?.unitCost ?? 0,
    trackingCode: o.trackingCode,
    sellerName: o.seller?.name ?? null,
    productName: o.checkout?.product?.name ?? null,
  }))

  const summary = {
    orderCount: rows.length,
    totalRevenue: rows.reduce((s, r) => s + r.value, 0),
    totalDiscount: rows.reduce((s, r) => s + r.discountAmount, 0),
    totalLogisticsCost: rows.reduce((s, r) => s + r.logisticsCost, 0),
    totalNet: rows.reduce((s, r) => s + r.netValue, 0),
    totalMargin: rows.reduce((s, r) => s + r.netValue - r.logisticsCost, 0),
  }

  return NextResponse.json({ orders: rows, summary })
}
