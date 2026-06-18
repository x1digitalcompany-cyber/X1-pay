import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const employees = await prisma.employee.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const employee = await prisma.employee.create({
    data: { userId, name, email, password: hash },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(employee, { status: 201 })
}
