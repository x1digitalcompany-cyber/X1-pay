'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CheckoutSettings {
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

interface CheckoutData {
  id: string
  name: string
  slug: string
  price: number
  isActive: boolean
  supplierCost: number
  shippingCost: number
  maxInstallments: number
  installmentMode: string
  showTotalPrice: boolean
  allowPix: boolean
  allowCard: boolean
  allowBoleto: boolean
  badge: string | null
  product: {
    id: string
    name: string
    user: {
      settings: CheckoutSettings | null
    }
  }
}

export default function EditarOfertaPage() {
  const { id: productId, checkoutId } = useParams<{ id: string; checkoutId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CheckoutData | null>(null)

  useEffect(() => {
    fetch(`/api/checkouts/${checkoutId}`)
      .then((r) => r.json())
      .then(setForm)
      .finally(() => setLoading(false))
  }, [checkoutId])

  function update(field: keyof CheckoutData, value: unknown) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    const res = await fetch(`/api/checkouts/${checkoutId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setForm((prev) => (prev ? { ...prev, ...updated } : prev))
      toast.success('Oferta salva!')
    } else {
      toast.error('Erro ao salvar oferta')
    }
  }

  function calcularParcelas() {
    if (!form) return []
    const s = form.product.user.settings
    const taxas = s
      ? [s.taxCard1x, s.taxCard2x, s.taxCard3x, s.taxCard4x, s.taxCard5x, s.taxCard6x,
         s.taxCard7x, s.taxCard8x, s.taxCard9x, s.taxCard10x, s.taxCard11x, s.taxCard12x]
      : Array(12).fill(0)

    return Array.from({ length: Math.min(form.maxInstallments, 12) }, (_, i) => {
      const n = i + 1
      const taxa = (taxas[i] ?? 0) / 100
      const total = form.price * (1 + taxa)
      const parcela = total / n
      return { n, parcela, total, taxa: taxas[i] ?? 0 }
    })
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-[#0f0a1e] border border-purple-900/40 text-white focus:outline-none focus:border-purple-500 text-sm'
  const labelClass = 'block text-sm text-gray-400 mb-1.5'

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const parcelas = calcularParcelas()
  const parcelaMaior = parcelas[parcelas.length - 1]

  const pagamentos = [
    { key: 'allowCard' as const, label: 'Cartão de crédito' },
    { key: 'allowPix' as const, label: 'Pix' },
    { key: 'allowBoleto' as const, label: 'Boleto' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/produtos/${productId}`}
          className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar oferta</h1>
          <p className="text-gray-400 text-sm">
            {form.product.name} — {form.name}
          </p>
        </div>
      </div>

      {/* Layout duas colunas */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Coluna esquerda — Formulário ── */}
        <div className="flex-1 space-y-4">

          {/* Informações da oferta */}
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-purple-900/30 p-6 space-y-4">
            <h2 className="text-white font-semibold">Informações da oferta</h2>

            <div>
              <label className={labelClass}>Nome da oferta</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Link (slug)</label>
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Link de checkout:{' '}
                <span className="text-purple-400">/checkout/{form.slug}</span>
              </p>
            </div>

            <div>
              <label className={labelClass}>Preço total à vista (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.price}
                onChange={(e) => update('price', Number(e.target.value))}
              />
            </div>

            <div>
              <label className={labelClass}>Custo do fornecedor por venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.supplierCost}
                onChange={(e) => update('supplierCost', Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Usado no dashboard e acerto logístico.
              </p>
            </div>

            <div>
              <label className={labelClass}>Frete por venda — pago à logística (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.shippingCost}
                onChange={(e) => update('shippingCost', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-purple-900/30 p-6 space-y-4">
            <h2 className="text-white font-semibold">Parcelamento e juros</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Máximo de parcelas</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className={inputClass}
                  value={form.maxInstallments}
                  onChange={(e) => update('maxInstallments', Math.min(12, Math.max(1, Number(e.target.value))))}
                />
              </div>
              <div>
                <label className={labelClass}>Modo de juros</label>
                <select
                  className={inputClass}
                  value={form.installmentMode}
                  onChange={(e) => update('installmentMode', e.target.value)}
                >
                  <option value="table">Tabela global</option>
                  <option value="none">Sem juros</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-purple-900/20">
              <div>
                <p className="text-sm text-white">Mostrar valor total parcelado</p>
                <p className="text-xs text-gray-500">
                  Exibe o total abaixo da parcela na página pública.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update('showTotalPrice', !form.showTotalPrice)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  form.showTotalPrice ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.showTotalPrice ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Meios de pagamento */}
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-purple-900/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Meios de pagamento</h2>
              <button
                type="button"
                onClick={() => {
                  update('allowCard', false)
                  update('allowPix', false)
                  update('allowBoleto', false)
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition"
              >
                Desmarcar todos
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Formas de pagamento disponíveis no checkout desta oferta.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {pagamentos.map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                    form[key]
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-700 bg-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="accent-purple-500"
                  />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Coluna direita — Preview + Publicação ── */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">

          {/* Preview de parcelas */}
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-purple-900/30 p-5 space-y-3 lg:sticky lg:top-6">
            <h3 className="text-white font-semibold text-sm">Preview de parcelas</h3>

            {parcelaMaior && (
              <div className="bg-purple-900/40 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs">{parcelaMaior.n}x de</p>
                <p className="text-purple-300 text-2xl font-bold">
                  {formatCurrency(parcelaMaior.parcela)}
                </p>
                {form.showTotalPrice && (
                  <p className="text-gray-500 text-xs mt-1">
                    Total: {formatCurrency(parcelaMaior.total)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-0.5 max-h-60 overflow-y-auto">
              {parcelas.map(({ n, parcela, taxa }) => (
                <div
                  key={n}
                  className="flex items-center justify-between py-1.5 border-b border-purple-900/20 text-sm"
                >
                  <span className="text-gray-300">
                    {n}x de {formatCurrency(parcela)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {n === 1 ? 'sem juros' : `+${taxa.toFixed(2)}%`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-1 border-t border-purple-900/20">
              <span className="text-gray-400 text-sm">À vista</span>
              <span className="text-white text-sm font-medium">{formatCurrency(form.price)}</span>
            </div>
          </div>

          {/* Publicação */}
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-purple-900/30 p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm">Publicação</h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Selo</label>
              <select
                className={inputClass}
                value={form.badge || ''}
                onChange={(e) => update('badge', e.target.value || null)}
              >
                <option value="">Nenhum</option>
                <option value="mais_vendido">Mais vendido</option>
                <option value="oferta">Oferta</option>
                <option value="exclusivo">Exclusivo</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Oferta ativa</p>
                <p className="text-xs text-gray-500">Visível publicamente</p>
              </div>
              <button
                type="button"
                onClick={() => update('isActive', !form.isActive)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  form.isActive ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <a
              href={`/checkout/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-purple-700 text-purple-300 text-sm hover:bg-purple-900/20 transition"
            >
              <ExternalLink size={14} />
              Ver checkout
            </a>
          </div>

          {/* Botões */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold disabled:opacity-50 transition"
          >
            {saving ? 'Salvando...' : 'Salvar oferta'}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/admin/produtos/${productId}`)}
            className="w-full py-2 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
