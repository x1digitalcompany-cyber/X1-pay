'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
  RotateCcw,
  Send,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
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
  updatedAt: string
  couponCode: string | null
  refundNote: string | null

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

interface TimelineStep {
  key: string
  label: string
  date: string | null
  done: boolean
  active: boolean
  note?: string | null
  variant?: 'default' | 'danger' | 'warning'
}

const STATUS_OPTIONS = [
  'PENDING',
  'WAITING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'REFUNDED',
  'CHARGEBACK',
  'CANCELLED',
]

const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

function buildTimeline(order: Order): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Pedido criado',
      date: order.createdAt,
      done: true,
      active: order.status === 'PENDING',
    },
  ]

  const paymentStatuses = ['WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'REFUNDED', 'CHARGEBACK']
  if (paymentStatuses.includes(order.status) || order.paidAt) {
    steps.push({
      key: 'WAITING_PAYMENT',
      label: 'Aguardando pagamento',
      date: order.createdAt,
      done: order.status !== 'PENDING',
      active: order.status === 'WAITING_PAYMENT',
    })
  }

  if (order.paidAt || ['PAID', 'CONFIRMED', 'REFUNDED'].includes(order.status)) {
    steps.push({
      key: 'PAID',
      label: 'Pagamento confirmado',
      date: order.paidAt,
      done: !!order.paidAt || ['PAID', 'CONFIRMED', 'REFUNDED'].includes(order.status),
      active: order.status === 'PAID',
    })
  }

  if (order.status === 'CONFIRMED') {
    steps.push({
      key: 'CONFIRMED',
      label: 'Pedido confirmado',
      date: order.paidAt || order.updatedAt,
      done: true,
      active: true,
    })
  }

  if (order.trackingCode) {
    steps.push({
      key: 'tracking',
      label: 'Rastreio informado',
      date: order.updatedAt,
      done: true,
      active: false,
      note: order.trackingCode,
    })
  }

  if (order.status === 'REFUNDED') {
    steps.push({
      key: 'REFUNDED',
      label: 'Reembolsado',
      date: order.updatedAt,
      done: true,
      active: true,
      note: order.refundNote,
      variant: 'warning',
    })
  }

  if (order.status === 'CHARGEBACK') {
    steps.push({
      key: 'CHARGEBACK',
      label: 'Chargeback',
      date: order.updatedAt,
      done: true,
      active: true,
      variant: 'danger',
    })
  }

  if (order.status === 'CANCELLED') {
    steps.push({
      key: 'CANCELLED',
      label: 'Cancelado',
      date: order.updatedAt,
      done: true,
      active: true,
      variant: 'danger',
    })
  }

  return steps
}

export default function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingCode, setTrackingCode] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingLogistics, setSendingLogistics] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundNote, setRefundNote] = useState('')
  const [refunding, setRefunding] = useState(false)

  const inputClass =
    'mt-1 w-full px-3 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm focus:outline-none focus:border-purple-500'

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

  const timeline = useMemo(() => (order ? buildTimeline(order) : []), [order])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev))
      toast.success('Status atualizado')
    } else {
      toast.error('Erro ao atualizar status')
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
      const updated = await res.json()
      toast.success('Rastreio salvo!')
      setOrder((prev) => (prev ? { ...prev, ...updated, trackingCode, trackingUrl } : prev))
    } else {
      toast.error('Erro ao salvar rastreio')
    }
  }

  async function requestRefund() {
    if (!refundNote.trim()) {
      toast.error('Informe o motivo do reembolso')
      return
    }
    setRefunding(true)
    const res = await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REFUNDED', refundNote: refundNote.trim() }),
    })
    setRefunding(false)
    if (res.ok) {
      const updated = await res.json()
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev))
      setRefundOpen(false)
      setRefundNote('')
      toast.success('Reembolso registrado')
    } else {
      toast.error('Erro ao solicitar reembolso')
    }
  }

  async function sendToLogistics() {
    setSendingLogistics(true)
    try {
      const res = await fetch(`/api/pedidos/${id}/logistica`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pedido enviado para logística!')
      } else {
        toast.error(data.error || 'Erro ao enviar para logística')
      }
    } catch {
      toast.error('Erro ao enviar para logística')
    } finally {
      setSendingLogistics(false)
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
        <p className="text-[var(--admin-muted)] mb-4">Pedido não encontrado</p>
        <Link href="/admin/pedidos" className="text-purple-400 hover:underline">
          Voltar para pedidos
        </Link>
      </div>
    )
  }

  const sectionClass =
    'bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5 space-y-4'
  const labelClass = 'text-xs text-[var(--admin-muted)] uppercase tracking-wide'
  const valueClass = 'text-[var(--admin-text)] text-sm mt-0.5'

  const canRefund = !['REFUNDED', 'CANCELLED', 'CHARGEBACK'].includes(order.status)
  const canSendLogistics = !!order.zipCode && !['REFUNDED', 'CANCELLED', 'CHARGEBACK'].includes(order.status)

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
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.back()} className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[var(--admin-text)]">
          Pedido #{order.id.slice(-8).toUpperCase()}
        </h1>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full ml-auto',
            getOrderStatusColor(order.status),
            'bg-current/10'
          )}
        >
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {canRefund && (
          <button
            onClick={() => setRefundOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-800/50 text-orange-400 text-sm hover:bg-orange-900/20 transition"
          >
            <RotateCcw size={16} /> Solicitar reembolso
          </button>
        )}
        {canSendLogistics && (
          <button
            onClick={sendToLogistics}
            disabled={sendingLogistics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium disabled:opacity-50"
          >
            <Send size={16} /> {sendingLogistics ? 'Enviando...' : 'Enviar para logística'}
          </button>
        )}
      </div>

      {/* Timeline de status */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
          <Clock size={16} className="text-purple-400" /> Histórico de status
        </div>
        <div className="space-y-0">
          {timeline.map((step, i) => {
            const isLast = i === timeline.length - 1
            const dotColor =
              step.variant === 'danger'
                ? 'text-red-400'
                : step.variant === 'warning'
                  ? 'text-orange-400'
                  : step.done
                    ? 'text-green-400'
                    : 'text-[var(--admin-muted)]'

            return (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {step.done ? (
                    step.variant === 'danger' ? (
                      <XCircle size={18} className={dotColor} />
                    ) : (
                      <CheckCircle2 size={18} className={dotColor} />
                    )
                  ) : (
                    <Circle size={18} className={dotColor} />
                  )}
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 min-h-[24px] my-1',
                        step.done ? 'bg-green-900/50' : 'bg-[var(--admin-border)]'
                      )}
                    />
                  )}
                </div>
                <div className={cn('pb-5', isLast && 'pb-0')}>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.active ? 'text-[var(--admin-text)]' : 'text-[var(--admin-muted)]'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-xs text-[var(--admin-muted)] mt-0.5">{formatDate(step.date)}</p>
                  )}
                  {step.note && (
                    <p className="text-xs text-[var(--admin-muted)] mt-1 bg-[var(--admin-bg)] rounded p-2 border border-[var(--admin-border)]">
                      {step.note}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo do pedido */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
            <Package size={16} className="text-purple-400" /> Resumo do pedido
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Oferta" value={order.offerName} />
            <Field label="Produto" value={order.checkout?.product.name} />
            <div>
              <p className={labelClass}>Valor</p>
              <p className={valueClass}>{formatCurrency(order.value)}</p>
            </div>
            {order.discountAmount > 0 && (
              <div>
                <p className={labelClass}>Desconto</p>
                <p className="text-red-400 text-sm mt-0.5">- {formatCurrency(order.discountAmount)}</p>
              </div>
            )}
            <div>
              <p className={labelClass}>Líquido</p>
              <p className="text-purple-400 text-sm mt-0.5">{formatCurrency(order.netValue)}</p>
            </div>
            <Field label="Cupom" value={order.couponCode} />
            <Field
              label="Pagamento"
              value={`${paymentLabels[order.paymentMethod] ?? order.paymentMethod}${order.installments > 1 ? ` ${order.installments}x` : ''}`}
            />
            {order.cardBrand && (
              <Field label="Cartão" value={`${order.cardBrand} ****${order.cardLastDigits}`} />
            )}
            <Field label="Criado em" value={formatDate(order.createdAt)} />
            <Field label="Pago em" value={order.paidAt ? formatDate(order.paidAt) : undefined} />
            <Field label="Vendedor" value={order.seller?.name} />
            {order.refundNote && <Field label="Motivo do reembolso" value={order.refundNote} />}
          </div>

          <div>
            <p className={labelClass}>Alterar status</p>
            <select
              className={inputClass}
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {getOrderStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cliente */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
            <User size={16} className="text-purple-400" /> Cliente
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome" value={order.customerName} />
            <Field label="CPF" value={order.customerCpf} />
            <Field label="Email" value={order.customerEmail} />
            <Field label="Telefone" value={order.customerPhone} />
          </div>
        </div>

        {/* Endereço */}
        {order.zipCode && (
          <div className={sectionClass}>
            <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
              <MapPin size={16} className="text-purple-400" /> Endereço de entrega
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CEP" value={order.zipCode} />
              <div className="col-span-2">
                <Field
                  label="Logradouro"
                  value={`${order.street ?? ''}, ${order.number ?? ''}${order.complement ? ` - ${order.complement}` : ''}`}
                />
              </div>
              <Field label="Bairro" value={order.neighborhood} />
              <Field
                label="Cidade / Estado"
                value={order.city && order.state ? `${order.city} / ${order.state}` : undefined}
              />
            </div>
          </div>
        )}

        {/* Pagamento */}
        {(order.gatewayId || order.pixCode || order.boletoUrl) && (
          <div className={sectionClass}>
            <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
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
                  <p className="text-xs text-[var(--admin-muted)] break-all mt-0.5 bg-[var(--admin-bg)] rounded p-2 border border-[var(--admin-border)]">
                    {order.pixCode}
                  </p>
                </div>
              )}
              {order.boletoUrl && (
                <div>
                  <p className={labelClass}>Boleto</p>
                  <a
                    href={order.boletoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline text-sm"
                  >
                    Abrir boleto
                  </a>
                  {order.boletoBarCode && (
                    <p className="text-xs text-[var(--admin-muted)] break-all mt-1">{order.boletoBarCode}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rastreamento */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 text-[var(--admin-text)] font-semibold">
            <Truck size={16} className="text-purple-400" /> Rastreamento
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Código de rastreio</label>
              <input
                className={inputClass}
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
              />
            </div>
            <div>
              <label className={labelClass}>URL de rastreio</label>
              <input
                className={inputClass}
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

      {/* Modal reembolso */}
      {refundOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Solicitar reembolso</h2>
            <p className="text-sm text-[var(--admin-muted)]">
              O pedido será marcado como <strong className="text-orange-400">Reembolsado</strong>.
              Informe o motivo abaixo para registro interno.
            </p>
            <div>
              <label className="block text-sm text-[var(--admin-muted)] mb-1">Motivo do reembolso</label>
              <textarea
                className={cn(inputClass, 'resize-none')}
                rows={4}
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder="Descreva o motivo do reembolso..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRefundOpen(false)
                  setRefundNote('')
                }}
                className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={requestRefund}
                disabled={refunding}
                className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm disabled:opacity-50"
              >
                {refunding ? 'Processando...' : 'Confirmar reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
