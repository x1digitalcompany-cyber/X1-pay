'use client'
import { useEffect, useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

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

interface Coupon {
  code: string
  type: string
  value: number
  isActive: boolean
  expiresAt: string | null
  maxUses: number | null
  usedCount: number
  minOrderValue: number
}

interface InstallmentRow {
  installments: number
  installmentValue: number
  total: number
  taxRate: number
}

function getCardTax(settings: Settings, n: number) {
  const map: Record<number, number> = {
    1: settings.taxCard1x,
    2: settings.taxCard2x,
    3: settings.taxCard3x,
    4: settings.taxCard4x,
    5: settings.taxCard5x,
    6: settings.taxCard6x,
    7: settings.taxCard7x,
    8: settings.taxCard8x,
    9: settings.taxCard9x,
    10: settings.taxCard10x,
    11: settings.taxCard11x,
    12: settings.taxCard12x,
  }
  return map[n] ?? settings.taxCard1x
}

export default function SimuladorPage() {
  const [loading, setLoading] = useState(true)
  const [maxInstallments, setMaxInstallments] = useState(12)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])

  const [cashValue, setCashValue] = useState('')
  const [useCoupon, setUseCoupon] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [results, setResults] = useState<InstallmentRow[]>([])
  const [simulated, setSimulated] = useState(false)

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  useEffect(() => {
    Promise.all([
      fetch('/api/configuracoes').then((r) => r.json()),
      fetch('/api/cupons').then((r) => r.json()),
    ])
      .then(([config, cuponsData]) => {
        setMaxInstallments(config.maxInstallments ?? 12)
        if (config.settings) setSettings(config.settings)
        setCoupons(Array.isArray(cuponsData) ? cuponsData : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const baseValue = useMemo(() => {
    const raw = parseFloat(cashValue.replace(',', '.'))
    if (Number.isNaN(raw) || raw <= 0) return 0

    if (!useCoupon || !couponCode.trim()) return raw

    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive
    )
    if (!coupon) return raw
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return raw
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return raw
    if (raw < coupon.minOrderValue) return raw

    if (coupon.type === 'PERCENTAGE') {
      return Math.max(0, raw * (1 - coupon.value / 100))
    }
    return Math.max(0, raw - coupon.value)
  }, [cashValue, useCoupon, couponCode, coupons])

  function handleSimulate(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) {
      toast.error('Configurações não carregadas')
      return
    }
    if (baseValue <= 0) {
      toast.error('Informe um valor à vista válido')
      return
    }

    const rows: InstallmentRow[] = []
    for (let n = 1; n <= maxInstallments; n++) {
      const taxRate = getCardTax(settings, n)
      const total = baseValue
      const installmentValue = total / n
      rows.push({
        installments: n,
        installmentValue,
        total,
        taxRate,
      })
    }

    setResults(rows)
    setSimulated(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Simulador de parcelamento</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Informe o valor à vista e veja a tabela de parcelas conforme o parcelamento configurado.
        </p>
      </div>

      <form
        onSubmit={handleSimulate}
        className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4 max-w-xl"
      >
        <div>
          <label className="block text-sm text-[var(--admin-muted)] mb-1">Valor à vista</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="Ex.: 930,81"
            value={cashValue}
            onChange={(e) => setCashValue(e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--admin-text)] cursor-pointer">
          <input
            type="checkbox"
            checked={useCoupon}
            onChange={(e) => setUseCoupon(e.target.checked)}
            className="rounded border-[var(--admin-border)]"
          />
          Aplicar cupom de desconto
        </label>

        {useCoupon && (
          <div>
            <label className="block text-sm text-[var(--admin-muted)] mb-1">CÓDIGO DO CUPOM</label>
            <input
              type="text"
              className={inputClass}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Opcional"
            />
            <p className="text-xs text-[var(--admin-muted)] mt-1">
              Opcional — o desconto entra antes de parcelar.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg gradient-brand text-white font-medium text-sm flex items-center justify-center gap-2"
        >
          <Calculator size={16} /> Simular parcelamento
        </button>
      </form>

      {simulated && results.length > 0 && (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
          {baseValue > 0 && (
            <p className="px-4 py-3 text-sm text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
              Valor base simulado: <span className="text-[var(--admin-text)] font-medium">{formatCurrency(baseValue)}</span>
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                  <th className="text-left p-4">Parcelas</th>
                  <th className="text-right p-4">Valor por parcela</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Taxa aplicada</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr
                    key={row.installments}
                    className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10"
                  >
                    <td className="p-4 text-[var(--admin-text)]">{row.installments}x</td>
                    <td className="p-4 text-right text-[var(--admin-text)]">
                      {formatCurrency(row.installmentValue)}
                    </td>
                    <td className="p-4 text-right text-[var(--admin-text)]">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="p-4 text-right text-[var(--admin-muted)]">
                      {row.taxRate.toFixed(2)}%
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
