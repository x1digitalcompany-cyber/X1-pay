'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Banknote, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

interface Seller {
  id: string
  name: string
}

interface Withdrawal {
  id: string
  sellerId: string
  amount: number
  status: string
  notes: string | null
  createdAt: string
  seller: Seller
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  REJECTED: 'Rejeitado',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-900/30 text-yellow-400',
  PAID: 'bg-green-900/30 text-green-400',
  REJECTED: 'bg-red-900/30 text-red-400',
}

export default function SaquesPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ sellerId: '', amount: '', notes: '' })

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  const load = useCallback(async () => {
    setLoading(true)
    const [wData, sData] = await Promise.all([
      fetch('/api/saques').then((r) => r.json()),
      fetch('/api/vendedores').then((r) => r.json()),
    ])
    setWithdrawals(wData)
    setSellers(sData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const pending = withdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((s, w) => s + w.amount, 0)
    const paidMonth = withdrawals
      .filter((w) => w.status === 'PAID' && new Date(w.createdAt) >= monthStart)
      .reduce((s, w) => s + w.amount, 0)
    return { pending, paidMonth }
  }, [withdrawals])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sellerId || !form.amount) {
      toast.error('Preencha vendedor e valor')
      return
    }
    setSaving(true)
    const res = await fetch('/api/saques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: form.sellerId,
        amount: Number(form.amount),
        notes: form.notes || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Saque registrado!')
      setForm({ sellerId: '', amount: '', notes: '' })
      setShowModal(false)
      load()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao registrar saque')
    }
  }

  async function updateStatus(id: string, status: 'PAID' | 'REJECTED') {
    const res = await fetch(`/api/saques/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setWithdrawals((prev) => prev.map((w) => (w.id === id ? updated : w)))
      toast.success(status === 'PAID' ? 'Saque marcado como pago' : 'Saque rejeitado')
    } else {
      toast.error('Erro ao atualizar saque')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Saques</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium w-fit"
        >
          <Plus size={16} /> Novo saque
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[var(--admin-muted)] text-sm">Pendentes</span>
            <Clock size={18} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-[var(--admin-text)]">{formatCurrency(summary.pending)}</p>
        </div>
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[var(--admin-muted)] text-sm">Pagos no mês</span>
            <Banknote size={18} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-[var(--admin-text)]">{formatCurrency(summary.paidMonth)}</p>
        </div>
      </div>

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
                  <th className="text-left p-4">Vendedor</th>
                  <th className="text-left p-4">Valor</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Observações</th>
                  <th className="text-left p-4">Data</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10">
                    <td className="p-4 text-[var(--admin-text)]">{w.seller.name}</td>
                    <td className="p-4 text-[var(--admin-text)] font-medium">{formatCurrency(w.amount)}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          statusColors[w.status] || 'bg-gray-800 text-gray-400'
                        )}
                      >
                        {statusLabels[w.status] || w.status}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--admin-muted)] max-w-[200px] truncate">
                      {w.notes || '—'}
                    </td>
                    <td className="p-4 text-[var(--admin-muted)] whitespace-nowrap">
                      {formatDate(w.createdAt)}
                    </td>
                    <td className="p-4">
                      {w.status === 'PENDING' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => updateStatus(w.id, 'PAID')}
                            className="flex items-center gap-1 text-xs text-green-400 hover:underline"
                          >
                            <CheckCircle size={14} /> Pago
                          </button>
                          <button
                            onClick={() => updateStatus(w.id, 'REJECTED')}
                            className="flex items-center gap-1 text-xs text-red-400 hover:underline"
                          >
                            <XCircle size={14} /> Rejeitar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[var(--admin-muted)]">
                      Nenhum saque registrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--admin-text)]">Registrar saque</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--admin-muted)] mb-1">Vendedor</label>
                <select
                  className={inputClass}
                  value={form.sellerId}
                  onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
