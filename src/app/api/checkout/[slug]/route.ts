import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPagarmeOrder, calculateNetValue } from '@/lib/pagarme'
import {
  createAsaasCustomer,
  createAsaasPayment,
  getAsaasPixQrCode,
  mapAsaasStatus,
} from '@/lib/asaas'
import { addDays } from 'date-fns'

export async function GET(
  req: NextRequest,
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

  if (!checkout || !checkout.isActive || !checkout.product.isActive) {
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

  if (!checkout || !checkout.isActive || !checkout.product.isActive) {
    return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const user = checkout.product.user
  const settings = user.settings

  const paymentMethod = body.paymentMethod as 'PIX' | 'CARD' | 'BOLETO'
  const installments = body.installments || 1

  // Seller from body or query param
  let sellerId: string | null = body.sellerId || null
  if (!sellerId) {
    const urlSellerId = new URL(req.url).searchParams.get('seller')
    if (urlSellerId) {
      const seller = await prisma.seller.findFirst({
        where: { id: urlSellerId, userId: user.id, isActive: true },
      })
      if (seller) sellerId = seller.id
    }
  }

  // Coupon validation
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
      sellerId,
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

  const gateway = settings?.gateway || 'pagarme'

  function parsePhone(phone?: string) {
    if (!phone) return undefined
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return undefined
    return { country_code: '55', area_code: digits.slice(0, 2), number: digits.slice(2) }
  }

  function normalizeExpYear(year: string): number {
    const y = year.replace(/\D/g, '')
    return parseInt(y.length === 2 ? `20${y}` : y, 10)
  }

  // --- Pagar.me ---
  if (gateway === 'pagarme') {
    const secretKey = settings?.pagarmeSecretKey || process.env.PAGARME_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({
        orderId: order.id,
        status: 'WAITING_PAYMENT',
        error: 'Gateway não configurado. Adicione a chave Pagar.me em Configurações.',
      }, { status: 400 })
    }

    try {
      const amountCents = Math.round(finalPrice * 100)
      const pagarmePaymentMethod =
        paymentMethod === 'PIX' ? 'pix' : paymentMethod === 'CARD' ? 'credit_card' : 'boleto'

      const payments: Parameters<typeof createPagarmeOrder>[0]['payments'] = []

      if (pagarmePaymentMethod === 'pix') {
        payments.push({ payment_method: 'pix', pix: { expires_in: 3600 } })
      } else if (pagarmePaymentMethod === 'boleto') {
        payments.push({
          payment_method: 'boleto',
          boleto: {
            instructions: 'Pagar até o vencimento',
            due_at: addDays(new Date(), 3).toISOString(),
          },
        })
      } else if (body.card) {
        const billingLine1 = [body.number, body.street, body.neighborhood]
          .filter(Boolean)
          .join(', ')
          .slice(0, 60)

        payments.push({
          payment_method: 'credit_card',
          credit_card: {
            installments,
            statement_descriptor: (user.brandName || 'X1PAY').slice(0, 13),
            card: {
              number: body.card.number.replace(/\D/g, ''),
              holder_name: body.card.holderName,
              exp_month: parseInt(body.card.expMonth, 10),
              exp_year: normalizeExpYear(body.card.expYear),
              cvv: body.card.cvv,
              billing_address: {
                line_1: billingLine1 || 'Endereço não informado',
                zip_code: (body.zipCode || '').replace(/\D/g, ''),
                city: body.city || 'Cidade',
                state: (body.state || 'SP').slice(0, 2).toUpperCase(),
                country: 'BR',
              },
            },
          },
        })
      }

      const mobilePhone = parsePhone(body.customerPhone)

      const pagarmeOrder = await createPagarmeOrder({
        secretKey,
        customer: {
          name: body.customerName,
          email: body.customerEmail || 'cliente@email.com',
          document: body.customerCpf?.replace(/\D/g, ''),
          type: 'individual',
          ...(mobilePhone ? { phones: { mobile_phone: mobilePhone } } : {}),
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

      console.log('[Pagar.me] charge:', JSON.stringify(charge, null, 2))
      console.log('[Pagar.me] lastTransaction:', JSON.stringify(lastTransaction, null, 2))

      const updateData: Record<string, string | undefined> = {
        gatewayId: pagarmeOrder.id,
        gatewayStatus: charge?.status,
      }

      if (paymentMethod === 'PIX' && lastTransaction) {
        updateData.pixCode = lastTransaction.qr_code
        updateData.pixQrCode = lastTransaction.qr_code_url
      }
      if (paymentMethod === 'BOLETO') {
        const t = lastTransaction ?? {}
        updateData.boletoUrl =
          (t as Record<string, string>).url ||
          (t as Record<string, string>).pdf ||
          (charge as Record<string, string>)?.boleto_url ||
          (charge as Record<string, string>)?.url ||
          (pagarmeOrder as Record<string, string>)?.boleto_url ||
          undefined

        updateData.boletoBarCode =
          (t as Record<string, string>).line ||
          (t as Record<string, string>).boleto_barcode ||
          (charge as Record<string, string>)?.boleto_barcode ||
          (charge as Record<string, string>)?.line ||
          (pagarmeOrder as Record<string, string>)?.boleto_barcode ||
          undefined

        console.log('[BOLETO DEBUG] boletoUrl:', updateData.boletoUrl)
        console.log('[BOLETO DEBUG] boletoBarCode:', updateData.boletoBarCode)
        console.log('[BOLETO DEBUG] charge keys:', Object.keys(charge ?? {}))
        console.log('[BOLETO DEBUG] lastTransaction keys:', Object.keys(lastTransaction ?? {}))
        console.log('[BOLETO DEBUG] pagarmeOrder keys:', Object.keys(pagarmeOrder ?? {}))
      }
      if (paymentMethod === 'CARD') {
        if (charge?.status === 'failed' || lastTransaction?.status === 'failed') {
          await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })

          const gwError: string =
            (lastTransaction as Record<string, unknown>)?.gateway_response
              ? ((lastTransaction as Record<string, Record<string, Array<Record<string, string>>>>)
                  .gateway_response?.errors?.[0]?.message ?? '')
              : ''

          let userMessage = 'Pagamento recusado. Verifique os dados do cartão e tente novamente.'
          if (gwError.includes('billing')) userMessage = 'Erro nos dados de endereço. Verifique o CEP e tente novamente.'
          else if (gwError.includes('card')) userMessage = 'Cartão inválido. Verifique o número, validade e CVV.'
          else if (gwError.includes('insufficient')) userMessage = 'Saldo insuficiente. Tente outro cartão.'

          return NextResponse.json({ error: userMessage }, { status: 422 })
        }

        if (lastTransaction?.card) {
          updateData.cardBrand = lastTransaction.card.brand
          updateData.cardLastDigits = lastTransaction.card.last_four_digits
          if (charge?.status === 'paid') {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'PAID', paidAt: new Date() },
            })
          }
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
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
      return NextResponse.json(
        { error: 'Erro ao processar pagamento. Verifique os dados e tente novamente.' },
        { status: 422 }
      )
    }
  }

  // --- Asaas ---
  if (gateway === 'asaas') {
    const apiKey = settings?.asaasApiKey

    if (!apiKey) {
      return NextResponse.json({
        error: 'Gateway não configurado. Adicione a chave Asaas em Configurações.',
      }, { status: 400 })
    }

    try {
      const customer = await createAsaasCustomer(apiKey, {
        name: body.customerName,
        email: body.customerEmail,
        cpfCnpj: body.customerCpf,
        phone: body.customerPhone,
      })

      const billingType =
        paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'BOLETO' ? 'BOLETO' : 'CREDIT_CARD'

      const payment = await createAsaasPayment(apiKey, {
        customerId: customer.id,
        billingType,
        value: finalPrice,
        description: checkout.name,
        installmentCount: installments > 1 ? installments : undefined,
        ...(body.card
          ? {
              creditCard: {
                holderName: body.card.holderName,
                number: body.card.number.replace(/\D/g, ''),
                expiryMonth: body.card.expMonth,
                expiryYear: body.card.expYear,
                ccv: body.card.cvv,
              },
              creditCardHolderInfo: {
                name: body.customerName,
                email: body.customerEmail,
                cpfCnpj: body.customerCpf?.replace(/\D/g, ''),
                postalCode: body.zipCode?.replace(/\D/g, ''),
                addressNumber: body.number,
                phone: body.customerPhone?.replace(/\D/g, ''),
              },
            }
          : {}),
      })

      const asaasStatus = mapAsaasStatus(payment.status)
      const updateData: Record<string, string | undefined | null> = {
        gatewayId: payment.id,
        gatewayStatus: payment.status,
      }

      if (paymentMethod === 'PIX') {
        try {
          const pixData = await getAsaasPixQrCode(apiKey, payment.id)
          updateData.pixCode = pixData.payload
          updateData.pixQrCode = `data:image/png;base64,${pixData.encodedImage}`
        } catch {
          // PIX QR may not be immediately available; client can poll
        }
      }

      if (paymentMethod === 'BOLETO' && payment.bankSlipUrl) {
        updateData.boletoUrl = payment.bankSlipUrl
      }

      if (paymentMethod === 'CARD' && asaasStatus === 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paidAt: new Date() },
        })
      }

      await prisma.order.update({ where: { id: order.id }, data: updateData })

      return NextResponse.json({
        orderId: order.id,
        status: asaasStatus === 'PAID' ? 'PAID' : 'WAITING_PAYMENT',
        pixCode: updateData.pixCode,
        pixQrCode: updateData.pixQrCode,
        boletoUrl: updateData.boletoUrl,
      })
    } catch (error: unknown) {
      console.error('Erro Asaas:', error)
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
      return NextResponse.json(
        { error: 'Erro ao processar pagamento. Verifique os dados e tente novamente.' },
        { status: 422 }
      )
    }
  }

  // Unknown gateway
  return NextResponse.json({ error: 'Gateway de pagamento inválido.' }, { status: 400 })
}
