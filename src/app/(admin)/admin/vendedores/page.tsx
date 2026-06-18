'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Trophy, Users } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface Seller {
  id: string
  name: string
  email: string | null
  phone: string | null
  commissionRate: number
  isActive: boolean
  totalSales: number
  orderCount: number
  commissionEarned: number
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${months[Number(m) - 1]} de ${y}`
}

export default function VendedoresPage() {
  const searchParams = useSearchParams()
  const period = searchParams.get('p') === 'dia' ? 'dia' : 'mes'
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ period, month })
    const data = await fetch(`/api/vendedores?${params}`).then((r) => r.json())
    setSellers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [period, month])

  useEffect(() => {
    load()
  }, [load])

  function shiftMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const top3 = sellers.slice(0, 3)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Vendedores</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">
            Cadastre atendentes, libere ofertas e gerencie sua equipe.
          </p>
        </div>
        <Link
          href="/admin/vendedores/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium w-fit"
        >
          <Plus size={16} /> Novo vendedor
        </Link>
      </div>

      {sellers.length === 0 && !loading ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <Users size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-text)]">Nenhum vendedor cadastrado</p>
          <p className="text-[var(--admin-muted)] text-sm mt-2">
            Cadastre seu primeiro vendedor para gerar links com SRC e comissão.
          </p>
          <Link href="/admin/vendedores/novo" className="mt-4 inline-block text-purple-400 hover:underline text-sm">
            Novo vendedor
          </Link>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                <Link
                  href="/admin/vendedores?p=mes"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm',
                    period === 'mes' ? 'bg-purple-700 text-white' : 'text-[var(--admin-muted)] border border-[var(--admin-border)]'
                  )}
                >
                  Ranking do Mês
                </Link>
                <Link
                  href="/admin/vendedores?p=dia"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm',
                    period === 'dia' ? 'bg-purple-700 text-white' : 'text-[var(--admin-muted)] border border-[var(--admin-border)]'
                  )}
                >
                  Ranking do Dia
                </Link>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)]">
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm"
                />
                <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)]">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-[var(--admin-muted)]">
              Desempenho da equipe em pagamentos aprovados · {monthLabel(month)}
            </p>

            <h3 className="font-medium text-[var(--admin-text)]">Top 3</h3>
            {top3.length === 0 ? (
              <p className="text-[var(--admin-muted)] text-sm py-6 text-center border border-dashed border-[var(--admin-border)] rounded-xl">
                Sem vendas no período selecionado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map((seller, i) => (
                  <div key={seller.id} className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={18} className={i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-orange-400'} />
                      <span className="text-[var(--admin-muted)] text-sm">#{i + 1}</span>
                    </div>
                    <p className="text-[var(--admin-text)] font-medium">{seller.name}</p>
                    <p className="text-[var(--admin-muted)] text-sm">{seller.orderCount} vendas</p>
                    <p className="text-lg font-bold text-[var(--admin-text)] mt-2">{formatCurrency(seller.totalSales)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="font-medium text-[var(--admin-text)]">Todos os vendedores</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                      <th className="text-left p-4">Nome</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Telefone</th>
                      <th className="text-left p-4">Comissão</th>
                      <th className="text-left p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller) => (
                      <tr key={seller.id} className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10">
                        <td className="p-4">
                          <Link href={`/admin/vendedores/${seller.id}`} className="text-[var(--admin-text)] hover:text-purple-400">
                            {seller.name}
                          </Link>
                        </td>
                        <td className="p-4 text-[var(--admin-muted)]">{seller.email || '—'}</td>
                        <td className="p-4 text-[var(--admin-muted)]">{seller.phone || '—'}</td>
                        <td className="p-4 text-[var(--admin-muted)]">{seller.commissionRate}%</td>
                        <td className="p-4">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', seller.isActive ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400')}>
                            {seller.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
