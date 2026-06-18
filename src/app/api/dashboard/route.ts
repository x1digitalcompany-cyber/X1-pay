import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
  eachDayOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PAID_STATUSES = ['PAID', 'CONFIRMED']
const PENDING_STATUSES = ['PENDING', 'WAITING_PAYMENT']
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getPeriodRange(
  period: string | null,
  fromParam: string | null,
  toParam: string | null
): { start: Date; end: Date } {
  const now = new Date()
  if (period === 'today') {
    return { start: startOfDay(now), end: endOfDay(now) }
  }
  if (period === '7d') {
    return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) }
  }
  if (period === 'custom' && fromParam && toParam) {
    return {
      start: startOfDay(new Date(fromParam)),
      end: endOfDay(new Date(toParam)),
    }
  }
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '30d'
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const { start, end } = getPeriodRange(period, fromParam, toParam)
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [orders, settings, recentOrders, monthOrders] = await Promise.all([
    prisma.order.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
    }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { seller: true },
    }),
    prisma.order.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { in: PAID_STATUSES },
      },
    }),
  ])

  const paidOrders = orders.filter((o) => PAID_STATUSES.includes(o.status))
  const pendingOrders = orders.filter((o) => PENDING_STATUSES.includes(o.status))

  const grossRevenue = paidOrders.reduce((s, o) => s + o.value, 0)
  const netRevenue = paidOrders.reduce((s, o) => s + o.netValue, 0)
  const pendingRevenue = pendingOrders.reduce((s, o) => s + o.value, 0)
  const chargebacks = orders.filter((o) => o.status === 'CHARGEBACK').length
  const refunds = orders.filter((o) => o.status === 'REFUNDED').length
  const conversionRate =
    orders.length > 0 ? (paidOrders.length / orders.length) * 100 : 0

  const byPaymentMethod = {
    PIX: { count: 0, amount: 0, net: 0 },
    CARD: { count: 0, amount: 0, net: 0 },
    BOLETO: { count: 0, amount: 0, net: 0 },
  } as Record<string, { count: number; amount: number; net: number }>

  for (const o of paidOrders) {
    const key = o.paymentMethod
    if (byPaymentMethod[key]) {
      byPaymentMethod[key].count += 1
      byPaymentMethod[key].amount += o.value
      byPaymentMethod[key].net += o.netValue
    }
  }

  const days = eachDayOfInterval({ start, end })
  const salesByDay = days.map((date) => {
    const dayPaid = paidOrders.filter(
      (o) => format(new Date(o.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return {
      date: format(date, 'dd/MM'),
      gross: dayPaid.reduce((s, o) => s + o.value, 0),
      net: dayPaid.reduce((s, o) => s + o.netValue, 0),
      orders: dayPaid.length,
    }
  })

  const last90Start = startOfDay(subDays(now, 89))
  const last90Orders = await prisma.order.findMany({
    where: {
      userId,
      createdAt: { gte: last90Start, lte: endOfDay(now) },
      status: { in: PAID_STATUSES },
    },
  })

  const weekdayBuckets = Array.from({ length: 7 }, (_, i) => ({
    weekday: WEEKDAYS[i],
    gross: 0,
    orders: 0,
  }))

  for (const o of last90Orders) {
    const d = new Date(o.createdAt).getDay()
    weekdayBuckets[d].gross += o.value
    weekdayBuckets[d].orders += 1
  }

  const monthlyGoal = settings?.monthlyGoal ?? 0
  const monthlyNet = monthOrders.reduce((s, o) => s + o.netValue, 0)

  return NextResponse.json({
    grossRevenue,
    netRevenue,
    pendingRevenue,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    conversionRate,
    chargebacks,
    refunds,
    byPaymentMethod,
    salesByDay,
    salesByWeekday: weekdayBuckets,
    recentOrders,
    monthlyGoal,
    monthlyNet,
  })
}
