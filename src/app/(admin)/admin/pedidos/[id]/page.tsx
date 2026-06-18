'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck } from 'lucide-react'
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { toast } from 'sonner'

interface Order {
  id: string
  offerName: string
  value: number
  netValue: number
  discountAmount: number
  status: string
  paymentMethod: string
  installments: number
  createdAt: string
  paidAt: string | null
  couponCode: string | null

  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerCpf: string | null

  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null

  trackingCode: string | null
  trackingUrl: string | null

  gatewayId: string | null
  pixCode: string | null
  pixQrCode: string | null
  boletoUrl: string | null
  boletoBarCode: string | null
  cardBrand: string | null
  cardLastDigits: string | null

  seller: { id: string; name: string } | null
  checkout: {
    id: string
    name: string
    slug: string
    product: { name: string; imageUrl: string | null }
  } | null
}

const STATUS_OPTIONS = [
  'PENDING', 'WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'REFUNDED', 'CHARGEBACK', 'CANCELLED',
]

const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

export default function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingCode, setTrackingCode] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setOrder(data)
        setTrackingCode(data.trackingCode ?? '')
        setTrackingUrl(data.trackingUrl ?? '')
      })
      .catch(() => toast.error('Pedido não encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOrder((prev) => prev ? { ...prev, status: updated.status, paidAt: updated.paidAt } : prev)
      toast.success('Status atualizado')
    }
  }

  async function saveTracking() {
    setSaving(true)
    const res = await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingCode, trackingUrl }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Rastreio salvo!')
      setOrder((prev) => prev ? { ...prev, trackingCode, trackingUrl } : prev)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Pedido não encontrado</p>
        <Link href="/admin/pedidos" className="text-purple-400 hover:underline">
          Voltar para pedidos
        </Link>
      </div>
    )
  }

  const sectionClass = 'bg-[#1a1030] rounded-xl border border-purple-900/30 p-5 space-y-4'
  const labelClass = 'text-xs text-gray-400 uppercase tracking-wide'
  const valueClass = 'text-white text-sm mt-0.5'

  function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${getOrderStatusColor(order.status)} bg-current/10`}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order summary */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Package size={16} className="text-purple-400" /> Resumo do pedido
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Oferta" value={order.offerName} />
            <Field label="Produto" value={order.checkout?.product.name} />
            <div>
              <p className={labelClass}>Valor</p>
              <p className="text-white text-sm mt-0.5">{formatCurrency(order.value)}</p>
            </div>
            {order.discountAmount > 0 && (
              <div>
                <p className={labelClass}>Desconto</p>
                <p className="text-red-400 text-sm mt-0.5">- {formatCurrency(order.discountAmount)}</p>
              </div>
            )}
            <div>
              <p className={labelClass}>Líquido</p>
              <p className="text-purple-300 text-sm mt-0.5">{formatCurrency(order.netValue)}</p>
            </div>
            <Field label="Cupom" value={order.couponCode} />
            <Field label="Pagamento" value={`${paymentLabels[order.paymentMethod] ?? order.paymentMethod}${order.installments > 1 ? ` ${order.installments}x` : ''}`} />
            {order.cardBrand && (
              <Field label="Cartão" value={`${order.cardBrand} ****${order.cardLastDigits}`} />
            )}
            <Field label="Criado em" value={formatDate(order.createdAt)} />
            <Field label="Pago em" value={order.paidAt ? formatDate(order.paidAt) : undefined} />
            <Field label="Vendedor" value={order.seller?.name} />
          </div>

          <div>
            <p className={labelClass}>Alterar status</p>
            <select
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-500"
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <User size={16} className="text-purple-400" /> Cliente
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome" value={order.customerName} />
            <Field label="CPF" value={order.customerCpf} />
            <Field label="Email" value={order.customerEmail} />
            <Field label="Telefone" value={order.customerPhone} />
          </div>
        </div>

        {/* Address */}
        {order.zipCode && (
          <div className={sectionClass}>
            <div className="flex items-center gap-2 text-white font-semibold">
              <MapPin size={16} className="text-purple-400" /> Endereço de entrega
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CEP" value={order.zipCode} />
              <div className="col-span-2">
                <Field label="Logradouro" value={`${order.street ?? ''}, ${order.number ?? ''}${order.complement ? ` - ${order.complement}` : ''}`} />
              </div>
              <Field label="Bairro" value={order.neighborhood} />
              <Field label="Cidade / Estado" value={order.city && order.state ? `${order.city} / ${order.state}` : undefined} />
            </div>
          </div>
        )}

        {/* Payment details */}
        {(order.gatewayId || order.pixCode || order.boletoUrl) && (
          <div className={sectionClass}>
            <div className="flex items-center gap-2 text-white font-semibold">
              <CreditCard size={16} className="text-purple-400" /> Pagamento
            </div>
            <div className="space-y-3">
              <Field label="ID Gateway" value={order.gatewayId} />
              {order.pixQrCode && (
                <div>
                  <p className={labelClass}>QR Code PIX</p>
                  <img src={order.pixQrCode} alt="QR PIX" className="w-32 h-32 mt-1" />
                </div>
              )}
              {order.pixCode && (
                <div>
                  <p className={labelClass}>Código PIX</p>
                  <p className="text-xs text-gray-300 break-all mt-0.5 bg-[#0f0a1e] rounded p-2">{order.pixCode}</p>
                </div>
              )}
              {order.boletoUrl && (
                <div>
                  <p className={labelClass}>Boleto</p>
                  <a href={order.boletoUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-sm">
                    Abrir boleto
                  </a>
                  {order.boletoBarCode && (
                    <p className="text-xs text-gray-400 break-all mt-1">{order.boletoBarCode}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracking */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Truck size={16} className="text-purple-400" /> Rastreamento
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Código de rastreio</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-500"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
              />
            </div>
            <div>
              <label className={labelClass}>URL de rastreio</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white text-sm focus:outline-none focus:border-purple-500"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <button
              onClick={saveTracking}
              disabled={saving}
              className="w-full py-2 rounded-lg gradient-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar rastreio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
