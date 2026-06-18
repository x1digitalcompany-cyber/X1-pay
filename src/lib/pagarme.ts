import axios from 'axios'

const PAGARME_API = 'https://api.pagar.me/core/v5'

export function getPagarmeClient(secretKey: string) {
  return axios.create({
    baseURL: PAGARME_API,
    auth: { username: secretKey, password: '' },
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface CreateOrderParams {
  secretKey: string
  customer: {
    name: string
    email: string
    document?: string
    type: 'individual' | 'company'
    phones?: {
      mobile_phone?: {
        country_code: string
        area_code: string
        number: string
      }
    }
  }
  items: Array<{
    amount: number
    description: string
    quantity: number
    code: string
  }>
  payments: Array<{
    payment_method: 'pix' | 'credit_card' | 'boleto'
    credit_card?: {
      installments: number
      statement_descriptor: string
      card: {
        number: string
        holder_name: string
        exp_month: number
        exp_year: number
        cvv: string
      }
    }
    pix?: {
      expires_in: number
    }
    boleto?: {
      instructions: string
      due_at: string
    }
  }>
  shipping?: {
    amount: number
    description: string
    address: {
      line_1: string
      zip_code: string
      city: string
      state: string
      country: string
    }
  }
}

export async function createPagarmeOrder(params: CreateOrderParams) {
  const client = getPagarmeClient(params.secretKey)
  const { secretKey: _secretKey, ...body } = params
  const response = await client.post('/orders', body)
  return response.data
}

export function calculateNetValue(
  grossValue: number,
  paymentMethod: 'PIX' | 'CARD' | 'BOLETO',
  installments: number,
  settings: {
    taxPix: number
    taxBoleto: number
    taxGateway: number
    taxAntifraude: number
    taxCard1x: number
    taxCard2x: number
    taxCard3x: number
    taxCard4x: number
    taxCard5x: number
    taxCard6x: number
    taxCard7x: number
    taxCard8x: number
    taxCard9x: number
    taxCard10x: number
    taxCard11x: number
    taxCard12x: number
  },
  unitCost: number = 0
): number {
  let tax = 0
  let fixedFee = 0

  if (paymentMethod === 'PIX') {
    tax = settings.taxPix / 100
    fixedFee = settings.taxGateway + settings.taxAntifraude
  } else if (paymentMethod === 'BOLETO') {
    fixedFee = settings.taxBoleto + settings.taxGateway + settings.taxAntifraude
  } else if (paymentMethod === 'CARD') {
    const cardTaxMap: Record<number, number> = {
      1: settings.taxCard1x,
      2: settings.taxCard2x,
      3: settings.taxCard3x,
      4: settings.taxCard4x,
      5: settings.taxCard5x,
      6: settings.taxCard6x,
      7: settings.taxCard7x,
      8: settings.taxCard8x,
      9: settings.taxCard9x,
      10: settings.taxCard10x,
      11: settings.taxCard11x,
      12: settings.taxCard12x,
    }
    tax = (cardTaxMap[installments] || settings.taxCard1x) / 100
    fixedFee = settings.taxGateway + settings.taxAntifraude
  }

  const net = grossValue * (1 - tax) - fixedFee - unitCost
  return Math.max(0, parseFloat(net.toFixed(2)))
}
