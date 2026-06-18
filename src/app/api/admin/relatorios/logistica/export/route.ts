import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { startOfDay, endOfDay, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function isGotas(type: string | null) {
  return (type ?? '').toLowerCase().includes('got')
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const de = searchParams.get('de') || searchParams.get('from')
  const ate = searchParams.get('ate') || searchParams.get('to')

  const where: Record<string, unknown> = {
    userId,
    status: { in: ['PAID', 'CONFIRMED'] },
  }

  if (de || ate) {
    const paidAt: Record<string, Date> = {}
    if (de) paidAt.gte = startOfDay(new Date(de))
    if (ate) paidAt.lte = endOfDay(new Date(ate))
    where.paidAt = paidAt
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      checkout: { include: { product: true } },
      seller: true,
    },
    orderBy: { paidAt: 'desc' },
  })

  const rows = orders.map((o) => ({
    'Data pag.': o.paidAt
      ? format(o.paidAt, 'dd/MM/yyyy', { locale: ptBR })
      : '—',
    Cliente: o.customerName,
    Oferta: o.offerName,
    Produto: o.checkout?.product?.name ?? '—',
    Tipo: o.checkout?.product?.type ?? '—',
    Pagamento: o.paymentMethod,
    Vendedor: o.seller?.name ?? '—',
    'Valor bruto': o.value,
    Desconto: o.discountAmount,
    'Líquido gateway': o.netValue,
    'Custo logística': o.checkout?.product?.unitCost ?? 0,
    Categoria: isGotas(o.checkout?.product?.type ?? null) ? 'Gotas' : 'Cápsulas',
    Rastreio: o.trackingCode ?? '—',
  }))

  const capsules = orders.filter((o) => !isGotas(o.checkout?.product?.type ?? null))
  const gotas = orders.filter((o) => isGotas(o.checkout?.product?.type ?? null))
  const capsulesCost = capsules.reduce((s, o) => s + (o.checkout?.product?.unitCost ?? 0), 0)
  const gotasCost = gotas.reduce((s, o) => s + (o.checkout?.product?.unitCost ?? 0), 0)

  const summaryRows = [
    { Métrica: 'Vendas no período', Valor: orders.length },
    { Métrica: 'Total cápsulas (un)', Valor: capsules.length },
    { Métrica: 'Total cápsulas (R$)', Valor: capsulesCost },
    { Métrica: 'Total gotas (un)', Valor: gotas.length },
    { Métrica: 'Total gotas (R$)', Valor: gotasCost },
    { Métrica: 'Frete total', Valor: 0 },
    { Métrica: 'Total a pagar logística', Valor: capsulesCost + gotasCost },
  ]

  const ws = XLSX.utils.json_to_sheet(rows)
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `acerto-logistica-${de ?? 'inicio'}-${ate ?? 'fim'}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
