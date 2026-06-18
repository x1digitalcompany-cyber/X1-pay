import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search } },
              { customerEmail: { contains: search } },
              { offerName: { contains: search } },
            ],
          }
        : {}),
    },
    include: { seller: true, checkout: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const settings = await prisma.settings.findUnique({ where: { userId } })

  const order = await prisma.order.create({
    data: {
      userId,
      offerName: body.offerName,
      value: body.value,
      status: body.status || 'PENDING',
      paymentMethod: body.paymentMethod || 'PIX',
      installments: body.installments || 1,
      netValue: body.netValue || 0,
      directPayment: body.directPayment || false,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerCpf: body.customerCpf,
      zipCode: body.zipCode,
      street: body.street,
      number: body.number,
      complement: body.complement,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      sellerId: body.sellerId,
      checkoutId: body.checkoutId,
      paidAt: body.status === 'PAID' ? new Date() : undefined,
    },
    include: { seller: true },
  })

  return NextResponse.json(order, { status: 201 })
}
