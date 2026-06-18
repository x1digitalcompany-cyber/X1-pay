import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: Date | string, fmt = 'dd/MM/yyyy HH:mm'): string {
  return format(new Date(date), fmt, { locale: ptBR })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function maskCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function maskCep(cep: string): string {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
}

export async function fetchAddressByCep(cep: string) {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
  const data = await res.json()
  if (data.erro) return null
  return {
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  }
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendente',
    WAITING_PAYMENT: 'Aguardando pagamento',
    PAID: 'Pago',
    CONFIRMED: 'Confirmado',
    REFUNDED: 'Reembolsado',
    CHARGEBACK: 'Chargeback',
    CANCELLED: 'Cancelado',
  }
  return map[status] || status
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'text-yellow-400',
    WAITING_PAYMENT: 'text-blue-400',
    PAID: 'text-green-400',
    CONFIRMED: 'text-green-500',
    REFUNDED: 'text-orange-400',
    CHARGEBACK: 'text-red-400',
    CANCELLED: 'text-gray-400',
  }
  return map[status] || 'text-gray-400'
}
