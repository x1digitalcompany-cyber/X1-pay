'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

interface OrderOption {
  id: string
  customerName: string
  offerName: string
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

export default function PagamentosLogisticaPage() {
  const [payments, setPayments] = useState<LogisticPayment[]>([])
  const [orders, setOrders] = useState<OrderOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    orderId: '',
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  const load = useCallback(async () => {
    setLoading(true)
    const [paymentsData, ordersData] = await Promise.all([
      fetch('/api/logistic-payments').then((r) => r.json()),
      fetch('/api/pedidos?status=PAID,CONFIRMED').then((r) => r.json()),
    ])
    setPayments(paymentsData)
    setOrders(
      ordersData.map((o: { id: string; customerName: string; offerName: string }) => ({
        id: o.id,
        customerName: o.customerName,
        offerName: o.offerName,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
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
      setForm({
        orderId: '',
        amount: '',
        paidAt: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setShowModal(false)
      load()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao registrar pagamento')
    }
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Pagamentos à logística</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">
            Registre pagamentos realizados à operadora logística
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium w-fit"
        >
          <Plus size={16} /> Registrar pagamento
        </button>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--admin-muted)] text-sm">Total registrado</span>
          <Truck size={18} className="text-purple-400" />
        </div>
        <p className="text-2xl font-bold text-[var(--admin-text)]">{formatCurrency(totalPaid)}</p>
        <p className="text-xs text-[var(--admin-muted)] mt-1">{payments.length} pagamentos</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <Truck size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-muted)]">Nenhum pagamento registrado.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-purple-400 hover:underline text-sm"
          >
            Registrar primeiro pagamento
          </button>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Pedido</th>
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Oferta</th>
                  <th className="text-right p-4">Valor</th>
                  <th className="text-left p-4">Data pagamento</th>
                  <th className="text-left p-4">Observações</th>
                  <th className="text-left p-4">Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                  >
                    <td className="p-4 text-[var(--admin-muted)] font-mono text-xs">
                      {payment.orderId.slice(-8)}
                    </td>
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
                    <td className="p-4 text-[var(--admin-muted)] whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Registrar pagamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Pedido</label>
                <select
                  className={inputClass}
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {orders.map((o) => (
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
