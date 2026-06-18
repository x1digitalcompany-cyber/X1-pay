'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, SlidersHorizontal, X, ShoppingCart } from 'lucide-react'
import { cn, formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

interface Order {
  id: string
  customerName: string
  offerName: string
  value: number
  status: string
  paymentMethod: string
  createdAt: string
  seller?: { name: string }
}

interface Seller {
  id: string
  name: string
}

interface Filters {
  statuses: string[]
  paymentMethod: string
  sellerId: string
  from: string
  to: string
  minValue: string
  maxValue: string
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'WAITING_PAYMENT', label: 'Aguardando pagamento' },
  { value: 'PAID', label: 'Pago' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'REFUNDED', label: 'Reembolsado' },
  { value: 'CHARGEBACK', label: 'Chargeback' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const PAYMENT_OPTIONS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CARD', label: 'Cartão' },
  { value: 'BOLETO', label: 'Boleto' },
]

const todayISO = () => new Date().toISOString().split('T')[0]

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.statuses.length) params.set('status', filters.statuses.join(','))
  if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod)
  if (filters.sellerId) params.set('sellerId', filters.sellerId)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.minValue) params.set('minValue', filters.minValue)
  if (filters.maxValue) params.set('maxValue', filters.maxValue)
  return params
}

export default function PedidosPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const defaultFilters: Filters = {
    statuses: [],
    paymentMethod: '',
    sellerId: '',
    from: todayISO(),
    to: todayISO(),
    minValue: '',
    maxValue: '',
  }

  const [applied, setApplied] = useState<Filters>(defaultFilters)
  const [draft, setDraft] = useState<Filters>(defaultFilters)

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm focus:outline-none focus:border-purple-500'

  const load = useCallback(async () => {
    setLoading(true)
    const params = buildParams(applied)
    const data = await fetch(`/api/pedidos?${params}`).then((r) => r.json())
    setOrders(data)
    setLoading(false)
  }, [applied])

  useEffect(() => {
    fetch('/api/vendedores').then((r) => r.json()).then((d) =>
      setSellers(d.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
    )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const exportHref = useMemo(() => {
    const params = buildParams(applied)
    return `/api/admin/pedidos/export?${params}`
  }, [applied])

  const isTodayOnly =
    applied.from === todayISO() && applied.to === todayISO() && !applied.statuses.length &&
    !applied.paymentMethod && !applied.sellerId && !applied.minValue && !applied.maxValue

  const activeBadges = useMemo(() => {
    const badges: { key: string; label: string; onRemove: () => void }[] = []
    if (applied.statuses.length)
      badges.push({
        key: 'status',
        label: `Status: ${applied.statuses.length}`,
        onRemove: () => setApplied((f) => ({ ...f, statuses: [] })),
      })
    if (applied.paymentMethod)
      badges.push({
        key: 'payment',
        label: PAYMENT_OPTIONS.find((p) => p.value === applied.paymentMethod)?.label ?? applied.paymentMethod,
        onRemove: () => setApplied((f) => ({ ...f, paymentMethod: '' })),
      })
    if (applied.sellerId) {
      const s = sellers.find((x) => x.id === applied.sellerId)
      badges.push({
        key: 'seller',
        label: s?.name ?? 'Vendedor',
        onRemove: () => setApplied((f) => ({ ...f, sellerId: '' })),
      })
    }
    if (!isTodayOnly) {
      badges.push({
        key: 'date',
        label: `${applied.from} — ${applied.to}`,
        onRemove: () => setApplied(defaultFilters),
      })
    }
    return badges
  }, [applied, sellers, isTodayOnly, defaultFilters])

  function applyFilters() {
    setApplied(draft)
    setDrawerOpen(false)
  }

  const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => { setDraft(applied); setDrawerOpen(true) }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/20 mt-1"
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--admin-text)]">Pedidos</h1>
              <p className="text-[var(--admin-muted)] text-sm mt-1">
                {isTodayOnly
                  ? `Mostrando hoje (${todayLabel()}). Use os filtros para ver outros dias.`
                  : `Período filtrado: ${formatDate(applied.from, 'dd/MM/yyyy')} — ${formatDate(applied.to, 'dd/MM/yyyy')}`}
              </p>
            </div>
          </div>
          <Link
            href="/admin/pedidos/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
          >
            <Plus size={16} /> Novo pedido
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <a href={exportHref} className="text-purple-400 hover:underline">
            Exportar pedidos filtrados em planilha
          </a>
          <Link href="/admin/pedidos/importar-rastreios" className="text-purple-400 hover:underline">
            Importar rastreios via planilha
          </Link>
        </div>

        {activeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeBadges.map((b) => (
              <span
                key={b.key}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 text-xs"
              >
                {b.label}
                <button type="button" onClick={b.onRemove}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <ShoppingCart size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-text)]">
            {isTodayOnly ? `Nenhum pedido hoje (${todayLabel()})` : 'Nenhum pedido no período'}
          </p>
          <p className="text-[var(--admin-muted)] text-sm mt-2">
            Os pedidos de hoje aparecem aqui. Use os filtros para ver dias anteriores.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Oferta</th>
                  <th className="text-left p-4">Pagamento</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Valor</th>
                  <th className="text-left p-4">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10 cursor-pointer"
                  >
                    <td className="p-4 text-[var(--admin-text)]">{order.customerName}</td>
                    <td className="p-4 text-[var(--admin-muted)]">{order.offerName}</td>
                    <td className="p-4 text-[var(--admin-muted)]">
                      {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                    </td>
                    <td className={cn('p-4', getOrderStatusColor(order.status))}>
                      {getOrderStatusLabel(order.status)}
                    </td>
                    <td className="p-4 text-right text-[var(--admin-text)]">
                      {formatCurrency(order.value)}
                    </td>
                    <td className="p-4 text-[var(--admin-muted)] whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--admin-panel-bg)] z-50 shadow-xl overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Filtros</h2>
              <button type="button" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>

            <div>
              <p className="text-sm text-[var(--admin-muted)] mb-2">Status</p>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
                    <input
                      type="checkbox"
                      checked={draft.statuses.includes(s.value)}
                      onChange={(e) => {
                        setDraft((d) => ({
                          ...d,
                          statuses: e.target.checked
                            ? [...d.statuses, s.value]
                            : d.statuses.filter((x) => x !== s.value),
                        }))
                      }}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Forma de pagamento</label>
              <select
                className={inputClass + ' mt-1'}
                value={draft.paymentMethod}
                onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}
              >
                <option value="">Todas</option>
                {PAYMENT_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[var(--admin-muted)]">De</label>
                <input type="date" className={inputClass + ' mt-1'} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-[var(--admin-muted)]">Até</label>
                <input type="date" className={inputClass + ' mt-1'} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Vendedor</label>
              <select className={inputClass + ' mt-1'} value={draft.sellerId} onChange={(e) => setDraft({ ...draft, sellerId: e.target.value })}>
                <option value="">Todos</option>
                {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-[var(--admin-muted)]">Valor mín. (R$)</label>
                <input type="number" className={inputClass + ' mt-1'} value={draft.minValue} onChange={(e) => setDraft({ ...draft, minValue: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-[var(--admin-muted)]">Valor máx. (R$)</label>
                <input type="number" className={inputClass + ' mt-1'} value={draft.maxValue} onChange={(e) => setDraft({ ...draft, maxValue: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDraft(defaultFilters); setApplied(defaultFilters) }}
                className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm"
              >
                Limpar
              </button>
              <button type="button" onClick={applyFilters} className="flex-1 py-2 rounded-lg gradient-brand text-white text-sm">
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
