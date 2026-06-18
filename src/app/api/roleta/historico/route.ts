import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const page = Number(new URL(req.url).searchParams.get('page') || 1)
  const limit = Number(new URL(req.url).searchParams.get('limit') || 20)
  const skip = (page - 1) * limit

  const [results, total] = await Promise.all([
    prisma.spinResult.findMany({
      where: { userId },
      include: { seller: true, prize: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.spinResult.count({ where: { userId } }),
  ])

  return NextResponse.json({ results, total, page, limit })
}
