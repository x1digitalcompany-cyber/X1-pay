'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovoVendedorPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', commissionRate: 10 })

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-input-bg,#0f0a1e)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/vendedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        commission: form.commissionRate,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Vendedor criado!')
      router.push('/admin/vendedores')
    } else {
      toast.error('Erro ao criar vendedor')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/admin/vendedores" className="text-sm text-purple-400 hover:underline">← Voltar</Link>
      <h1 className="text-2xl font-bold text-[var(--admin-text)]">Novo vendedor</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6">
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Nome</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Email</label>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Telefone</label>
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Comissão (%)</label>
          <input type="number" className={inputClass} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} />
        </div>
        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Cadastrar vendedor'}
        </button>
      </form>
    </div>
  )
}
