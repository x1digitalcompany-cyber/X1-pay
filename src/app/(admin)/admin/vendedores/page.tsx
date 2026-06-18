'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Trophy } from 'lucide-react'

interface SellerRanking {
  id: string
  name: string
  email: string | null
  commissionRate: number
  isActive: boolean
  totalSales: number
  orderCount: number
  commissionEarned: number
}

export default function VendedoresRankingPage() {
  const [sellers, setSellers] = useState<SellerRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then(setSellers)
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
      <h1 className="text-2xl font-bold text-white">Ranking de vendedores</h1>

      <div className="space-y-3">
        {sellers.map((seller, index) => (
          <div
            key={seller.id}
            className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
              index === 1 ? 'bg-gray-400/20 text-gray-300' :
              index === 2 ? 'bg-orange-600/20 text-orange-400' :
              'bg-purple-900/30 text-purple-400'
            }`}>
              {index < 3 ? <Trophy size={18} /> : index + 1}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{seller.name}</p>
              <p className="text-gray-400 text-sm">{seller.orderCount} vendas · {seller.commissionRate}% comissão</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">{formatCurrency(seller.totalSales)}</p>
              <p className="text-purple-400 text-sm">Comissão: {formatCurrency(seller.commissionEarned)}</p>
            </div>
          </div>
        ))}
        {sellers.length === 0 && (
          <p className="text-center text-gray-500 py-16">Nenhum vendedor cadastrado</p>
        )}
      </div>
    </div>
  )
}
