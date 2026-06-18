import axios from 'axios'

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
