'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

interface Seller {
  id: string
  name: string
  email: string | null
  phone: string | null
  commissionRate: number
  isActive: boolean
}

export default function EditarVendedorPage() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Seller | null>(null)
  const [saving, setSaving] = useState(false)

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-input-bg,#0f0a1e)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500'

  useEffect(() => {
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then((list: Seller[]) => setForm(list.find((s) => s.id === id) ?? null))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    const res = await fetch('/api/vendedores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) toast.success('Vendedor atualizado!')
    else toast.error('Erro ao salvar')
  }

  if (!form) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/admin/vendedores" className="text-sm text-purple-400 hover:underline">← Voltar</Link>
      <h1 className="text-2xl font-bold text-[var(--admin-text)]">Editar vendedor</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6">
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Nome</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Email</label>
          <input type="email" className={inputClass} value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Telefone</label>
          <input className={inputClass} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Comissão (%)</label>
          <input type="number" className={inputClass} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--admin-text)]">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Ativo
        </label>
        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
