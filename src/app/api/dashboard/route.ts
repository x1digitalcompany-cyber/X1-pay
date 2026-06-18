import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [orders, settings, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.settings.findUnique({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { seller: true },
    }),
  ])

  const paidOrders = orders.filter((o) => ['PAID', 'CONFIRMED'].includes(o.status))
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.value, 0)
  const totalNet = paidOrders.reduce((sum, o) => sum + o.netValue, 0)
  const totalOrders = orders.length
  const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, 6 - i)
    const dayOrders = paidOrders.filter(
      (o) => format(new Date(o.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return {
      date: format(date, 'dd/MM'),
      revenue: dayOrders.reduce((s, o) => s + o.value, 0),
      orders: dayOrders.length,
    }
  })

  const byPayment = {
    PIX: paidOrders.filter((o) => o.paymentMethod === 'PIX').length,
    CARD: paidOrders.filter((o) => o.paymentMethod === 'CARD').length,
    BOLETO: paidOrders.filter((o) => o.paymentMethod === 'BOLETO').length,
  }

  return NextResponse.json({
    totalRevenue,
    totalNet,
    totalOrders,
    paidOrders: paidOrders.length,
    conversionRate,
    monthlyGoal: settings?.monthlyGoal ?? 0,
    chartData: last7Days,
    byPayment,
    recentOrders,
  })
}
