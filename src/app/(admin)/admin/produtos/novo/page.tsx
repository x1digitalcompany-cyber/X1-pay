'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    type: 'Cápsula',
    unitCost: 0,
    logisticsId: '',
    imageUrl: '',
    checkoutName: '',
    price: 0,
  })

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Produto criado!')
      router.push('/admin/produtos')
    } else {
      toast.error('Erro ao criar produto')
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Novo produto</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1030] rounded-xl border border-purple-900/30 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Nome do produto</label>
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria</label>
            <input className={inputClass} value={form.category} onChange={(e) => update('category', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo</label>
            <select className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option>Cápsula</option>
              <option>Pó</option>
              <option>Líquido</option>
              <option>Kit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Custo unitário (R$)</label>
            <input type="number" step="0.01" className={inputClass} value={form.unitCost} onChange={(e) => update('unitCost', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ID Logística</label>
            <input className={inputClass} value={form.logisticsId} onChange={(e) => update('logisticsId', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">URL da imagem</label>
            <input className={inputClass} value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} />
          </div>
        </div>

        <hr className="border-purple-900/30" />
        <h3 className="text-white font-medium">Checkout inicial</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome da oferta</label>
            <input className={inputClass} value={form.checkoutName} onChange={(e) => update('checkoutName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
            <input type="number" step="0.01" className={inputClass} value={form.price} onChange={(e) => update('price', Number(e.target.value))} required />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Criar produto'}
        </button>
      </form>
    </div>
  )
}
