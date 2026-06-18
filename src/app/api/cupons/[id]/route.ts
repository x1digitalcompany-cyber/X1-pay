import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { code, type, value, minOrderValue, maxUses, expiresAt, isActive } = body

  const updateData: Record<string, unknown> = {}
  if (code !== undefined) updateData.code = code.toUpperCase().trim()
  if (type !== undefined) updateData.type = type
  if (value !== undefined) updateData.value = Number(value)
  if (minOrderValue !== undefined) updateData.minOrderValue = Number(minOrderValue)
  if (maxUses !== undefined) updateData.maxUses = maxUses ? Number(maxUses) : null
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
  if (isActive !== undefined) updateData.isActive = isActive

  await prisma.coupon.updateMany({
    where: { id: params.id, userId },
    data: updateData,
  })

  const updated = await prisma.coupon.findFirst({ where: { id: params.id } })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.coupon.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ success: true })
}
