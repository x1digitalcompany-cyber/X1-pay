'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  type: string
  unitCost: number
  logisticsId: string | null
  imageUrl: string | null
  isActive: boolean
  checkouts: Array<{ id: string; name: string; slug: string; price: number; isActive: boolean }>
}

export default function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Product | null>(null)
  const [newCheckout, setNewCheckout] = useState({ name: '', price: 0 })

  useEffect(() => {
    fetch(`/api/produtos/${id}`)
      .then((r) => r.json())
      .then(setForm)
      .finally(() => setLoading(false))
  }, [id])

  function update(field: string, value: unknown) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    const res = await fetch(`/api/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Produto atualizado!')
      router.push('/admin/produtos')
    } else {
      toast.error('Erro ao salvar')
    }
  }

  async function addCheckout() {
    if (!form || !newCheckout.name) return
    const checkouts = [
      ...form.checkouts,
      { id: '', name: newCheckout.name, slug: '', price: newCheckout.price, isActive: true },
    ]
    setForm({ ...form, checkouts })
    setNewCheckout({ name: '', price: 0 })
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Editar produto</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1030] rounded-xl border border-purple-900/30 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea className={inputClass} rows={3} value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria</label>
            <input className={inputClass} value={form.category || ''} onChange={(e) => update('category', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo</label>
            <input className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Custo unitário</label>
            <input type="number" step="0.01" className={inputClass} value={form.unitCost} onChange={(e) => update('unitCost', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ID Logística</label>
            <input className={inputClass} value={form.logisticsId || ''} onChange={(e) => update('logisticsId', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">URL da imagem</label>
            <input className={inputClass} value={form.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
            <label htmlFor="isActive" className="text-sm text-gray-300">Produto ativo</label>
          </div>
        </div>

        <hr className="border-purple-900/30" />
        <h3 className="text-white font-medium">Checkouts</h3>

        {form.checkouts.map((checkout, i) => (
          <div key={checkout.id || i} className="bg-[#0f0a1e] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <input
                className={inputClass}
                value={checkout.name}
                onChange={(e) => {
                  const checkouts = [...form.checkouts]
                  checkouts[i] = { ...checkout, name: e.target.value }
                  update('checkouts', checkouts)
                }}
              />
              {checkout.slug && (
                <a href={`/checkout/${checkout.slug}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 ml-2">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={checkout.price}
              onChange={(e) => {
                const checkouts = [...form.checkouts]
                checkouts[i] = { ...checkout, price: Number(e.target.value) }
                update('checkouts', checkouts)
              }}
            />
            <p className="text-xs text-gray-500">{formatCurrency(checkout.price)}</p>
          </div>
        ))}

        <div className="flex gap-2">
          <input className={inputClass} placeholder="Nome da oferta" value={newCheckout.name} onChange={(e) => setNewCheckout({ ...newCheckout, name: e.target.value })} />
          <input type="number" className={`${inputClass} w-32`} placeholder="Preço" value={newCheckout.price} onChange={(e) => setNewCheckout({ ...newCheckout, price: Number(e.target.value) })} />
          <button type="button" onClick={addCheckout} className="px-4 py-2 rounded-lg bg-purple-900/50 text-white text-sm whitespace-nowrap">
            + Oferta
          </button>
        </div>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
