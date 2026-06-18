'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag } from 'lucide-react'
import { cn, formatDate, maskPhone } from '@/lib/utils'

interface AbandonedCart {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  src: string | null
  checkoutSlug: string
  checkoutName: string | null
  productName: string | null
  updatedAt: string
  createdAt: string
  converted: boolean
}

type QuickFilter = 'today' | '7d' | '30d' | 'all'

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'all', label: 'Todos' },
]

function getDateRange(quick: QuickFilter): { from: string; to: string } | null {
  const today = new Date().toISOString().split('T')[0]
  if (quick === 'today') return { from: today, to: today }
  if (quick === '7d') {
    const d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    return { from: d, to: today }
  }
  if (quick === '30d') {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
    return { from: d, to: today }
  }
  return null
}

export default function CarrinhoAbandonadoPage() {
  const router = useRouter()
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const range = getDateRange(quickFilter)
    if (range) {
      params.set('from', range.from)
      params.set('to', range.to)
    }
    setLoading(true)
    fetch(`/api/carrinho-abandonado?${params}`)
      .then((r) => r.json())
      .then(setCarts)
      .finally(() => setLoading(false))
  }, [search, quickFilter])

  function displayEmail(email: string | null) {
    if (!email || email.startsWith('no-email-')) return '—'
    return email
  }

  const total = carts.length
  const converted = carts.filter((c) => c.converted).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Carrinho abandonado</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">
            {total} lead{total !== 1 ? 's' : ''} · {converted} convertido{converted !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Quick date filters */}
        <div className="flex gap-1 bg-[var(--admin-panel-bg)] rounded-lg border border-[var(--admin-border)] p-1">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setQuickFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition',
                quickFilter === f.key
                  ? 'bg-purple-700 text-white'
                  : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm focus:outline-none focus:border-purple-500"
            placeholder="Buscar nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-muted)]">
            {search ? 'Nenhum carrinho encontrado.' : 'Nenhum carrinho abandonado no período.'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Nome</th>
                  <th className="text-left p-4">Telefone</th>
                  <th className="text-left p-4">Produto / Oferta</th>
                  <th className="text-left p-4">Origem</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4 whitespace-nowrap">Última atualização</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr
                    key={cart.id}
                    onClick={() => router.push(`/admin/carrinho-abandonado/${cart.id}`)}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10 cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="text-[var(--admin-text)] font-medium">{cart.name || '—'}</p>
                      <p className="text-[var(--admin-muted)] text-xs mt-0.5">{displayEmail(cart.email)}</p>
                    </td>
                    <td className="p-4 text-[var(--admin-muted)]">
                      {cart.phone ? maskPhone(cart.phone) : '—'}
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--admin-text)]">{cart.productName || '—'}</p>
                      <p className="text-[var(--admin-muted)] text-xs mt-0.5">
                        {cart.checkoutName || cart.checkoutSlug}
                      </p>
                    </td>
                    <td className="p-4 text-[var(--admin-muted)] text-xs">
                      {cart.src || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          cart.converted
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        )}
                      >
                        {cart.converted ? 'Convertido' : 'Abandonado'}
                      </span>
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
