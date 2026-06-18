'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Copy, Check, Tag, X } from 'lucide-react'
import { toast } from 'sonner'

interface AppliedCoupon {
  code: string
  discount: number
  finalPrice: number
  type: 'PERCENTAGE' | 'FIXED'
  value: number
}

interface StepPagamentoProps {
  slug: string
  price: number
  maxInstallments: number
  brandColor: string
  data: {
    paymentMethod: 'PIX' | 'CARD' | 'BOLETO'
    installments: number
    card: {
      number: string
      holderName: string
      expMonth: string
      expYear: string
      cvv: string
    }
  }
  appliedCoupon: AppliedCoupon | null
  onCouponApply: (coupon: AppliedCoupon) => void
  onCouponRemove: () => void
  onChange: (field: string, value: unknown) => void
  onBack: () => void
  onSubmit: () => Promise<void>
  loading: boolean
  result: {
    pixCode?: string
    pixQrCode?: string
    boletoUrl?: string
    boletoBarCode?: string
    status?: string
  } | null
}

export function StepPagamento({
  slug,
  price,
  maxInstallments,
  data,
  appliedCoupon,
  onCouponApply,
  onCouponRemove,
  onChange,
  onBack,
  onSubmit,
  loading,
  result,
}: StepPagamentoProps) {
  const [copied, setCopied] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const effectivePrice = appliedCoupon ? appliedCoupon.finalPrice : price

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    const res = await fetch(`/api/checkout/${slug}/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput.trim() }),
    })
    setCouponLoading(false)
    if (res.ok) {
      const data = await res.json()
      onCouponApply(data)
      setCouponInput('')
      toast.success('Cupom aplicado!')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Cupom inválido')
    }
  }

  async function copyPix() {
    if (result?.pixCode) {
      await navigator.clipboard.writeText(result.pixCode)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-purple-500'

  if (result) {
    const isPaid = result.status === 'PAID'

    return (
      <div className="space-y-6 text-center">
        {isPaid ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pagamento confirmado!</h2>
            <p className="text-gray-500 text-sm">Seu pedido foi recebido e está sendo processado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Aguardando pagamento</h2>

            {result.pixQrCode && (
              <div className="space-y-4">
                <img
                  src={result.pixQrCode}
                  alt="QR Code PIX"
                  className="mx-auto w-48 h-48 rounded-lg border border-gray-100"
                />
                {result.pixCode && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Ou copie o código abaixo:</p>
                    <button
                      onClick={copyPix}
                      className="flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copiado!' : 'Copiar código PIX'}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Aguardando confirmação do pagamento...
                </p>
              </div>
            )}

            {result.boletoUrl && (
              <div className="space-y-3">
                <a
                  href={result.boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                >
                  Baixar boleto
                </a>
                {result.boletoBarCode && (
                  <p className="text-xs text-gray-500 break-all font-mono">{result.boletoBarCode}</p>
                )}
                <p className="text-xs text-gray-400">O boleto vence em 3 dias úteis.</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Pagamento — {formatCurrency(effectivePrice)}
        {appliedCoupon && (
          <span className="ml-2 text-sm text-gray-400 line-through">{formatCurrency(price)}</span>
        )}
      </h2>

      {/* Coupon */}
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-purple-500 uppercase"
              placeholder="Cupom de desconto"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
            />
          </div>
          <button
            type="button"
            onClick={applyCoupon}
            disabled={couponLoading || !couponInput.trim()}
            className="px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm hover:border-purple-400 hover:text-purple-700 disabled:opacity-40 transition whitespace-nowrap"
          >
            {couponLoading ? '...' : 'Aplicar'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-green-600" />
            <span className="text-green-700 text-sm font-medium">{appliedCoupon.code}</span>
            <span className="text-green-600 text-sm">
              — {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}% off` : `- ${formatCurrency(appliedCoupon.discount)}`}
            </span>
          </div>
          <button onClick={onCouponRemove} className="text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(['PIX', 'CARD', 'BOLETO'] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onChange('paymentMethod', method)}
            className={`py-2 rounded-lg text-sm font-medium border transition ${
              data.paymentMethod === method
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {method === 'PIX' ? 'PIX' : method === 'CARD' ? 'Cartão' : 'Boleto'}
          </button>
        ))}
      </div>

      {data.paymentMethod === 'CARD' && (
        <div className="space-y-3">
          <input
            className={inputClass}
            placeholder="Número do cartão"
            value={data.card.number}
            onChange={(e) => onChange('card', { ...data.card, number: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Nome no cartão"
            value={data.card.holderName}
            onChange={(e) => onChange('card', { ...data.card, holderName: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <input className={inputClass} placeholder="Mês" maxLength={2} value={data.card.expMonth} onChange={(e) => onChange('card', { ...data.card, expMonth: e.target.value.replace(/\D/g, '') })} />
            <input className={inputClass} placeholder="Ano (2026)" maxLength={4} value={data.card.expYear} onChange={(e) => onChange('card', { ...data.card, expYear: e.target.value.replace(/\D/g, '') })} />
            <input className={inputClass} placeholder="CVV" value={data.card.cvv} onChange={(e) => onChange('card', { ...data.card, cvv: e.target.value })} />
          </div>
          <select
            className={inputClass}
            value={data.installments}
            onChange={(e) => onChange('installments', Number(e.target.value))}
          >
            {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}x de {formatCurrency(effectivePrice / n)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium">
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Finalizar compra'}
        </button>
      </div>
    </div>
  )
}
