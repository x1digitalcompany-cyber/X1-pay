'use client'
import { useEffect, useState } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { formatDate, maskPhone } from '@/lib/utils'

interface AbandonedCart {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  checkoutSlug: string
  checkoutName?: string
  productName?: string
  updatedAt: string
  createdAt: string
}

export default function CarrinhoAbandonadoPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    setLoading(true)
    fetch(`/api/carrinho-abandonado?${params}`)
      .then((r) => r.json())
      .then(setCarts)
      .finally(() => setLoading(false))
  }, [search])

  function displayEmail(email: string | null) {
    if (!email || email.startsWith('no-email-')) return '—'
    return email
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Carrinho abandonado</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Leads que iniciaram o checkout mas não concluíram a compra
        </p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-muted)]">
            {search ? 'Nenhum carrinho encontrado.' : 'Nenhum carrinho abandonado registrado.'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Nome</th>
                  <th className="text-left p-4">E-mail</th>
                  <th className="text-left p-4">Telefone</th>
                  <th className="text-left p-4">Produto / Oferta</th>
                  <th className="text-left p-4">Última atualização</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr
                    key={cart.id}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                  >
                    <td className="p-4 text-[var(--admin-text)]">{cart.name || '—'}</td>
                    <td className="p-4 text-[var(--admin-muted)]">{displayEmail(cart.email)}</td>
                    <td className="p-4 text-[var(--admin-muted)]">
                      {cart.phone ? maskPhone(cart.phone) : '—'}
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--admin-text)]">{cart.productName || '—'}</p>
                      <p className="text-[var(--admin-muted)] text-xs mt-0.5">
                        {cart.checkoutName || cart.checkoutSlug}
                      </p>
                    </td>
                    <td className="p-4 text-[var(--admin-muted)] whitespace-nowrap">
                      {formatDate(cart.updatedAt)}
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
