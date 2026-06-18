import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

  let updated = 0
  const notFound: string[] = []

  for (const row of rows) {
    const orderId = row.order_id || row.ID || row.id
    const trackingCode = row.tracking_code || row.rastreio || row.Rastreio
    const trackingUrl = row.tracking_url || row.url_rastreio

    if (!orderId || !trackingCode) continue

    const result = await prisma.order.updateMany({
      where: { id: String(orderId), userId },
      data: {
        trackingCode: String(trackingCode),
        ...(trackingUrl ? { trackingUrl: String(trackingUrl) } : {}),
      },
    })

    if (result.count > 0) updated++
    else notFound.push(String(orderId))
  }

  return NextResponse.json({ updated, notFound })
}
