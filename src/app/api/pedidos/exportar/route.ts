import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { startOfDay, endOfDay } from 'date-fns'

function buildWhere(userId: string, searchParams: URLSearchParams) {
  const status = searchParams.get('status')
  const paymentMethod = searchParams.get('paymentMethod')
  const sellerId = searchParams.get('sellerId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')
  const minValue = searchParams.get('minValue')
  const maxValue = searchParams.get('maxValue')

  const where: Record<string, unknown> = { userId }

  if (status) {
    const statuses = status.split(',').filter(Boolean)
    if (statuses.length) where.status = { in: statuses }
  }
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (sellerId) where.sellerId = sellerId
  if (from || to) {
    const createdAt: Record<string, Date> = {}
    if (from) createdAt.gte = startOfDay(new Date(from))
    if (to) createdAt.lte = endOfDay(new Date(to))
    where.createdAt = createdAt
  }
  if (search) {
    where.OR = [
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
      { customerPhone: { contains: search } },
      { offerName: { contains: search } },
    ]
  }
  if (minValue) where.value = { ...(where.value as object), gte: Number(minValue) }
  if (maxValue) where.value = { ...(where.value as object), lte: Number(maxValue) }

  return where
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const where = buildWhere(userId, searchParams)

  const orders = await prisma.order.findMany({
    where,
    include: { seller: true, checkout: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const rows = orders.map((o) => ({
    ID: o.id,
    Cliente: o.customerName,
    Email: o.customerEmail || '',
    Telefone: o.customerPhone || '',
    CPF: o.customerCpf || '',
    CEP: o.zipCode || '',
    Endereço: [o.street, o.number].filter(Boolean).join(', '),
    Cidade: o.city || '',
    Estado: o.state || '',
    Produto: o.checkout?.product?.name || '',
    Checkout: o.offerName,
    Valor: o.value,
    Desconto: o.discountAmount,
    Líquido: o.netValue,
    Pagamento: o.paymentMethod,
    Status: o.status,
    Cupom: o.couponCode || '',
    Rastreio: o.trackingCode || '',
    'Criado em': o.createdAt.toISOString(),
    'Pago em': o.paidAt?.toISOString() || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="pedidos.xlsx"',
    },
  })
}
