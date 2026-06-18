import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import { dispatchWebhook } from '@/lib/webhook'
import { dispatchLogisticsIfEnabled } from '@/lib/logistica'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-pagarme-signature') ?? ''
    const secret = process.env.PAGARME_WEBHOOK_SECRET ?? ''

    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      const sigBuf = Buffer.from(signature || '', 'utf8')
      const expBuf = Buffer.from(expected, 'utf8')
      // Reject if missing or length/content mismatch (timingSafeEqual requires equal-length buffers)
      const valid =
        signature.length > 0 &&
        sigBuf.length === expBuf.length &&
        crypto.timingSafeEqual(sigBuf, expBuf)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    const eventType: string = body.type ?? ''
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

    let newStatus = order.status

    if (
      eventType === 'order.paid' ||
      eventType === 'charge.paid' ||
      data.status === 'paid'
    ) {
      newStatus = 'PAID'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', gatewayStatus: 'paid', paidAt: new Date() },
      })
    } else if (eventType === 'charge.refunded' || data.status === 'refunded') {
      newStatus = 'REFUNDED'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED', gatewayStatus: 'refunded' },
      })
    } else if (
      eventType === 'charge.chargebacked' ||
      eventType === 'chargeback.received'
    ) {
      newStatus = 'CHARGEBACK'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CHARGEBACK', gatewayStatus: 'chargeback' },
      })
    } else if (eventType === 'charge.antifraud_approved') {
      newStatus = 'CONFIRMED'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED', gatewayStatus: 'confirmed' },
      })
    } else if (data.status === 'failed' || data.status === 'canceled') {
      newStatus = 'CANCELLED'
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', gatewayStatus: data.status },
      })
    }

    const updated = await prisma.order.findUnique({ where: { id: order.id } })
    if (!updated) return NextResponse.json({ received: true })

    if (newStatus === 'PAID') {
      await Promise.allSettled([
        sendPushToUser(order.userId, {
          title: '💰 Novo pedido pago!',
          body: `${updated.customerName} • R$ ${updated.value.toFixed(2)} (${updated.paymentMethod})`,
          url: `/admin/pedidos/${updated.id}`,
        }),
        dispatchWebhook(order.userId, 'order.paid', updated),
        dispatchLogisticsIfEnabled(order.id, order.userId),
      ])
    }
    if (newStatus === 'REFUNDED') {
      await dispatchWebhook(order.userId, 'order.refunded', updated)
    }
    if (newStatus === 'CHARGEBACK') {
      await dispatchWebhook(order.userId, 'order.chargeback', updated)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook Pagar.me:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
