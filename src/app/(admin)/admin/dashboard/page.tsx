'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '@/lib/utils'
import {
  TrendingUp,
  DollarSign,
  Clock,
  ShoppingCart,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Period = 'today' | '7d' | '30d' | 'custom'

interface DashboardData {
  grossRevenue: number
  netRevenue: number
  pendingRevenue: number
  totalOrders: number
  paidOrders: number
  conversionRate: number
  chargebacks: number
  refunds: number
  byPaymentMethod: Record<string, { count: number; amount: number; net: number }>
  salesByDay: Array<{ date: string; gross: number; net: number; orders: number }>
  salesByWeekday: Array<{ weekday: string; gross: number; orders: number }>
  recentOrders: Array<{
    id: string
    customerName: string
    offerName: string
    value: number
    status: string
    createdAt: string
  }>
  monthlyGoal: number
  monthlyNet: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [paymentTab, setPaymentTab] = useState<'amount' | 'percent'>('amount')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ period })
    if (period === 'custom' && customFrom && customTo) {
      params.set('from', customFrom)
      params.set('to', customTo)
    }
    const res = await fetch(`/api/dashboard?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [period, customFrom, customTo])

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

  const goalPct =
    data.monthlyGoal > 0 ? Math.min(100, (data.monthlyNet / data.monthlyGoal) * 100) : 0
  const goalColor =
    goalPct >= 100 ? 'bg-green-500' : goalPct >= 70 ? 'bg-yellow-500' : 'bg-red-500'

  const paymentTotal = Object.values(data.byPaymentMethod).reduce((s, p) => s + p.amount, 0)

  const cards = [
    {
      label: 'Faturamento Bruto',
      value: formatCurrency(data.grossRevenue),
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Faturamento Líquido',
      value: formatCurrency(data.netRevenue),
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'A Receber (Pendente)',
      value: formatCurrency(data.pendingRevenue),
      icon: Clock,
      color: 'text-yellow-400',
    },
    {
      label: 'Total de Pedidos',
      value: String(data.totalOrders),
      icon: ShoppingCart,
      color: 'text-blue-400',
    },
    {
      label: 'Chargebacks',
      value: String(data.chargebacks),
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      label: 'Reembolsos',
      value: String(data.refunds),
      icon: RotateCcw,
      color: 'text-orange-400',
    },
  ]

  const paymentMethods = [
    { key: 'PIX', label: 'PIX', color: 'bg-purple-500' },
    { key: 'CARD', label: 'Cartão', color: 'bg-violet-500' },
    { key: 'BOLETO', label: 'Boleto', color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Dashboard</h1>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'today', label: 'Hoje' },
              { id: '7d', label: '7 dias' },
              { id: '30d', label: 'Este mês' },
              { id: 'custom', label: 'Personalizado' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition',
                period === p.id
                  ? 'bg-purple-700 text-white'
                  : 'bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
              )}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-sm text-[var(--admin-text)]"
              />
              <span className="text-[var(--admin-muted)] text-sm">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-sm text-[var(--admin-text)]"
              />
              <button
                onClick={load}
                className="px-3 py-1.5 rounded-lg gradient-brand text-white text-sm"
              >
                Aplicar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--admin-muted)]">Meta do mês (líquido)</span>
          <span className="text-[var(--admin-text)]">
            {formatCurrency(data.monthlyNet)} de {formatCurrency(data.monthlyGoal)} ({goalPct.toFixed(0)}%)
          </span>
        </div>
        <div className="h-2 bg-purple-950/30 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', goalColor)} style={{ width: `${goalPct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--admin-muted)] text-sm">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-[var(--admin-text)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--admin-text)]">A receber por forma de pagamento</h2>
          <div className="flex gap-1">
            {(['amount', 'percent'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPaymentTab(tab)}
                className={cn(
                  'px-3 py-1 rounded text-xs',
                  paymentTab === tab ? 'bg-purple-700 text-white' : 'text-[var(--admin-muted)]'
                )}
              >
                {tab === 'amount' ? 'R$' : '%'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {paymentMethods.map(({ key, label, color }) => {
            const pm = data.byPaymentMethod[key] || { count: 0, amount: 0, net: 0 }
            const pct = paymentTotal > 0 ? (pm.amount / paymentTotal) * 100 : 0
            return (
              <div key={key} className="bg-[var(--admin-bg)] rounded-lg p-4">
                <p className="text-sm text-[var(--admin-muted)]">{label}</p>
                <p className="text-xl font-bold text-[var(--admin-text)] mt-1">
                  {paymentTab === 'amount' ? formatCurrency(pm.amount) : `${pct.toFixed(1)}%`}
                </p>
                <p className="text-xs text-[var(--admin-muted)] mt-1">
                  {pm.count} pedidos · líquido {formatCurrency(pm.net)}
                </p>
                <div className="h-1.5 bg-purple-950/20 rounded-full mt-2 overflow-hidden">
                  <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <h2 className="font-semibold text-[var(--admin-text)] mb-4">Vendas por dia</h2>
          {data.salesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4c1d9533" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1a1030', border: '1px solid #4c1d95' }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend />
                <Bar dataKey="gross" name="Bruto" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Líquido" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[var(--admin-muted)] py-16">Sem dados no período</p>
          )}
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5">
          <h2 className="font-semibold text-[var(--admin-text)] mb-4">Vendas por dia da semana (90 dias)</h2>
          {data.salesByWeekday.some((d) => d.orders > 0) ? (
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
            <p className="text-center text-[var(--admin-muted)] py-16">Sem dados nos últimos 90 dias</p>
          )}
        </div>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
        <div className="p-5 border-b border-[var(--admin-border)]">
          <h2 className="font-semibold text-[var(--admin-text)]">Últimos pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Oferta</th>
                <th className="text-left p-4">Valor</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10">
                  <td className="p-4 text-[var(--admin-text)]">{order.customerName}</td>
                  <td className="p-4 text-[var(--admin-muted)]">{order.offerName}</td>
                  <td className="p-4 text-[var(--admin-text)]">{formatCurrency(order.value)}</td>
                  <td className={cn('p-4', getOrderStatusColor(order.status))}>
                    {getOrderStatusLabel(order.status)}
                  </td>
                  <td className="p-4 text-[var(--admin-muted)]">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--admin-muted)]">
                    Nenhum pedido ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
