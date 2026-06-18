'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, TrendingDown, TrendingUp, Package, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface OrderRow {
  id: string
  createdAt: string
  paidAt: string | null
  offerName: string
  customerName: string
  paymentMethod: string
  value: number
  discountAmount: number
  netValue: number
  logisticsCost: number
  trackingCode: string | null
  sellerName: string | null
  productName: string | null
  logisticPaid: boolean
  logisticPaidAmount: number
}

interface Summary {
  orderCount: number
  totalRevenue: number
  totalDiscount: number
  totalLogisticsCost: number
  totalNet: number
  totalMargin: number
  totalLogisticPaid: number
  pendingLogisticCost: number
}

const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const toISO = (d: Date) => d.toISOString().split('T')[0]

export default function AcertoLogisticaPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(toISO(firstOfMonth))
  const [to, setTo] = useState(toISO(today))

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ from, to })
    const data = await fetch(`/api/acerto-logistica?${params}`).then((r) => r.json())
    setOrders(data.orders ?? [])
    setSummary(data.summary ?? null)
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    load()
  }, [load])

  async function exportXlsx() {
    try {
      const XLSX = await import('xlsx')
      const rows = orders.map((o) => ({
        'Data pag.': o.paidAt ? formatDate(o.paidAt, 'dd/MM/yyyy') : '—',
        Cliente: o.customerName,
        Oferta: o.offerName,
        Produto: o.productName ?? '—',
        Pagamento: o.paymentMethod,
        Vendedor: o.sellerName ?? '—',
        'Rastreio': o.trackingCode ?? '—',
        'Valor bruto': o.value,
        'Desconto': o.discountAmount,
        'Líquido gateway': o.netValue,
        'Custo logística': o.logisticsCost,
        'Margem': o.netValue - o.logisticsCost,
      }))

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Acerto')
      XLSX.writeFile(wb, `acerto-logistica-${from}-${to}.xlsx`)
      toast.success('Exportado!')
    } catch {
      toast.error('Erro ao exportar')
    }
  }

  const paymentLabels: Record<string, string> = { PIX: 'PIX', CARD: 'Cartão', BOLETO: 'Boleto' }

  const cards = summary
    ? [
        { label: 'Pedidos', value: String(summary.orderCount), icon: Package, color: 'text-blue-400' },
        { label: 'Receita bruta', value: formatCurrency(summary.totalRevenue), icon: DollarSign, color: 'text-green-400' },
        { label: 'Custo logística', value: formatCurrency(summary.totalLogisticsCost), icon: TrendingDown, color: 'text-red-400' },
        { label: 'Margem líquida', value: formatCurrency(summary.totalMargin), icon: TrendingUp, color: 'text-purple-400' },
        { label: 'Total pago à logística', value: formatCurrency(summary.totalLogisticPaid), icon: DollarSign, color: 'text-emerald-400' },
        { label: 'Custo pendente', value: formatCurrency(summary.pendingLogisticCost), icon: TrendingDown, color: 'text-yellow-400' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Acerto logística</h1>
        <button
          onClick={exportXlsx}
          disabled={orders.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-40 transition"
        >
          <Download size={16} /> Exportar XLSX
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">De</label>
          <input
            type="date"
            className="px-4 py-2 rounded-lg bg-[#1a1030] border border-purple-900/30 text-white text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Até</label>
          <input
            type="date"
            className="px-4 py-2 rounded-lg bg-[#1a1030] border border-purple-900/30 text-white text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">{card.label}</span>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="text-lg font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      )}

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
                  <th className="text-left p-3">Data pag.</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Oferta</th>
                  <th className="text-left p-3">Pgto</th>
                  <th className="text-right p-3">Bruto</th>
                  <th className="text-right p-3">Desconto</th>
                  <th className="text-right p-3">Liq. gateway</th>
                  <th className="text-right p-3">Custo logística</th>
                  <th className="text-center p-3">Pago?</th>
                  <th className="text-right p-3">Margem</th>
                  <th className="text-left p-3">Rastreio</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const margin = o.netValue - o.logisticsCost
                  return (
                    <tr key={o.id} className="border-b border-purple-900/10 hover:bg-purple-900/10">
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {o.paidAt ? formatDate(o.paidAt, 'dd/MM/yy') : '—'}
                      </td>
                      <td className="p-3 text-white">{o.customerName}</td>
                      <td className="p-3 text-gray-300 max-w-[160px] truncate">{o.offerName}</td>
                      <td className="p-3 text-gray-400">{paymentLabels[o.paymentMethod] ?? o.paymentMethod}</td>
                      <td className="p-3 text-right text-white">{formatCurrency(o.value)}</td>
                      <td className="p-3 text-right text-red-400">
                        {o.discountAmount > 0 ? `- ${formatCurrency(o.discountAmount)}` : '—'}
                      </td>
                      <td className="p-3 text-right text-purple-300">{formatCurrency(o.netValue)}</td>
                      <td className="p-3 text-right text-orange-400">
                        {o.logisticsCost > 0 ? formatCurrency(o.logisticsCost) : '—'}
                      </td>
                      <td className="p-3 text-center">
                        {o.logisticPaid ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-900/40 text-green-400">Sim</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-400">Não</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-medium ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(margin)}
                      </td>
                      <td className="p-3 text-gray-400 font-mono text-xs">
                        {o.trackingCode ?? '—'}
                      </td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-500">
                      Nenhum pedido pago no período selecionado
                    </td>
                  </tr>
                )}
              </tbody>
              {orders.length > 0 && summary && (
                <tfoot>
                  <tr className="border-t border-purple-900/30 bg-purple-900/10">
                    <td colSpan={4} className="p-3 text-gray-400 font-medium">
                      Total ({summary.orderCount} pedidos)
                    </td>
                    <td className="p-3 text-right text-white font-semibold">
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td className="p-3 text-right text-red-400">
                      {summary.totalDiscount > 0 ? `- ${formatCurrency(summary.totalDiscount)}` : '—'}
                    </td>
                    <td className="p-3 text-right text-purple-300 font-semibold">
                      {formatCurrency(summary.totalNet)}
                    </td>
                    <td className="p-3 text-right text-orange-400 font-semibold">
                      {formatCurrency(summary.totalLogisticsCost)}
                    </td>
                    <td />
                    <td className={`p-3 text-right font-bold ${summary.totalMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(summary.totalMargin)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
