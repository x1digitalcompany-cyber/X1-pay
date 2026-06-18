import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name) data.name = body.name
  if (body.email) data.email = body.email
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.password) data.password = await bcrypt.hash(body.password, 10)

  const result = await prisma.employee.updateMany({
    where: { id: params.id, userId },
    data,
  })
  if (result.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(employee)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.employee.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ success: true })
}
