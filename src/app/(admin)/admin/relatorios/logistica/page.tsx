'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Package, Truck, Droplets, Pill } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

interface OrderRow {
  id: string
  productName: string | null
  productType: string | null
  logisticsCost: number
  value: number
}

interface LogisticPayment {
  id: string
  orderId: string
  amount: number
  paidAt: string | null
  notes: string | null
  createdAt: string
  order: {
    id: string
    customerName: string
    offerName: string
  }
}

interface OrderOption {
  id: string
  customerName: string
  offerName: string
}

const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const toISO = (d: Date) => d.toISOString().split('T')[0]

function isGotas(type: string | null) {
  return (type ?? '').toLowerCase().includes('got')
}

export default function RelatorioLogisticaPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [payments, setPayments] = useState<LogisticPayment[]>([])
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(toISO(firstOfMonth))
  const [to, setTo] = useState(toISO(today))
  const [appliedFrom, setAppliedFrom] = useState(toISO(firstOfMonth))
  const [appliedTo, setAppliedTo] = useState(toISO(today))
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    orderId: '',
    amount: '',
    paidAt: toISO(today),
    notes: '',
  })

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ from: appliedFrom, to: appliedTo })
    const [logistica, paymentsData, ordersData] = await Promise.all([
      fetch(`/api/acerto-logistica?${params}`).then((r) => r.json()),
      fetch('/api/logistic-payments').then((r) => r.json()),
      fetch('/api/pedidos?status=PAID,CONFIRMED').then((r) => r.json()),
    ])
    setOrders(logistica.orders ?? [])
    setPayments(Array.isArray(paymentsData) ? paymentsData : [])
    setOrderOptions(
      (Array.isArray(ordersData) ? ordersData : []).map(
        (o: { id: string; customerName: string; offerName: string }) => ({
          id: o.id,
          customerName: o.customerName,
          offerName: o.offerName,
        })
      )
    )
    setLoading(false)
  }, [appliedFrom, appliedTo])

  useEffect(() => {
    load()
  }, [load])

  const metrics = useMemo(() => {
    let capsulesUnits = 0
    let capsulesCost = 0
    let gotasUnits = 0
    let gotasCost = 0
    const byProduct: Record<string, { name: string; units: number; cost: number }> = {}

    for (const o of orders) {
      const cost = o.logisticsCost ?? 0
      if (isGotas(o.productType)) {
        gotasUnits += 1
        gotasCost += cost
      } else {
        capsulesUnits += 1
        capsulesCost += cost
      }

      const name = o.productName || 'Sem produto'
      if (!byProduct[name]) byProduct[name] = { name, units: 0, cost: 0 }
      byProduct[name].units += 1
      byProduct[name].cost += cost
    }

    const produtosTotal = capsulesCost + gotasCost
    const freteTotal = 0
    const totalLogistica = produtosTotal + freteTotal

    return {
      vendas: orders.length,
      capsulesUnits,
      capsulesCost,
      gotasUnits,
      gotasCost,
      freteTotal,
      produtosTotal,
      totalLogistica,
      byProduct: Object.values(byProduct).sort((a, b) => b.units - a.units),
    }
  }, [orders])

  function applyFilters() {
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!form.orderId || !form.amount) {
      toast.error('Preencha pedido e valor')
      return
    }
    setSaving(true)
    const res = await fetch('/api/logistic-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: form.orderId,
        amount: Number(form.amount),
        paidAt: form.paidAt || null,
        notes: form.notes || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Pagamento registrado!')
      setForm({ orderId: '', amount: '', paidAt: toISO(today), notes: '' })
      setShowModal(false)
      load()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao registrar pagamento')
    }
  }

  const exportHref = `/api/admin/relatorios/logistica/export?de=${appliedFrom}&ate=${appliedTo}`

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Acerto logística</h1>
        <a
          href={exportHref}
          className="text-sm text-purple-400 hover:underline whitespace-nowrap"
        >
          Exportar planilha
        </a>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-[var(--admin-muted)] mb-1">De</label>
          <input
            type="date"
            className="px-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--admin-muted)] mb-1">Até</label>
          <input
            type="date"
            className="px-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
        >
          Aplicar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--admin-muted)] text-xs">Vendas no período</span>
                <Package size={16} className="text-blue-400" />
              </div>
              <p className="text-xl font-bold text-[var(--admin-text)]">{metrics.vendas}</p>
            </div>
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--admin-muted)] text-xs">Total de cápsulas</span>
                <Pill size={16} className="text-purple-400" />
              </div>
              <p className="text-xl font-bold text-[var(--admin-text)]">{metrics.capsulesUnits} un</p>
              <p className="text-sm text-[var(--admin-muted)] mt-1">{formatCurrency(metrics.capsulesCost)}</p>
            </div>
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--admin-muted)] text-xs">Total de gotas</span>
                <Droplets size={16} className="text-cyan-400" />
              </div>
              <p className="text-xl font-bold text-[var(--admin-text)]">{metrics.gotasUnits} un</p>
              <p className="text-sm text-[var(--admin-muted)] mt-1">{formatCurrency(metrics.gotasCost)}</p>
            </div>
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--admin-muted)] text-xs">Frete total</span>
                <Truck size={16} className="text-orange-400" />
              </div>
              <p className="text-xl font-bold text-[var(--admin-text)]">{formatCurrency(metrics.freteTotal)}</p>
            </div>
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--admin-muted)] text-xs">Total a pagar à logística</span>
                <Truck size={16} className="text-green-400" />
              </div>
              <p className="text-xl font-bold text-[var(--admin-text)]">
                {formatCurrency(metrics.totalLogistica)}
              </p>
              <p className="text-xs text-[var(--admin-muted)] mt-1">
                Produtos {formatCurrency(metrics.produtosTotal)} + Frete {formatCurrency(metrics.freteTotal)}
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Unidades por produto</h2>
            {metrics.byProduct.length === 0 ? (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-12 text-center">
                <Package size={36} className="mx-auto mb-3 text-purple-700" />
                <p className="text-[var(--admin-text)] font-medium">Nenhuma venda paga no período</p>
                <p className="text-[var(--admin-muted)] text-sm mt-2">
                  Ajuste o período ou aguarde novas vendas pagas.
                </p>
              </div>
            ) : (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                      <th className="text-left p-4">Produto</th>
                      <th className="text-right p-4">Unidades</th>
                      <th className="text-right p-4">Custo logística</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.byProduct.map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                      >
                        <td className="p-4 text-[var(--admin-text)]">{row.name}</td>
                        <td className="p-4 text-right text-[var(--admin-muted)]">{row.units}</td>
                        <td className="p-4 text-right text-[var(--admin-text)]">
                          {formatCurrency(row.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">Pagamentos à logística</h2>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm"
              >
                <Plus size={16} /> Novo pagamento
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-12 text-center">
                <Truck size={36} className="mx-auto mb-3 text-purple-700" />
                <p className="text-[var(--admin-muted)]">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                        <th className="text-left p-4">Cliente</th>
                        <th className="text-left p-4">Oferta</th>
                        <th className="text-right p-4">Valor</th>
                        <th className="text-left p-4">Data pagamento</th>
                        <th className="text-left p-4">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                        >
                          <td className="p-4 text-[var(--admin-text)]">{payment.order.customerName}</td>
                          <td className="p-4 text-[var(--admin-muted)] max-w-[160px] truncate">
                            {payment.order.offerName}
                          </td>
                          <td className="p-4 text-right text-[var(--admin-text)] font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="p-4 text-[var(--admin-muted)] whitespace-nowrap">
                            {payment.paidAt ? formatDate(payment.paidAt, 'dd/MM/yyyy') : '—'}
                          </td>
                          <td className="p-4 text-[var(--admin-muted)] max-w-[180px] truncate">
                            {payment.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Novo pagamento</h3>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Pedido</label>
                <select
                  className={inputClass}
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {orderOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.customerName} — {o.offerName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Data do pagamento</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.paidAt}
                  onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Observações (opcional)</label>
                <textarea
                  className={cn(inputClass, 'resize-none')}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium text-sm disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
