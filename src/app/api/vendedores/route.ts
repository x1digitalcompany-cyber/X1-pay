import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sellers = await prisma.seller.findMany({
    where: { userId },
    include: {
      orders: {
        where: { status: { in: ['PAID', 'CONFIRMED'] } },
      },
    },
    orderBy: { name: 'asc' },
  })

  const ranking = sellers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    commissionRate: s.commission,
    isActive: s.isActive,
    totalSales: s.orders.reduce((sum, o) => sum + o.value, 0),
    orderCount: s.orders.length,
    commissionEarned: s.orders.reduce((sum, o) => sum + o.value * (s.commission / 100), 0),
  })).sort((a, b) => b.totalSales - a.totalSales)

  return NextResponse.json(ranking)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const seller = await prisma.seller.create({
    data: {
      userId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      commission: body.commission || 0,
      isActive: body.isActive ?? true,
    },
  })

  return NextResponse.json(seller, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body

  await prisma.seller.updateMany({
    where: { id, userId },
    data,
  })

  const seller = await prisma.seller.findFirst({ where: { id } })
  return NextResponse.json(seller)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.seller.deleteMany({ where: { id, userId } })
  return NextResponse.json({ success: true })
}
