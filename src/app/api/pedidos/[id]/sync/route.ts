import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPagarmeClient } from '@/lib/pagarme'

const STATUS_MAP: Record<string, string> = {
  paid: 'PAID',
  pending: 'WAITING_PAYMENT',
  processing: 'WAITING_PAYMENT',
  waiting_payment: 'WAITING_PAYMENT',
  canceled: 'CANCELLED',
  failed: 'CANCELLED',
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId },
  })

  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  if (!order.gatewayId) return NextResponse.json({ error: 'Pedido sem ID de gateway' }, { status: 400 })

  const settings = await prisma.settings.findUnique({ where: { userId } })
  const secretKey = settings?.pagarmeSecretKey || process.env.PAGARME_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json({ error: 'Gateway não configurado' }, { status: 400 })
  }

  try {
    const client = getPagarmeClient(secretKey)
    const res = await client.get(`/orders/${order.gatewayId}`)
    const pagarmeOrder = res.data

    const charge = pagarmeOrder.charges?.[0]
    const chargeStatus: string = charge?.status ?? ''
    const lastTransaction = charge?.last_transaction

    const newStatus = STATUS_MAP[chargeStatus] ?? order.status

    const updateData: Record<string, unknown> = {
      gatewayStatus: chargeStatus,
    }

    if (newStatus !== order.status) {
      updateData.status = newStatus
      if (newStatus === 'PAID' && !order.paidAt) {
        updateData.paidAt = new Date()
      }
    }

    if (order.paymentMethod === 'PIX' && lastTransaction) {
      updateData.pixCode = lastTransaction.qr_code || order.pixCode
      updateData.pixQrCode = lastTransaction.qr_code_url || order.pixQrCode
    }

    if (order.paymentMethod === 'BOLETO' && lastTransaction) {
      const t = lastTransaction as Record<string, string>
      updateData.boletoUrl = t.url || t.pdf || order.boletoUrl
      updateData.boletoBarCode = t.line || t.boleto_barcode || order.boletoBarCode
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    const updated = await prisma.order.findFirst({
      where: { id: order.id },
      include: { seller: true, checkout: { include: { product: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Sync] Erro ao sincronizar com gateway:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar com gateway' }, { status: 500 })
  }
}
