import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status, notes } = await req.json()
  const existing = await prisma.withdrawal.findFirst({
    where: { id: params.id, userId },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await prisma.withdrawal.update({
    where: { id: params.id },
    data: { status, notes },
    include: { seller: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const existing = await prisma.withdrawal.findFirst({
    where: { id: params.id, userId, status: 'PENDING' },
  })
  if (!existing) return NextResponse.json({ error: 'Não encontrado ou não pendente' }, { status: 404 })

  await prisma.withdrawal.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
