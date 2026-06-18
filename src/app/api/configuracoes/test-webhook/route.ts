import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, getAdminUserId } from '@/lib/auth'
import { dispatchWebhook } from '@/lib/webhook'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = getAdminUserId(session!)
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await dispatchWebhook(userId, 'order.paid', {
    id: 'test-order-id',
    customerName: 'Cliente Teste',
    customerEmail: 'teste@exemplo.com',
    price: 99.9,
    paymentMethod: 'PIX',
    status: 'PAID',
  })

  return NextResponse.json({ success: true })
}
