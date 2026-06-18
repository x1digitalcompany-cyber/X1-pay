import axios from 'axios'
import { format, addDays } from 'date-fns'

const ASAAS_BASE = 'https://api.asaas.com/v3'

function getClient(apiKey: string) {
  return axios.create({
    baseURL: ASAAS_BASE,
    headers: {
      access_token: apiKey,
      'Content-Type': 'application/json',
    },
  })
}

export async function createAsaasCustomer(
  apiKey: string,
  params: {
    name: string
    email?: string
    cpfCnpj?: string
    phone?: string
  }
) {
  const client = getClient(apiKey)
  const res = await client.post('/customers', {
    name: params.name,
    email: params.email,
    cpfCnpj: params.cpfCnpj?.replace(/\D/g, '') || undefined,
    phone: params.phone?.replace(/\D/g, '') || undefined,
    notificationDisabled: true,
  })
  return res.data as { id: string }
}

export async function createAsaasPayment(
  apiKey: string,
  params: {
    customerId: string
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    value: number
    description: string
    installmentCount?: number
    creditCard?: {
      holderName: string
      number: string
      expiryMonth: string
      expiryYear: string
      ccv: string
    }
    creditCardHolderInfo?: {
      name: string
      email?: string
      cpfCnpj?: string
      postalCode?: string
      addressNumber?: string
      phone?: string
    }
  }
) {
  const client = getClient(apiKey)
  const dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const body: Record<string, unknown> = {
    customer: params.customerId,
    billingType: params.billingType,
    value: params.value,
    dueDate,
    description: params.description,
  }

  if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
    body.creditCard = params.creditCard
    body.creditCardHolderInfo = params.creditCardHolderInfo
    if (params.installmentCount && params.installmentCount > 1) {
      body.installmentCount = params.installmentCount
      body.installmentValue = parseFloat((params.value / params.installmentCount).toFixed(2))
    }
  }

  const res = await client.post('/payments', body)
  return res.data as {
    id: string
    status: string
    bankSlipUrl?: string
    invoiceUrl?: string
  }
}

export async function getAsaasPixQrCode(apiKey: string, paymentId: string) {
  const client = getClient(apiKey)
  const res = await client.get(`/payments/${paymentId}/pixQrCode`)
  return res.data as { encodedImage: string; payload: string; expirationDate: string }
}

export function mapAsaasStatus(status: string): string {
  switch (status) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'PAID'
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
      return 'REFUNDED'
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
    case 'AWAITING_CHARGEBACK_REVERSAL':
      return 'CHARGEBACK'
    case 'OVERDUE':
    case 'DELETED':
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'WAITING_PAYMENT'
  }
}
