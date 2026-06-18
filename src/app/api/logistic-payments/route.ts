import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const payments = await prisma.logisticPayment.findMany({
    where: { userId },
    include: {
      order: {
        select: { id: true, customerName: true, offerName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { orderId, amount, paidAt, notes } = await req.json()
  if (!orderId || amount === undefined) {
    return NextResponse.json({ error: 'Pedido e valor obrigatórios' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, userId } })
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const payment = await prisma.logisticPayment.create({
    data: {
      userId,
      orderId,
      amount: Number(amount),
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes,
    },
    include: { order: { select: { id: true, customerName: true, offerName: true } } },
  })

  return NextResponse.json(payment, { status: 201 })
}
