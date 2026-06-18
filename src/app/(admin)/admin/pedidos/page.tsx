'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye } from 'lucide-react'
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

interface Order {
  id: string
  customerName: string
  offerName: string
  value: number
  netValue: number
  status: string
  paymentMethod: string
  createdAt: string
  seller?: { name: string }
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    fetch(`/api/pedidos?${params}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [search, status])

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
  }

  const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <Link href="/admin/pedidos/novo" className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm font-medium">
          <Plus size={16} /> Novo pedido
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1a1030] border border-purple-900/30 text-white text-sm"
            placeholder="Buscar por cliente ou oferta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-lg bg-[#1a1030] border border-purple-900/30 text-white text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="WAITING_PAYMENT">Aguardando pagamento</option>
          <option value="PAID">Pago</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="REFUNDED">Reembolsado</option>
          <option value="CHARGEBACK">Chargeback</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-purple-900/20">
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Oferta</th>
                  <th className="text-left p-4">Valor</th>
                  <th className="text-left p-4">Líquido</th>
                  <th className="text-left p-4">Pagamento</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Data</th>
                  <th className="text-left p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-purple-900/10 hover:bg-purple-900/10">
                    <td className="p-4 text-white">{order.customerName}</td>
                    <td className="p-4 text-gray-300">{order.offerName}</td>
                    <td className="p-4 text-white">{formatCurrency(order.value)}</td>
                    <td className="p-4 text-purple-300">{formatCurrency(order.netValue)}</td>
                    <td className="p-4 text-gray-400">{paymentLabels[order.paymentMethod]}</td>
                    <td className={`p-4 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </td>
                    <td className="p-4 text-gray-400">{formatDate(order.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {order.status === 'WAITING_PAYMENT' && (
                          <button
                            onClick={() => updateStatus(order.id, 'PAID')}
                            className="text-xs text-green-400 hover:underline"
                          >
                            Marcar pago
                          </button>
                        )}
                        <Link href={`/admin/pedidos/${order.id}`} className="text-gray-500 hover:text-purple-400">
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">Nenhum pedido encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
