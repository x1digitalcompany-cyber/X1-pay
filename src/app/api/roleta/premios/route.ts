import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const prizes = await prisma.spinPrize.findMany({
    where: { userId },
    orderBy: { probability: 'desc' },
  })
  return NextResponse.json(prizes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { label, probability, color } = await req.json()
  const active = await prisma.spinPrize.findMany({ where: { userId, isActive: true } })
  const sum = active.reduce((s, p) => s + p.probability, 0) + Number(probability)
  if (sum > 100) {
    return NextResponse.json({ error: 'Soma das probabilidades ultrapassa 100%' }, { status: 400 })
  }

  const prize = await prisma.spinPrize.create({
    data: { userId, label, probability: Number(probability), color: color || '#7c3aed' },
  })
  return NextResponse.json(prize, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const body = await req.json()
  const prize = await prisma.spinPrize.updateMany({
    where: { id, userId },
    data: body,
  })
  if (prize.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await prisma.spinPrize.findUnique({ where: { id } })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  await prisma.spinPrize.deleteMany({ where: { id, userId } })
  return NextResponse.json({ success: true })
}
