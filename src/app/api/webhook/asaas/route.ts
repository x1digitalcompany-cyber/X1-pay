import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mapAsaasStatus } from '@/lib/asaas'
import { sendPushToUser } from '@/lib/push'
import { dispatchWebhook } from '@/lib/webhook'
import { dispatchLogisticsIfEnabled } from '@/lib/logistica'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Asaas sends payment data inside body.payment
    const payment = body.payment
    if (!payment?.id) {
      return NextResponse.json({ received: true })
    }

    const order = await prisma.order.findFirst({
      where: { gatewayId: payment.id },
    })

    if (!order) {
      return NextResponse.json({ received: true })
    }

    // Validate webhook token against stored Asaas key
    const settings = await prisma.settings.findUnique({ where: { userId: order.userId } })
    const incomingToken = req.headers.get('asaas-access-token') ?? req.headers.get('access_token')
    if (settings?.asaasApiKey && incomingToken && incomingToken !== settings.asaasApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventType: string = body.event ?? ''
    const newStatus = resolveStatus(eventType, payment.status)

    if (!newStatus || newStatus === order.status) {
      return NextResponse.json({ received: true })
    }

    const updateData: Record<string, unknown> = { status: newStatus, gatewayStatus: payment.status }

    if (newStatus === 'PAID') updateData.paidAt = new Date()

    await prisma.order.update({ where: { id: order.id }, data: updateData })

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
    console.error('Webhook Asaas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function resolveStatus(event: string, paymentStatus: string): string | null {
  // Prefer event type; fall back to payment status field
  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
      return 'PAID'
    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_REFUND_IN_PROGRESS':
      return 'REFUNDED'
    case 'PAYMENT_CHARGEBACK_REQUESTED':
    case 'PAYMENT_CHARGEBACK_DISPUTE':
    case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
      return 'CHARGEBACK'
    case 'PAYMENT_DELETED':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_ANTICIPATED':
      break
  }
  // Fallback: map raw payment status
  const mapped = mapAsaasStatus(paymentStatus)
  return mapped !== 'WAITING_PAYMENT' ? mapped : null
}
