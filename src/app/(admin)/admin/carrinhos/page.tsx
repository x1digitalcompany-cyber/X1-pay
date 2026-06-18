'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, ShoppingBag } from 'lucide-react'
import { cn, formatDate, maskPhone } from '@/lib/utils'

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

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatDayLabel(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

function isToday(iso: string) {
  return iso === toISO(new Date())
}

export default function CarrinhosPage() {
  const today = toISO(new Date())
  const [filterDate, setFilterDate] = useState(today)
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ from: filterDate, to: filterDate })
    const data = await fetch(`/api/carrinho-abandonado?${params}`).then((r) => r.json())
    setCarts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filterDate])

  useEffect(() => {
    load()
  }, [load])

  const subtitle = useMemo(() => {
    if (isToday(filterDate)) {
      return `Mostrando hoje (${formatDayLabel(filterDate)}). Filtre a data para ver outros dias.`
    }
    return `Mostrando ${formatDayLabel(filterDate)}. Filtre a data para ver outros dias.`
  }, [filterDate])

  function displayEmail(email: string | null) {
    if (!email || email.startsWith('no-email-')) return '—'
    return email
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Carrinhos abandonados</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFilterDate(today)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition',
            isToday(filterDate)
              ? 'gradient-brand text-white'
              : 'bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
          )}
        >
          Hoje
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--admin-muted)]" />
          <input
            type="date"
            className="px-3 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
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
          <p className="text-[var(--admin-text)] font-medium">
            {isToday(filterDate)
              ? `Nenhum carrinho hoje (${formatDayLabel(filterDate)})`
              : `Nenhum carrinho em ${formatDayLabel(filterDate)}`}
          </p>
          <p className="text-[var(--admin-muted)] text-sm mt-2">
            Checkouts iniciados hoje aparecem aqui. Filtre a data para ver outros dias.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Nome</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Telefone</th>
                  <th className="text-left p-4">Produto/Checkout</th>
                  <th className="text-left p-4">Data</th>
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
