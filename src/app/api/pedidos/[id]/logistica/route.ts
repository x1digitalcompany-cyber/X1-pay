import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { send123LogOrder } from '@/lib/logistica'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId },
    include: { checkout: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const settings = await prisma.settings.findUnique({ where: { userId } })
  if (!settings?.logisticsEnabled || !settings.logisticsApiUrl || !settings.logisticsApiKey || !settings.logisticsOrigin) {
    return NextResponse.json({ error: 'Logística não configurada' }, { status: 400 })
  }
  if (!order.zipCode) {
    return NextResponse.json({ error: 'Pedido sem endereço' }, { status: 400 })
  }

  const data = await send123LogOrder({
    apiUrl: settings.logisticsApiUrl,
    apiKey: settings.logisticsApiKey,
    origin: settings.logisticsOrigin,
    order: {
      externalId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone || undefined,
      customerEmail: order.customerEmail || undefined,
      cpf: order.customerCpf || undefined,
      zipCode: order.zipCode,
      street: order.street || '',
      number: order.number || '',
      complement: order.complement || undefined,
      neighborhood: order.neighborhood || '',
      city: order.city || '',
      state: order.state || '',
      productName: order.offerName,
      productCode: order.checkout?.product?.logisticsId || undefined,
      quantity: 1,
      value: order.value,
    },
  })

  return NextResponse.json({ success: true, data })
}
