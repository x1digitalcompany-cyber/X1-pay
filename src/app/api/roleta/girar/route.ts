import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function pickPrize<T extends { probability: number; id: string }>(prizes: T[]): T {
  const total = prizes.reduce((s, p) => s + p.probability, 0)
  let r = Math.random() * total
  for (const p of prizes) {
    r -= p.probability
    if (r <= 0) return p
  }
  return prizes[prizes.length - 1]
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { sellerId } = await req.json()
  if (!sellerId) return NextResponse.json({ error: 'Vendedor obrigatório' }, { status: 400 })

  const seller = await prisma.seller.findFirst({ where: { id: sellerId, userId } })
  if (!seller) return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 })

  const prizes = await prisma.spinPrize.findMany({ where: { userId, isActive: true } })
  if (prizes.length === 0) {
    return NextResponse.json({ error: 'Nenhum prêmio configurado' }, { status: 400 })
  }

  const prize = pickPrize(prizes)
  const result = await prisma.spinResult.create({
    data: { userId, sellerId, prizeId: prize.id },
    include: { prize: true, seller: true },
  })

  return NextResponse.json({ prize, result })
}
