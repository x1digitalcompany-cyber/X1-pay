'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

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
  category: string | null
  type: string
  unitCost: number
  imageUrl: string | null
  isActive: boolean
  checkouts: Checkout[]
}

export default function ProdutosPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category?.toLowerCase().includes(q) ?? false) ||
        p.type.toLowerCase().includes(q)
    )
  }, [products, search])

  async function toggleActive(product: Product) {
    const res = await fetch(`/api/produtos/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      )
      toast.success(product.isActive ? 'Produto desativado' : 'Produto ativado')
    } else {
      toast.error('Erro ao atualizar status')
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    const res = await fetch(`/api/produtos/${id}/duplicate`, { method: 'POST' })
    setDuplicating(null)
    if (res.ok) {
      const product = await res.json()
      toast.success('Produto duplicado!')
      router.push(`/admin/produtos/${product.id}`)
    } else {
      toast.error('Erro ao duplicar produto')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o produto "${name}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/produtos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Produto excluído')
    } else {
      toast.error('Erro ao excluir produto')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium w-fit"
        >
          <Plus size={16} /> Novo produto
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <Package size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-muted)]">
            {search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
          </p>
          {!search && (
            <Link href="/admin/produtos/novo" className="mt-3 inline-block text-purple-400 hover:underline text-sm">
              Criar primeiro produto
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4 w-16"></th>
                  <th className="text-left p-4">Produto</th>
                  <th className="text-left p-4">Custo unit.</th>
                  <th className="text-left p-4">Checkouts ativos</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const activeCheckouts = product.checkouts.filter((c) => c.isActive).length
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                    >
                      <td className="p-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--admin-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] flex items-center justify-center">
                            <Package size={16} className="text-[var(--admin-muted)]" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-[var(--admin-text)] font-medium">{product.name}</p>
                        <p className="text-[var(--admin-muted)] text-xs mt-0.5">
                          {[product.category, product.type].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </td>
                      <td className="p-4 text-[var(--admin-text)]">{formatCurrency(product.unitCost)}</td>
                      <td className="p-4 text-[var(--admin-muted)]">
                        {activeCheckouts} / {product.checkouts.length}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleActive(product)}
                          className="flex items-center gap-2 text-[var(--admin-muted)] hover:text-purple-400 transition"
                          title={product.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {product.isActive ? (
                            <>
                              <ToggleRight size={20} className="text-green-400" />
                              <span className="text-xs text-green-400">Ativo</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={20} />
                              <span className="text-xs">Inativo</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/admin/produtos/${product.id}`}
                            className="p-1.5 text-[var(--admin-muted)] hover:text-purple-400 transition"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(product.id)}
                            disabled={duplicating === product.id}
                            className="p-1.5 text-[var(--admin-muted)] hover:text-blue-400 transition disabled:opacity-50"
                            title="Duplicar"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-[var(--admin-muted)] hover:text-red-400 transition"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
