'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  category: string | null
  type: string
  unitCost: number
  isActive: boolean
  checkouts: Array<{ id: string; name: string; slug: string; price: number; isActive: boolean }>
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium"
        >
          <Plus size={16} /> Novo produto
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      product.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {product.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {product.category} · {product.type} · Custo: {formatCurrency(product.unitCost)}
                </p>
              </div>
              <Link
                href={`/admin/produtos/${product.id}`}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Editar
              </Link>
            </div>

            {product.checkouts.length > 0 && (
              <div className="mt-4 space-y-2">
                {product.checkouts.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="flex items-center justify-between bg-[#0f0a1e] rounded-lg px-4 py-2"
                  >
                    <div>
                      <span className="text-white text-sm">{checkout.name}</span>
                      <span className="text-purple-400 text-sm ml-3">
                        {formatCurrency(checkout.price)}
                      </span>
                    </div>
                    <a
                      href={`/checkout/${checkout.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"
                    >
                      <ExternalLink size={12} /> /{checkout.slug}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            Nenhum produto cadastrado.{' '}
            <Link href="/admin/produtos/novo" className="text-purple-400 hover:underline">
              Criar primeiro produto
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
