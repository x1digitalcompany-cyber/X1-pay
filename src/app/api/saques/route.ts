import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const sellerId = searchParams.get('sellerId')

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
      ...(sellerId ? { sellerId } : {}),
    },
    include: { seller: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(withdrawals)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { sellerId, amount, notes } = await req.json()
  if (!sellerId || !amount) {
    return NextResponse.json({ error: 'Vendedor e valor obrigatórios' }, { status: 400 })
  }

  const seller = await prisma.seller.findFirst({
    where: { id: sellerId, userId },
    include: { orders: { where: { status: { in: ['PAID', 'CONFIRMED'] } } } },
  })
  if (!seller) return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 })

  const commissionEarned = seller.orders.reduce(
    (sum, o) => sum + o.value * (seller.commission / 100),
    0
  )
  const existingWithdrawals = await prisma.withdrawal.aggregate({
    where: { sellerId, userId, status: { in: ['PENDING', 'PAID'] } },
    _sum: { amount: true },
  })
  const totalWithdrawn = existingWithdrawals._sum.amount ?? 0
  const available = parseFloat((commissionEarned - totalWithdrawn).toFixed(2))

  if (Number(amount) > available) {
    return NextResponse.json(
      { error: `Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}` },
      { status: 400 }
    )
  }

  const withdrawal = await prisma.withdrawal.create({
    data: { userId, sellerId, amount: Number(amount), notes },
    include: { seller: true },
  })

  return NextResponse.json(withdrawal, { status: 201 })
}
