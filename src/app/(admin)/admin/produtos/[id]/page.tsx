'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ExternalLink, Copy, Trash2, Package, Loader2, X, Pencil } from 'lucide-react'
import { formatCurrency, generateSlug } from '@/lib/utils'

interface Checkout {
  id: string
  name: string
  slug: string
  price: number
  isActive: boolean
}

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
  checkouts: Checkout[]
}

export default function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'config' | 'checkouts'>('config')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<Product | null>(null)
  const [kitModal, setKitModal] = useState(false)
  const [kitForm, setKitForm] = useState({ name: '', slug: '', price: 0 })

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
      const updated = await res.json()
      setForm(updated)
    } else {
      toast.error('Erro ao salvar')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Apenas imagens (jpg, png, webp)')
    if (file.size > 2 * 1024 * 1024) return toast.error('Máximo 2MB')

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      update('imageUrl', url)
      toast.success('Imagem enviada!')
    } else {
      toast.error('Erro no upload')
    }
  }

  function openKitModal() {
    setKitForm({ name: '', slug: '', price: 0 })
    setKitModal(true)
  }

  function addKit() {
    if (!form || !kitForm.name) return toast.error('Nome obrigatório')
    const checkouts = [
      ...form.checkouts,
      {
        id: '',
        name: kitForm.name,
        slug: kitForm.slug || generateSlug(kitForm.name),
        price: kitForm.price,
        isActive: true,
      },
    ]
    setForm({ ...form, checkouts })
    setKitModal(false)
    toast.success('Kit adicionado — salve para confirmar')
  }

  async function removeCheckout(checkoutId: string) {
    if (!confirm('Remover este checkout?')) return
    if (!checkoutId) {
      // Kit ainda não salvo — remove apenas do estado local
      setForm((prev) =>
        prev ? { ...prev, checkouts: prev.checkouts.filter((c) => c.id !== checkoutId) } : prev
      )
      return
    }
    const res = await fetch(`/api/checkouts/${checkoutId}`, { method: 'DELETE' })
    if (res.ok) {
      setForm((prev) =>
        prev ? { ...prev, checkouts: prev.checkouts.filter((c) => c.id !== checkoutId) } : prev
      )
      toast.success('Checkout removido')
    } else {
      toast.error('Erro ao remover checkout')
    }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/checkout/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-input-bg,#0f0a1e)] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Editar produto</h1>

      <div className="flex gap-2 border-b border-purple-900/30 pb-2">
        {(['config', 'checkouts'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              activeTab === t ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'config' ? 'Configuração' : 'Checkouts / Kits'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
        {activeTab === 'config' && (
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
              <label className="block text-sm text-gray-400 mb-1">Custo unitário (R$)</label>
              <input type="number" step="0.01" className={inputClass} value={form.unitCost} onChange={(e) => update('unitCost', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID Logística</label>
              <input className={inputClass} value={form.logisticsId || ''} onChange={(e) => update('logisticsId', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Imagem do produto</label>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-[#0f0a1e] border border-purple-900/30 flex items-center justify-center overflow-hidden shrink-0">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={28} className="text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploading} className="text-sm text-gray-400" />
                  {uploading && <p className="text-xs text-purple-400 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Enviando...</p>}
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG ou WebP — máx. 2MB</p>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
              <label htmlFor="isActive" className="text-sm text-gray-300">Produto ativo</label>
            </div>
          </div>
        )}

        {activeTab === 'checkouts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">Cada kit gera um link de checkout próprio.</p>
              <button type="button" onClick={openKitModal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 text-white text-sm">
                + Novo kit
              </button>
            </div>

            {form.checkouts.map((checkout) => (
              <div key={checkout.id}
                className="bg-[#0f0a1e] rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium truncate">{checkout.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      checkout.isActive ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {checkout.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">/checkout/{checkout.slug}</p>
                  <p className="text-sm text-purple-300 mt-0.5">{formatCurrency(checkout.price)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => copyLink(checkout.slug)}
                    className="p-2 text-gray-400 hover:text-purple-400 transition" title="Copiar link">
                    <Copy size={16} />
                  </button>
                  <a href={`/checkout/${checkout.slug}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-purple-400 transition">
                    <ExternalLink size={16} />
                  </a>
                  {checkout.id && (
                    <Link href={`/admin/produtos/${id}/checkouts/${checkout.id}`}
                      className="p-2 text-gray-400 hover:text-purple-400 transition" title="Editar oferta">
                      <Pencil size={16} />
                    </Link>
                  )}
                  <button type="button" onClick={() => removeCheckout(checkout.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {form.checkouts.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum checkout — crie um kit</p>
            )}
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {kitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Novo kit</h3>
              <button type="button" onClick={() => setKitModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                className={inputClass}
                value={kitForm.name}
                onChange={(e) => setKitForm({ ...kitForm, name: e.target.value, slug: generateSlug(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slug</label>
              <input className={inputClass} value={kitForm.slug} onChange={(e) => setKitForm({ ...kitForm, slug: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" className={inputClass} value={kitForm.price} onChange={(e) => setKitForm({ ...kitForm, price: Number(e.target.value) })} />
            </div>
            <button type="button" onClick={addKit} className="w-full py-2 rounded-lg gradient-brand text-white text-sm">Adicionar kit</button>
          </div>
        </div>
      )}
    </div>
  )
}
