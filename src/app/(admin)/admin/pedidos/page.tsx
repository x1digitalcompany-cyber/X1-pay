'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  SlidersHorizontal,
  X,
  ShoppingCart,
  Eye,
} from 'lucide-react'
import { cn, formatCurrency, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

interface Order {
  id: string
  customerName: string
  customerPhone: string | null
  offerName: string
  value: number
  netValue: number
  status: string
  paymentMethod: string
  installments: number
  trackingCode: string | null
  createdAt: string
  paidAt: string | null
  seller: { id: string; name: string } | null
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
  search: string
  tracking: string
  src: string
  dateField: string
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

const TRACKING_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'with', label: 'Com rastreio' },
  { value: 'without', label: 'Sem rastreio' },
]

const todayISO = () => new Date().toISOString().split('T')[0]
const todayLabel = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function buildParams(filters: Filters, page: number): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.statuses.length) p.set('status', filters.statuses.join(','))
  if (filters.paymentMethod) p.set('paymentMethod', filters.paymentMethod)
  if (filters.sellerId) p.set('sellerId', filters.sellerId)
  if (filters.from) p.set('from', filters.from)
  if (filters.to) p.set('to', filters.to)
  if (filters.minValue) p.set('minValue', filters.minValue)
  if (filters.maxValue) p.set('maxValue', filters.maxValue)
  if (filters.search) p.set('search', filters.search)
  if (filters.tracking) p.set('tracking', filters.tracking)
  if (filters.src) p.set('src', filters.src)
  if (filters.dateField && filters.dateField !== 'createdAt') p.set('dateField', filters.dateField)
  if (page > 1) p.set('page', String(page))
  return p
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

export default function PedidosPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  const defaultFilters: Filters = {
    statuses: [],
    paymentMethod: '',
    sellerId: '',
    from: todayISO(),
    to: todayISO(),
    minValue: '',
    maxValue: '',
    search: '',
    tracking: '',
    src: '',
    dateField: 'createdAt',
  }

  const [applied, setApplied] = useState<Filters>(defaultFilters)
  const [draft, setDraft] = useState<Filters>(defaultFilters)

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm focus:outline-none focus:border-purple-500'

  const load = useCallback(async () => {
    setLoading(true)
    const params = buildParams(applied, page)
    const res = await fetch(`/api/pedidos?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [applied, page])

  useEffect(() => {
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then((d) => setSellers(d.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const exportHref = useMemo(() => {
    const params = buildParams(applied, 1)
    return `/api/admin/pedidos/export?${params}`
  }, [applied])

  const isTodayOnly =
    applied.from === todayISO() &&
    applied.to === todayISO() &&
    !applied.statuses.length &&
    !applied.paymentMethod &&
    !applied.sellerId &&
    !applied.minValue &&
    !applied.maxValue &&
    !applied.search &&
    !applied.tracking &&
    !applied.src

  const activeBadges = useMemo(() => {
    const badges: { key: string; label: string; onRemove: () => void }[] = []
    if (applied.search)
      badges.push({ key: 'search', label: `"${applied.search}"`, onRemove: () => setApplied((f) => ({ ...f, search: '' })) })
    if (applied.statuses.length)
      badges.push({ key: 'status', label: `Status: ${applied.statuses.length}`, onRemove: () => setApplied((f) => ({ ...f, statuses: [] })) })
    if (applied.paymentMethod)
      badges.push({
        key: 'payment',
        label: PAYMENT_OPTIONS.find((p) => p.value === applied.paymentMethod)?.label ?? applied.paymentMethod,
        onRemove: () => setApplied((f) => ({ ...f, paymentMethod: '' })),
      })
    if (applied.sellerId) {
      const s = sellers.find((x) => x.id === applied.sellerId)
      badges.push({ key: 'seller', label: s?.name ?? 'Vendedor', onRemove: () => setApplied((f) => ({ ...f, sellerId: '' })) })
    }
    if (applied.tracking)
      badges.push({
        key: 'tracking',
        label: TRACKING_OPTIONS.find((t) => t.value === applied.tracking)?.label ?? applied.tracking,
        onRemove: () => setApplied((f) => ({ ...f, tracking: '' })),
      })
    if (applied.src)
      badges.push({ key: 'src', label: `Origem: ${applied.src}`, onRemove: () => setApplied((f) => ({ ...f, src: '' })) })
    if (!isTodayOnly)
      badges.push({
        key: 'date',
        label: `${applied.from} — ${applied.to}`,
        onRemove: () =>
          setApplied({
            statuses: [], paymentMethod: '', sellerId: '',
            from: todayISO(), to: todayISO(),
            minValue: '', maxValue: '', search: '',
            tracking: '', src: '', dateField: 'createdAt',
          }),
      })
    return badges
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, sellers, isTodayOnly])

  function applyFilters() {
    setPage(1)
    setApplied(draft)
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Pedidos</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">
            {isTodayOnly
              ? `Mostrando hoje (${todayLabel()}). Use os filtros para ver outros dias.`
              : `Período: ${applied.from} — ${applied.to}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setDraft(applied); setDrawerOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/20 transition"
          >
            <SlidersHorizontal size={15} /> Filtros
          </button>
          <a
            href={exportHref}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/20 transition"
          >
            Exportar planilha
          </a>
          <Link
            href="/admin/pedidos/importar-rastreios"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/20 transition"
          >
            Importar rastreios
          </Link>
          <Link
            href="/admin/pedidos/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
          >
            <Plus size={15} /> Novo pedido
          </Link>
        </div>
      </div>

      {/* ── Active filter badges ── */}
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

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <ShoppingCart size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-text)]">
            {isTodayOnly ? `Nenhum pedido hoje (${todayLabel()})` : 'Nenhum pedido encontrado'}
          </p>
          <p className="text-[var(--admin-muted)] text-sm mt-2">Use os filtros para ajustar a busca.</p>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)] text-xs uppercase tracking-wide">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Vendedor</th>
                  <th className="text-left p-3 font-medium">Oferta</th>
                  <th className="text-left p-3 font-medium">Valor</th>
                  <th className="text-left p-3 font-medium">A receber</th>
                  <th className="text-left p-3 font-medium">Pagamento</th>
                  <th className="text-left p-3 font-medium">Rastreio</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10 cursor-pointer"
                  >
                    <td className="p-3">
                      <p className="text-[var(--admin-text)] text-sm font-medium leading-tight">
                        {order.customerName}
                      </p>
                      <p className="text-[var(--admin-muted)] text-xs mt-0.5">
                        {order.customerPhone || '·'}
                      </p>
                    </td>

                    <td className="p-3 text-[var(--admin-muted)] text-sm">
                      {order.seller?.name || '—'}
                    </td>

                    <td className="p-3 text-[var(--admin-muted)] text-sm max-w-[160px]">
                      <span className="truncate block">{order.offerName}</span>
                    </td>

                    <td className="p-3 text-[var(--admin-text)] text-sm">
                      {formatCurrency(order.value)}
                    </td>

                    <td className="p-3 text-sm">
                      <span className={order.netValue > 0 ? 'text-green-400' : 'text-[var(--admin-muted)]'}>
                        {formatCurrency(order.netValue ?? 0)}
                      </span>
                    </td>

                    <td className="p-3 text-[var(--admin-muted)] text-sm whitespace-nowrap">
                      {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                      {order.installments > 1 && <span className="text-xs"> {order.installments}x</span>}
                    </td>

                    <td className="p-3 text-[var(--admin-muted)] text-sm">
                      {order.trackingCode || '—'}
                    </td>

                    <td className={cn('p-3 text-sm font-medium', getOrderStatusColor(order.status))}>
                      {getOrderStatusLabel(order.status)}
                    </td>

                    <td className="p-3 text-xs whitespace-nowrap">
                      <p className="text-[var(--admin-muted)]">{fmtDate(order.createdAt)}</p>
                      {order.paidAt && (
                        <p className="text-green-400 mt-0.5">Pago {fmtDate(order.paidAt)}</p>
                      )}
                    </td>

                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                        className="p-1.5 text-[var(--admin-muted)] hover:text-purple-400 transition rounded"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination footer ── */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--admin-border)] text-xs text-[var(--admin-muted)]">
            <span>{total} pedido(s) · página {page} de {Math.max(1, pages)}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-[var(--admin-border)] disabled:opacity-40 text-sm hover:bg-purple-900/10 transition"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1.5 rounded border border-[var(--admin-border)] disabled:opacity-40 text-sm hover:bg-purple-900/10 transition"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--admin-panel-bg)] z-50 shadow-xl overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Filtros</h2>
              <button type="button" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Buscar cliente</label>
              <input
                type="text"
                className={inputClass + ' mt-1'}
                placeholder="Nome, e-mail ou telefone..."
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
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
              <select className={inputClass + ' mt-1'} value={draft.paymentMethod} onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value })}>
                <option value="">Todas</option>
                {PAYMENT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Filtrar datas por</label>
              <select className={inputClass + ' mt-1'} value={draft.dateField} onChange={(e) => setDraft({ ...draft, dateField: e.target.value })}>
                <option value="createdAt">Data de criação</option>
                <option value="paidAt">Data de pagamento</option>
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

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Origem (src)</label>
              <input
                type="text"
                className={inputClass + ' mt-1'}
                placeholder="Nome do vendedor ou fonte..."
                value={draft.src}
                onChange={(e) => setDraft({ ...draft, src: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm text-[var(--admin-muted)]">Rastreio</label>
              <select className={inputClass + ' mt-1'} value={draft.tracking} onChange={(e) => setDraft({ ...draft, tracking: e.target.value })}>
                {TRACKING_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                onClick={() => {
                  const def: Filters = {
                    statuses: [], paymentMethod: '', sellerId: '',
                    from: todayISO(), to: todayISO(),
                    minValue: '', maxValue: '', search: '',
                    tracking: '', src: '', dateField: 'createdAt',
                  }
                  setDraft(def)
                  setApplied(def)
                  setPage(1)
                }}
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
