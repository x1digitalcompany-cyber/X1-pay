import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json()
    const orderId = body.pedido_externo || body.externalId || body.orderId

    if (!orderId) {
      return NextResponse.json({ error: 'Pedido não informado' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: order.userId },
    })

    if (settings?.logisticsPostbackKey && settings.logisticsPostbackKey !== params.token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const trackingCode = body.codigo_rastreio || body.trackingCode
    const trackingUrl = body.url_rastreio || body.trackingUrl

    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingCode,
        trackingUrl,
        status: order.status === 'PAID' ? 'CONFIRMED' : order.status,
      },
    })

    if (settings?.luminarTrackUrl) {
      await fetch(settings.luminarTrackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          tracking_code: trackingCode,
          tracking_url: trackingUrl,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook Payt:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
