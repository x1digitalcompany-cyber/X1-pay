import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  })

  if (!user) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
    brandName: user.brandName,
    brandColor: user.brandColor,
    logoUrl: user.logoUrl,
    currency: user.currency,
    maxInstallments: user.maxInstallments,
    settings: user.settings,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { brandName, brandColor, logoUrl, currency, maxInstallments, settings } = body

  await prisma.user.update({
    where: { id: userId },
    data: { brandName, brandColor, logoUrl, currency, maxInstallments },
  })

  if (settings) {
    await prisma.settings.upsert({
      where: { userId },
      create: { userId, ...settings },
      update: settings,
    })
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  })

  return NextResponse.json(updated)
}

// PATCH usado pela "Meta de lucro" no topbar (atualiza somente settings.monthlyGoal)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const monthlyGoal = body?.settings?.monthlyGoal

  if (monthlyGoal === undefined) {
    return NextResponse.json({ error: 'monthlyGoal obrigatório' }, { status: 400 })
  }

  await prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      monthlyGoal: Number(monthlyGoal),
    },
    update: { monthlyGoal: Number(monthlyGoal) },
  })

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  })

  return NextResponse.json(updated)
}
