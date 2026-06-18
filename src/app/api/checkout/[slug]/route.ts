import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPagarmeOrder, calculateNetValue } from '@/lib/pagarme'
import { addDays, format } from 'date-fns'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const checkout = await prisma.checkout.findUnique({
    where: { slug: params.slug },
    include: {
      product: {
        include: {
          user: {
            include: { settings: true },
          },
        },
      },
    },
  })

  if (!checkout || !checkout.isActive) {
    return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })
  }

  const user = checkout.product.user
  return NextResponse.json({
    id: checkout.id,
    name: checkout.name,
    slug: checkout.slug,
    price: checkout.price,
    product: {
      name: checkout.product.name,
      description: checkout.product.description,
      imageUrl: checkout.product.imageUrl,
      type: checkout.product.type,
    },
    brandName: user.brandName,
    brandColor: user.brandColor,
    logoUrl: user.logoUrl,
    maxInstallments: user.maxInstallments,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const checkout = await prisma.checkout.findUnique({
    where: { slug: params.slug },
    include: {
      product: {
        include: {
          user: { include: { settings: true } },
        },
      },
    },
  })

  if (!checkout || !checkout.isActive) {
    return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const user = checkout.product.user
  const settings = user.settings

  const paymentMethod = body.paymentMethod as 'PIX' | 'CARD' | 'BOLETO'
  const installments = body.installments || 1

  // Validate and apply coupon
  let discountAmount = 0
  let couponCode: string | null = null

  if (body.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { userId_code: { userId: user.id, code: body.couponCode.toUpperCase().trim() } },
    })

    const isValid =
      coupon &&
      coupon.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
      checkout.price >= coupon.minOrderValue

    if (isValid && coupon) {
      discountAmount =
        coupon.type === 'PERCENTAGE'
          ? Math.round(checkout.price * (coupon.value / 100) * 100) / 100
          : Math.min(coupon.value, checkout.price)
      couponCode = coupon.code

      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      })
    }
  }

  const finalPrice = checkout.price - discountAmount

  const netValue = settings
    ? calculateNetValue(
        finalPrice,
        paymentMethod,
        installments,
        settings,
        checkout.product.unitCost
      )
    : finalPrice

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      checkoutId: checkout.id,
      sellerId: body.sellerId || null,
      offerName: checkout.name,
      value: checkout.price,
      discountAmount,
      couponCode,
      status: 'WAITING_PAYMENT',
      paymentMethod,
      installments,
      netValue,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerCpf: body.customerCpf,
      zipCode: body.zipCode,
      street: body.street,
      number: body.number,
      complement: body.complement,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
    },
  })

  const secretKey =
    settings?.pagarmeSecretKey || process.env.PAGARME_SECRET_KEY

  if (!secretKey) {
    return NextResponse.json({
      orderId: order.id,
      status: 'WAITING_PAYMENT',
      message: 'Pedido criado. Configure a chave Pagar.me para processar pagamento.',
    })
  }

  try {
    const amountCents = Math.round(finalPrice * 100)
    const pagarmePaymentMethod =
      paymentMethod === 'PIX' ? 'pix' : paymentMethod === 'CARD' ? 'credit_card' : 'boleto'

    const payments: Parameters<typeof createPagarmeOrder>[0]['payments'] = []

    if (pagarmePaymentMethod === 'pix') {
      payments.push({
        payment_method: 'pix',
        pix: { expires_in: 3600 },
      })
    } else if (pagarmePaymentMethod === 'boleto') {
      payments.push({
        payment_method: 'boleto',
        boleto: {
          instructions: 'Pagar até o vencimento',
          due_at: format(addDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        },
      })
    } else if (body.card) {
      payments.push({
        payment_method: 'credit_card',
        credit_card: {
          installments,
          statement_descriptor: user.brandName.slice(0, 13),
          card: {
            number: body.card.number.replace(/\D/g, ''),
            holder_name: body.card.holderName,
            exp_month: parseInt(body.card.expMonth, 10),
            exp_year: parseInt(body.card.expYear, 10),
            cvv: body.card.cvv,
          },
        },
      })
    }

    const pagarmeOrder = await createPagarmeOrder({
      secretKey,
      customer: {
        name: body.customerName,
        email: body.customerEmail || 'cliente@email.com',
        phone: body.customerPhone?.replace(/\D/g, ''),
        document: body.customerCpf?.replace(/\D/g, ''),
        type: 'individual',
      },
      items: [
        {
          amount: amountCents,
          description: checkout.name,
          quantity: 1,
          code: checkout.id,
        },
      ],
      payments,
      ...(body.zipCode
        ? {
            shipping: {
              amount: 0,
              description: 'Entrega',
              address: {
                line_1: `${body.street}, ${body.number}`,
                zip_code: body.zipCode.replace(/\D/g, ''),
                city: body.city,
                state: body.state,
                country: 'BR',
              },
            },
          }
        : {}),
    })

    const charge = pagarmeOrder.charges?.[0]
    const lastTransaction = charge?.last_transaction

    const updateData: Record<string, string | undefined> = {
      gatewayId: pagarmeOrder.id,
      gatewayStatus: charge?.status,
    }

    if (paymentMethod === 'PIX' && lastTransaction) {
      updateData.pixCode = lastTransaction.qr_code
      updateData.pixQrCode = lastTransaction.qr_code_url
    }
    if (paymentMethod === 'BOLETO' && lastTransaction) {
      updateData.boletoUrl = lastTransaction.pdf
      updateData.boletoBarCode = lastTransaction.line
    }
    if (paymentMethod === 'CARD' && lastTransaction?.card) {
      updateData.cardBrand = lastTransaction.card.brand
      updateData.cardLastDigits = lastTransaction.card.last_four_digits
      if (charge?.status === 'paid') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paidAt: new Date() },
        })
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    })

    return NextResponse.json({
      orderId: order.id,
      status: charge?.status === 'paid' ? 'PAID' : 'WAITING_PAYMENT',
      pixCode: updateData.pixCode,
      pixQrCode: updateData.pixQrCode,
      boletoUrl: updateData.boletoUrl,
      boletoBarCode: updateData.boletoBarCode,
    })
  } catch (error: unknown) {
    console.error('Erro Pagar.me:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', orderId: order.id },
      { status: 500 }
    )
  }
}
