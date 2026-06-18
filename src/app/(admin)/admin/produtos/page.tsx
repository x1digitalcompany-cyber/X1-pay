'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Copy, Trash2, Power, Package } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Checkout {
  id: string
  name: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  category: string | null
  imageUrl: string | null
  isActive: boolean
  checkouts: Checkout[]
}

export default function ProdutosPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(product: Product) {
    const res = await fetch(`/api/produtos/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, isActive: !product.isActive }),
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
    if (!confirm(`Excluir o produto "${name}"?`)) return
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
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Produtos</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">Gerencie seu catálogo de produtos.</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium w-fit"
        >
          <Plus size={16} /> Novo produto
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <Package size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-muted)]">Nenhum produto cadastrado.</p>
          <Link href="/admin/produtos/novo" className="mt-3 inline-block text-purple-400 hover:underline text-sm">
            Criar primeiro produto
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)] uppercase text-xs tracking-wide">
                  <th className="text-left p-4">Produto</th>
                  <th className="text-left p-4">Categoria</th>
                  <th className="text-left p-4">Kits</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
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
                        <span className="text-[var(--admin-text)] font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[var(--admin-muted)]">{product.category || '—'}</td>
                    <td className="p-4 text-[var(--admin-muted)]">{product.checkouts.length}</td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          product.isActive
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        )}
                      >
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </span>
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
                          type="button"
                          onClick={() => toggleActive(product)}
                          className="p-1.5 text-[var(--admin-muted)] hover:text-yellow-400 transition"
                          title={product.isActive ? 'Desativar' : 'Ativar'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(product.id)}
                          disabled={duplicating === product.id}
                          className="p-1.5 text-[var(--admin-muted)] hover:text-blue-400 transition disabled:opacity-50"
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-[var(--admin-muted)] hover:text-red-400 transition"
                          title="Excluir"
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
