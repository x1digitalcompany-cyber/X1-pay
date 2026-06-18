import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      paidAt: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  return NextResponse.json(order)
}
