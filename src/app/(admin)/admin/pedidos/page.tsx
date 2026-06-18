'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  SlidersHorizontal,
  X,
  Download,
  Upload,
} from 'lucide-react'
import { cn, formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { toast } from 'sonner'

interface Order {
  id: string
  customerName: string
  offerName: string
  value: number
  netValue: number
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
  search: string
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

const EMPTY_FILTERS: Filters = {
  search: '',
  statuses: [],
  paymentMethod: '',
  sellerId: '',
  from: '',
  to: '',
  minValue: '',
  maxValue: '',
}

function buildParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
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
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm focus:outline-none focus:border-purple-500'

  const loadOrders = useCallback(async (filters: Filters) => {
    setLoading(true)
    const params = buildParams(filters)
    const data = await fetch(`/api/pedidos?${params}`).then((r) => r.json())
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOrders(applied)
  }, [applied, loadOrders])

  useEffect(() => {
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSellers(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
        }
      })
      .catch(() => {})
  }, [])

  function openDrawer() {
    setDraft({ ...applied })
    setDrawerOpen(true)
  }

  function applyFilters() {
    setApplied({ ...draft })
    setDrawerOpen(false)
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setDrawerOpen(false)
  }

  function toggleDraftStatus(status: string) {
    setDraft((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }

  function removeFilter(key: keyof Filters, value?: string) {
    setApplied((prev) => {
      const next = { ...prev }
      if (key === 'statuses' && value) {
        next.statuses = prev.statuses.filter((s) => s !== value)
      } else if (key === 'statuses') {
        next.statuses = []
      } else {
        next[key] = '' as never
      }
      return next
    })
  }

  const activeBadges = useMemo(() => {
    const badges: { key: string; label: string; onRemove: () => void }[] = []

    if (applied.search) {
      badges.push({
        key: 'search',
        label: `Busca: ${applied.search}`,
        onRemove: () => removeFilter('search'),
      })
    }
    applied.statuses.forEach((s) => {
      badges.push({
        key: `status-${s}`,
        label: getOrderStatusLabel(s),
        onRemove: () => removeFilter('statuses', s),
      })
    })
    if (applied.paymentMethod) {
      const label = PAYMENT_OPTIONS.find((p) => p.value === applied.paymentMethod)?.label ?? applied.paymentMethod
      badges.push({
        key: 'paymentMethod',
        label: `Pagamento: ${label}`,
        onRemove: () => removeFilter('paymentMethod'),
      })
    }
    if (applied.sellerId) {
      const name = sellers.find((s) => s.id === applied.sellerId)?.name ?? 'Vendedor'
      badges.push({
        key: 'sellerId',
        label: `Vendedor: ${name}`,
        onRemove: () => removeFilter('sellerId'),
      })
    }
    if (applied.from) {
      badges.push({
        key: 'from',
        label: `De: ${applied.from.split('-').reverse().join('/')}`,
        onRemove: () => removeFilter('from'),
      })
    }
    if (applied.to) {
      badges.push({
        key: 'to',
        label: `Até: ${applied.to.split('-').reverse().join('/')}`,
        onRemove: () => removeFilter('to'),
      })
    }
    if (applied.minValue) {
      badges.push({
        key: 'minValue',
        label: `Mín: ${formatCurrency(Number(applied.minValue))}`,
        onRemove: () => removeFilter('minValue'),
      })
    }
    if (applied.maxValue) {
      badges.push({
        key: 'maxValue',
        label: `Máx: ${formatCurrency(Number(applied.maxValue))}`,
        onRemove: () => removeFilter('maxValue'),
      })
    }

    return badges
  }, [applied, sellers])

  async function updateStatus(id: string, newStatus: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    toast.success('Status atualizado')
  }

  async function exportOrders() {
    setExporting(true)
    try {
      const params = buildParams(applied)
      const res = await fetch(`/api/pedidos/exportar?${params}`)
      if (!res.ok) {
        toast.error('Erro ao exportar pedidos')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pedidos.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Planilha exportada!')
    } catch {
      toast.error('Erro ao exportar pedidos')
    } finally {
      setExporting(false)
    }
  }

  async function importTracking() {
    if (!importFile) {
      toast.error('Selecione um arquivo')
      return
    }
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/pedidos/importar-rastreios', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao importar rastreios')
        return
      }
      toast.success(`${data.updated} rastreio(s) atualizado(s)`)
      if (data.notFound?.length) {
        toast.warning(`${data.notFound.length} pedido(s) não encontrado(s)`)
      }
      setImportFile(null)
      setImportOpen(false)
      loadOrders(applied)
    } catch {
      toast.error('Erro ao importar rastreios')
    } finally {
      setImporting(false)
    }
  }

  const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Pedidos</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/10 transition"
          >
            <Upload size={16} /> Importar rastreios
          </button>
          <button
            onClick={exportOrders}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50 transition"
          >
            <Download size={16} /> {exporting ? 'Exportando...' : 'Exportar'}
          </button>
          <Link
            href="/admin/pedidos/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
          >
            <Plus size={16} /> Novo pedido
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className={cn(inputClass, 'pl-10')}
            placeholder="Buscar por cliente ou oferta..."
            value={applied.search}
            onChange={(e) => setApplied((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <button
          onClick={openDrawer}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] text-sm hover:bg-purple-900/10 transition"
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeBadges.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-xs">
              {activeBadges.length}
            </span>
          )}
        </button>
      </div>

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/30 text-purple-300 text-xs border border-purple-800/40"
            >
              {badge.label}
              <button
                onClick={badge.onRemove}
                className="hover:text-white transition"
                aria-label="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)] underline"
          >
            Limpar todos
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Oferta</th>
                  <th className="text-left p-4">Valor</th>
                  <th className="text-left p-4">Líquido</th>
                  <th className="text-left p-4">Pagamento</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Data</th>
                  <th className="text-left p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10 cursor-pointer transition"
                  >
                    <td className="p-4 text-[var(--admin-text)]">{order.customerName}</td>
                    <td className="p-4 text-[var(--admin-muted)]">{order.offerName}</td>
                    <td className="p-4 text-[var(--admin-text)]">{formatCurrency(order.value)}</td>
                    <td className="p-4 text-purple-400">{formatCurrency(order.netValue)}</td>
                    <td className="p-4 text-[var(--admin-muted)]">{paymentLabels[order.paymentMethod]}</td>
                    <td className={cn('p-4', getOrderStatusColor(order.status))}>
                      {getOrderStatusLabel(order.status)}
                    </td>
                    <td className="p-4 text-[var(--admin-muted)]">{formatDate(order.createdAt)}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {order.status === 'WAITING_PAYMENT' && (
                          <button
                            onClick={(e) => updateStatus(order.id, 'PAID', e)}
                            className="text-xs text-green-400 hover:underline"
                          >
                            Marcar pago
                          </button>
                        )}
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="text-[var(--admin-muted)] hover:text-purple-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[var(--admin-muted)]">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer de filtros */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-full max-w-md h-full bg-[var(--admin-panel-bg)] border-l border-[var(--admin-border)] flex flex-col shadow-xl transition-transform duration-300">
            <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)]">
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Filtros</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <p className="text-sm font-medium text-[var(--admin-text)] mb-3">Status</p>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 cursor-pointer text-sm text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
                    >
                      <input
                        type="checkbox"
                        checked={draft.statuses.includes(opt.value)}
                        onChange={() => toggleDraftStatus(opt.value)}
                        className="rounded border-[var(--admin-border)] accent-purple-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">
                  Forma de pagamento
                </label>
                <select
                  className={inputClass}
                  value={draft.paymentMethod}
                  onChange={(e) => setDraft((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {PAYMENT_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">Vendedor</label>
                <select
                  className={inputClass}
                  value={draft.sellerId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, sellerId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">De</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={draft.from}
                    onChange={(e) => setDraft((prev) => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">Até</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={draft.to}
                    onChange={(e) => setDraft((prev) => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">Valor mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="0,00"
                    value={draft.minValue}
                    onChange={(e) => setDraft((prev) => ({ ...prev, minValue: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text)] mb-2">Valor máximo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="0,00"
                    value={draft.maxValue}
                    onChange={(e) => setDraft((prev) => ({ ...prev, maxValue: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[var(--admin-border)] flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm hover:text-[var(--admin-text)] transition"
              >
                Limpar
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-2.5 rounded-lg gradient-brand text-white text-sm font-medium"
              >
                Aplicar filtros
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Modal importar rastreios */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Importar rastreios</h2>
              <button
                onClick={() => {
                  setImportOpen(false)
                  setImportFile(null)
                }}
                className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--admin-muted)]">
              Envie uma planilha XLSX com as colunas <strong className="text-[var(--admin-text)]">ID</strong> (ou{' '}
              <strong className="text-[var(--admin-text)]">order_id</strong>) e{' '}
              <strong className="text-[var(--admin-text)]">Rastreio</strong> (ou{' '}
              <strong className="text-[var(--admin-text)]">tracking_code</strong>).
              Opcionalmente inclua <strong className="text-[var(--admin-text)]">tracking_url</strong>.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="block w-full text-sm text-[var(--admin-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-900/40 file:text-purple-300 hover:file:bg-purple-900/60"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            {importFile && (
              <p className="text-xs text-[var(--admin-muted)]">Arquivo: {importFile.name}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false)
                  setImportFile(null)
                }}
                className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={importTracking}
                disabled={importing || !importFile}
                className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium text-sm disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
