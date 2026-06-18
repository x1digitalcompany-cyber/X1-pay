import axios from 'axios'
import { prisma } from './prisma'

export async function dispatchLogisticsIfEnabled(orderId: string, userId: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  if (
    !settings?.logisticsEnabled ||
    !settings.logisticsApiUrl ||
    !settings.logisticsApiKey ||
    !settings.logisticsOrigin
  ) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { checkout: { include: { product: true } } },
  })
  if (!order?.zipCode) return

  try {
    await send123LogOrder({
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
  } catch (err) {
    console.error('Logistics auto-dispatch failed:', err)
  }
}

export async function send123LogOrder(params: {
  apiUrl: string
  apiKey: string
  origin: string
  order: {
    externalId: string
    customerName: string
    customerPhone?: string
    customerEmail?: string
    cpf?: string
    zipCode: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    productName: string
    productCode?: string
    quantity: number
    value: number
  }
}) {
  const client = axios.create({
    baseURL: params.apiUrl,
    headers: {
      'Api-Key': params.apiKey,
      'Content-Type': 'application/json',
    },
  })

  const body = {
    origem: params.origin,
    pedido_externo: params.order.externalId,
    cliente: {
      nome: params.order.customerName,
      telefone: params.order.customerPhone,
      email: params.order.customerEmail,
      cpf: params.order.cpf,
    },
    endereco: {
      cep: params.order.zipCode,
      logradouro: params.order.street,
      numero: params.order.number,
      complemento: params.order.complement,
      bairro: params.order.neighborhood,
      cidade: params.order.city,
      uf: params.order.state,
    },
    itens: [
      {
        descricao: params.order.productName,
        codigo: params.order.productCode,
        quantidade: params.order.quantity,
        valor: params.order.value,
      },
    ],
  }

  const response = await client.post('', body)
  return response.data
}
