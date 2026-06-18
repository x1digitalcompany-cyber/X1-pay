import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { send123LogOrder } from '@/lib/logistica'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId },
    include: { seller: true, checkout: { include: { product: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { status, trackingCode, trackingUrl, sellerId } = body

  const updateData: Record<string, unknown> = {}
  if (status) {
    updateData.status = status
    if (status === 'PAID' || status === 'CONFIRMED') {
      updateData.paidAt = new Date()
    }
  }
  if (trackingCode !== undefined) updateData.trackingCode = trackingCode
  if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl
  if (sellerId !== undefined) updateData.sellerId = sellerId

  const order = await prisma.order.updateMany({
    where: { id: params.id, userId },
    data: updateData,
  })

  if (status === 'PAID' || status === 'CONFIRMED') {
    const fullOrder = await prisma.order.findFirst({
      where: { id: params.id },
      include: { checkout: { include: { product: true } } },
    })
    const settings = await prisma.settings.findUnique({ where: { userId } })

    if (
      fullOrder &&
      settings?.logisticsEnabled &&
      settings.logisticsApiUrl &&
      settings.logisticsApiKey &&
      settings.logisticsOrigin &&
      fullOrder.zipCode
    ) {
      try {
        await send123LogOrder({
          apiUrl: settings.logisticsApiUrl,
          apiKey: settings.logisticsApiKey,
          origin: settings.logisticsOrigin,
          order: {
            externalId: fullOrder.id,
            customerName: fullOrder.customerName,
            customerPhone: fullOrder.customerPhone || undefined,
            customerEmail: fullOrder.customerEmail || undefined,
            cpf: fullOrder.customerCpf || undefined,
            zipCode: fullOrder.zipCode,
            street: fullOrder.street || '',
            number: fullOrder.number || '',
            complement: fullOrder.complement || undefined,
            neighborhood: fullOrder.neighborhood || '',
            city: fullOrder.city || '',
            state: fullOrder.state || '',
            productName: fullOrder.offerName,
            productCode: fullOrder.checkout?.product?.logisticsId || undefined,
            quantity: 1,
            value: fullOrder.value,
          },
        })
      } catch (e) {
        console.error('Erro logística:', e)
      }
    }
  }

  const updated = await prisma.order.findFirst({
    where: { id: params.id },
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

  await prisma.order.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ success: true })
}
