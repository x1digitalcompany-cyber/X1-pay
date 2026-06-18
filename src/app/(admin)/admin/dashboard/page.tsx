'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusColor,
  cn,
} from '@/lib/utils'
import { BarChart3 } from 'lucide-react'

interface DashboardData {
  netRevenue: number
  grossRevenue: number
  supplierCost: number
  paidOrders: number
  pendingCount: number
  conversionByMethod: Record<string, { paid: number; total: number }>
  chargebacks: number
  refunds: number
  chargebackRate: number | null
  refundRate: number | null
  netByPaymentMethod: Record<string, number>
  salesByWeekday: Array<{ weekday: string; gross: number; orders: number }>
  recentOrders: Array<{
    id: string
    customerName: string
    offerName: string
    value: number
    status: string
    createdAt: string
  }>
}

function todayLabel() {
  const d = new Date()
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [convTab, setConvTab] = useState<'CARD' | 'PIX' | 'BOLETO'>('CARD')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/dashboard?period=today')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-[var(--admin-muted)]">Erro ao carregar dashboard</p>
  }

  const conv = data.conversionByMethod[convTab] ?? { paid: 0, total: 0 }
  const convDisplay = '—'
  const convSubtext = `${conv.paid}/${conv.total} pagos`
  const chargebackDisplay = data.chargebacks === 0 ? '—' : `${data.chargebackRate?.toFixed(1)}%`
  const refundDisplay = data.refunds === 0 ? '—' : `${data.refundRate?.toFixed(1)}%`

  const hasWeekdaySales = data.salesByWeekday.some((d) => d.orders > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Dashboard</h1>
        <div className="mt-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm font-medium"
          >
            Hoje
          </button>
          <p className="text-[var(--admin-muted)] text-sm mt-2">
            Hoje ({todayLabel()}). Use o filtro para ver outros dias.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm">A receber (líquido)</p>
          <p className="text-2xl font-bold text-[var(--admin-text)] mt-1">
            {formatCurrency(data.netRevenue)}
          </p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">
            bruto {formatCurrency(data.grossRevenue)} · fornecedor {formatCurrency(data.supplierCost)}
          </p>
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm">Quantidade de vendas</p>
          <p className="text-2xl font-bold text-[var(--admin-text)] mt-1">{data.paidOrders}</p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">{data.paidOrders} vendas</p>
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm">Pagamento pendente</p>
          <p className="text-2xl font-bold text-[var(--admin-text)] mt-1">{data.pendingCount}</p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">{data.pendingCount} pedidos aguardando</p>
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm mb-2">Conversão</p>
          <div className="flex gap-1 mb-2">
            {(['CARD', 'PIX', 'BOLETO'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setConvTab(m)}
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  convTab === m ? 'bg-purple-700 text-white' : 'text-[var(--admin-muted)]'
                )}
              >
                {m === 'CARD' ? 'Cartão' : m === 'PIX' ? 'Pix' : 'Boleto'}
              </button>
            ))}
          </div>
          <p className="text-xl font-bold text-[var(--admin-text)]">{convDisplay}</p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">{convSubtext}</p>
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm">Taxa de chargeback</p>
          <p className="text-2xl font-bold text-[var(--admin-text)] mt-1">{chargebackDisplay}</p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">
            {data.chargebacks} contestação(ões)
          </p>
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <p className="text-[var(--admin-muted)] text-sm">Taxa de reembolso</p>
          <p className="text-2xl font-bold text-[var(--admin-text)] mt-1">{refundDisplay}</p>
          <p className="text-xs text-[var(--admin-muted)] mt-2">{data.refunds} reembolso(s)</p>
        </div>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
        <h2 className="font-semibold text-[var(--admin-text)]">A receber por forma de pagamento</h2>
        <p className="text-xs text-[var(--admin-muted)] mt-1 mb-4">
          Líquido (após taxas, custos e comissões) — fecha com o card do topo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'PIX', label: 'PIX' },
            { key: 'CARD', label: 'Cartão' },
            { key: 'BOLETO', label: 'Boleto' },
          ].map(({ key, label }) => (
            <div key={key} className="bg-[var(--admin-bg)] rounded-lg p-4">
              <p className="text-sm text-[var(--admin-muted)]">{label}</p>
              <p className="text-xl font-bold text-[var(--admin-text)] mt-1">
                {formatCurrency(data.netByPaymentMethod[key] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
        <h2 className="font-semibold text-[var(--admin-text)]">Vendas por dia da semana</h2>
        <p className="text-xs text-[var(--admin-muted)] mt-1 mb-4">
          Padrão dos últimos 90 dias (não muda com o filtro).
        </p>
        {hasWeekdaySales ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.salesByWeekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4c1d9533" />
              <XAxis dataKey="weekday" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a1030', border: '1px solid #4c1d95' }} />
              <Bar dataKey="orders" name="Pedidos" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <BarChart3 size={36} className="mx-auto mb-3 text-purple-800" />
            <p className="text-[var(--admin-muted)]">Sem vendas nos últimos 90 dias</p>
            <p className="text-[var(--admin-muted)] text-sm mt-1">
              As vendas concluídas aparecem aqui por dia da semana.
            </p>
          </div>
        )}
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
        <h2 className="font-semibold text-[var(--admin-text)] mb-4">Últimos pedidos</h2>
        {data.recentOrders.length === 0 ? (
          <p className="text-center text-[var(--admin-muted)] py-8">Nenhum pedido ainda</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {data.recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="flex items-center justify-between py-4 hover:bg-purple-900/10 px-2 -mx-2 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <p className="text-[var(--admin-text)] font-medium truncate">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-[var(--admin-muted)] truncate">
                      {order.offerName} · {formatDate(order.createdAt, 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-[var(--admin-text)] font-medium">
                      {formatCurrency(order.value)}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        getOrderStatusColor(order.status)
                      )}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
