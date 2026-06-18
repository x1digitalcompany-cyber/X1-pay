import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const coupons = await prisma.coupon.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { code, type, value, minOrderValue, maxUses, expiresAt } = body

  if (!code || !value) {
    return NextResponse.json({ error: 'Código e valor são obrigatórios' }, { status: 400 })
  }

  const existing = await prisma.coupon.findUnique({
    where: { userId_code: { userId, code: code.toUpperCase() } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Código já existe' }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      userId,
      code: code.toUpperCase().trim(),
      type: type || 'PERCENTAGE',
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json(coupon, { status: 201 })
}
