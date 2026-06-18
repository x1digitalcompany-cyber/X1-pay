'use client'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'

interface DashboardData {
  totalRevenue: number
  totalNet: number
  totalOrders: number
  paidOrders: number
  conversionRate: number
  monthlyGoal: number
  chartData: { date: string; revenue: number; orders: number }[]
  byPayment: { PIX: number; CARD: number; BOLETO: number }
  recentOrders: Array<{
    id: string
    customerName: string
    offerName: string
    value: number
    status: string
    createdAt: string
    seller?: { name: string }
  }>
}

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!data) return <p className="text-gray-400">Erro ao carregar dashboard</p>

  const pieData = [
    { name: 'PIX', value: data.byPayment.PIX },
    { name: 'Cartão', value: data.byPayment.CARD },
    { name: 'Boleto', value: data.byPayment.BOLETO },
  ].filter((d) => d.value > 0)

  const cards = [
    { label: 'Faturamento', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'text-green-400' },
    { label: 'Líquido', value: formatCurrency(data.totalNet), icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Pedidos', value: data.totalOrders, icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Conversão', value: `${data.conversionRate.toFixed(1)}%`, icon: Users, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1a1030] rounded-xl border border-purple-900/30 p-5">
          <h2 className="text-white font-semibold mb-4">Vendas — últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d1b69" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1a1030', border: '1px solid #4c1d95' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-5">
          <h2 className="text-white font-semibold mb-4">Por pagamento</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1030', border: '1px solid #4c1d95' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center mt-20">Sem dados ainda</p>
          )}
        </div>
      </div>

      <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 overflow-hidden">
        <div className="p-5 border-b border-purple-900/30">
          <h2 className="text-white font-semibold">Pedidos recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-purple-900/20">
                <th className="text-left p-4 font-medium">Cliente</th>
                <th className="text-left p-4 font-medium">Oferta</th>
                <th className="text-left p-4 font-medium">Valor</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-purple-900/10 hover:bg-purple-900/10">
                  <td className="p-4 text-white">{order.customerName}</td>
                  <td className="p-4 text-gray-300">{order.offerName}</td>
                  <td className="p-4 text-white">{formatCurrency(order.value)}</td>
                  <td className={`p-4 ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </td>
                  <td className="p-4 text-gray-400">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum pedido ainda</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
