import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })
  }

  const checkout = await prisma.checkout.findUnique({
    where: { slug: params.slug },
    include: { product: { include: { user: true } } },
  })

  if (!checkout || !checkout.isActive) {
    return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })
  }

  const coupon = await prisma.coupon.findUnique({
    where: { userId_code: { userId: checkout.product.userId, code: code.toUpperCase().trim() } },
  })

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 404 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
  }

  if (checkout.price < coupon.minOrderValue) {
    return NextResponse.json(
      { error: `Valor mínimo para este cupom: R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}` },
      { status: 400 }
    )
  }

  const discount =
    coupon.type === 'PERCENTAGE'
      ? Math.round(checkout.price * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, checkout.price)

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    finalPrice: checkout.price - discount,
  })
}
