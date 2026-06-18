'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'

interface Settings {
  taxCard1x: number
  taxCard2x: number
  taxCard3x: number
  taxCard4x: number
  taxCard5x: number
  taxCard6x: number
  taxCard7x: number
  taxCard8x: number
  taxCard9x: number
  taxCard10x: number
  taxCard11x: number
  taxCard12x: number
}

export default function ParcelamentosPage() {
  const [loading, setLoading] = useState(true)
  const [maxInstallments, setMaxInstallments] = useState(12)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((res) => {
        setMaxInstallments(res.maxInstallments ?? 12)
        if (res.settings) setSettings(res.settings)
      })
      .finally(() => setLoading(false))
  }, [])

  const taxRows = settings
    ? Array.from({ length: maxInstallments }, (_, i) => {
        const n = i + 1
        const key = `taxCard${n}x` as keyof Settings
        return { installments: n, rate: settings[key] as number }
      })
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--admin-text)]">Parcelamentos</h1>
          <p className="text-[var(--admin-muted)] text-sm mt-1">
            Taxas de cartão configuradas na plataforma (máximo de {maxInstallments}x).
          </p>
        </div>
        <Link
          href="/admin/configuracoes?tab=parcelamentos"
          className="text-sm text-purple-400 hover:underline whitespace-nowrap"
        >
          Editar em Configurações
        </Link>
      </div>

      <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--admin-border)]">
          <CreditCard size={18} className="text-purple-400" />
          <span className="text-sm font-medium text-[var(--admin-text)]">CET do cartão por parcela</span>
        </div>
        {taxRows.length === 0 ? (
          <div className="p-12 text-center text-[var(--admin-muted)]">
            Nenhuma taxa configurada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Parcelas</th>
                  <th className="text-right p-4">Taxa (%)</th>
                </tr>
              </thead>
              <tbody>
                {taxRows.map((row) => (
                  <tr
                    key={row.installments}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                  >
                    <td className="p-4 text-[var(--admin-text)]">{row.installments}x</td>
                    <td className="p-4 text-right text-[var(--admin-muted)]">
                      {row.rate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
