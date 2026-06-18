import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventType = body.type
    const data = body.data

    if (!data?.id) {
      return NextResponse.json({ received: true })
    }

    const gatewayId = data.order?.id || data.id

    const order = await prisma.order.findFirst({
      where: { gatewayId },
    })

    if (!order) {
      return NextResponse.json({ received: true })
    }

    if (eventType === 'order.paid' || data.status === 'paid') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          gatewayStatus: 'paid',
          paidAt: new Date(),
        },
      })
    } else if (eventType === 'charge.refunded' || data.status === 'refunded') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED', gatewayStatus: 'refunded' },
      })
    } else if (data.status === 'failed' || data.status === 'canceled') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', gatewayStatus: data.status },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook Pagar.me:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
