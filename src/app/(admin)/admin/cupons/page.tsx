'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minOrderValue: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

const emptyForm = {
  code: '',
  type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  value: 10,
  minOrderValue: 0,
  maxUses: '',
  expiresAt: '',
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const data = await fetch('/api/cupons').then((r) => r.json())
    setCoupons(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Cupom criado!')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao criar cupom')
    }
  }

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/cupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    })
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
    )
    toast.success(coupon.isActive ? 'Cupom desativado' : 'Cupom ativado')
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir cupom?')) return
    await fetch(`/api/cupons/${id}`, { method: 'DELETE' })
    setCoupons((prev) => prev.filter((c) => c.id !== id))
    toast.success('Cupom excluído')
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500 text-sm'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Cupons</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
        >
          <Plus size={16} /> Novo cupom
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-6 space-y-4"
        >
          <h2 className="text-white font-semibold">Novo cupom</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Código</label>
              <input
                className={inputClass}
                placeholder="EX: PROMO10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
              >
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {form.type === 'PERCENTAGE' ? 'Desconto (%)' : 'Desconto (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor mínimo do pedido (R$)</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Uso máximo (vazio = ilimitado)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Ex: 100"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expira em (opcional)</label>
              <input
                type="date"
                className={inputClass}
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg border border-purple-900/50 text-gray-400 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg gradient-brand text-white font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar cupom'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-16 text-center">
          <Tag size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-gray-400">Nenhum cupom cadastrado.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-purple-400 hover:underline text-sm"
          >
            Criar primeiro cupom
          </button>
        </div>
      ) : (
        <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-purple-900/20">
                  <th className="text-left p-4">Código</th>
                  <th className="text-left p-4">Desconto</th>
                  <th className="text-left p-4">Mín. pedido</th>
                  <th className="text-left p-4">Usos</th>
                  <th className="text-left p-4">Expira</th>
                  <th className="text-left p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-purple-900/10 hover:bg-purple-900/10">
                    <td className="p-4">
                      <span className="font-mono bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded text-xs">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="p-4 text-white">
                      {coupon.type === 'PERCENTAGE'
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </td>
                    <td className="p-4 text-gray-400">
                      {coupon.minOrderValue > 0 ? formatCurrency(coupon.minOrderValue) : '—'}
                    </td>
                    <td className="p-4 text-gray-400">
                      {coupon.usedCount}
                      {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="p-4 text-gray-400">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt, 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          coupon.isActive
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => toggleActive(coupon)}
                          className="text-gray-400 hover:text-purple-400 transition"
                          title={coupon.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {coupon.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
