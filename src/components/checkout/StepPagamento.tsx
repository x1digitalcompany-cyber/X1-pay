'use client'
import { useState } from 'react'
import { formatCurrency, maskCpf } from '@/lib/utils'
import { CreditCard, QrCode, Barcode, Check, Copy, X } from 'lucide-react'
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
    customerCpf: string
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
  price,
  maxInstallments,
  data,
  appliedCoupon,
  onChange,
  onSubmit,
  loading,
  result,
}: StepPagamentoProps) {
  const [copied, setCopied] = useState(false)

  const effectivePrice = appliedCoupon ? appliedCoupon.finalPrice : price

  const labelClass = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1'
  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition text-base'

  function radioClass(selected: boolean) {
    return `flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
      selected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-white'
    }`
  }

  async function copyPix() {
    if (result?.pixCode) {
      await navigator.clipboard.writeText(result.pixCode)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // ── Tela de Resultado ────────────────────────────────────────────────────
  if (result) {
    const isPaid = result.status === 'PAID'

    if (isPaid) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center mx-auto">
            <Check size={28} className="text-green-500" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h2>
          <p className="text-sm text-gray-500">
            Recebemos seu pagamento. Obrigado pela compra!
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 text-left">
            📦 Seu produto já está sendo separado e despachado — em breve chegará até você!
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-5">
        {result.pixQrCode && (
          <>
            <div className="flex justify-center">
              <QrCode size={40} className="text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Pague com Pix</h2>
            <p className="text-sm text-gray-500">Escaneie o QR Code ou copie o código abaixo.</p>

            <img
              src={result.pixQrCode}
              alt="QR Code PIX"
              className="mx-auto w-52 h-52 rounded-xl border border-gray-100"
            />

            {result.pixCode && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 break-all font-mono border border-gray-100 text-center">
                {result.pixCode}
              </div>
            )}

            <button
              onClick={copyPix}
              className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copiado!' : 'Copiar código Pix'}
            </button>

            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Após o pagamento, a confirmação é automática.
            </p>
          </>
        )}

        {result.boletoUrl && (
          <>
            <h2 className="text-xl font-bold text-gray-900">Boleto gerado!</h2>
            <p className="text-sm text-gray-500">Clique abaixo para visualizar e pagar o boleto.</p>
            <a
              href={result.boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition"
            >
              Abrir boleto
            </a>
            {result.boletoBarCode && (
              <p className="text-xs text-gray-500 break-all font-mono">{result.boletoBarCode}</p>
            )}
            <p className="text-xs text-gray-400">O boleto vence em 3 dias úteis.</p>
          </>
        )}

        {!result.pixQrCode && !result.boletoUrl && (
          <>
            <h2 className="text-xl font-bold text-gray-900">Aguardando pagamento</h2>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Confirmação automática em breve...
            </p>
          </>
        )}
      </div>
    )
  }

  // ── Formulário ───────────────────────────────────────────────────────────
  const cardNum = data.card.number.replace(/\s/g, '')
  const cardDisplay = cardNum
    ? cardNum.replace(/(.{4})/g, '$1 ').trim()
    : '#### #### #### ####'

  const expDisplay =
    data.card.expMonth && data.card.expYear
      ? `${data.card.expMonth.padStart(2, '0')}/${data.card.expYear.slice(-2)}`
      : 'MM/AA'

  return (
    <div className="space-y-5">
      {/* Métodos de pagamento */}
      <div className="space-y-3">
        {/* Cartão */}
        <label className={radioClass(data.paymentMethod === 'CARD')}>
          <input
            type="radio"
            name="paymentMethod"
            value="CARD"
            checked={data.paymentMethod === 'CARD'}
            onChange={() => onChange('paymentMethod', 'CARD')}
            className="mt-0.5 accent-purple-600"
          />
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-gray-600 shrink-0" />
            <span className="font-medium text-sm text-gray-900">Cartão de Crédito</span>
          </div>
        </label>

        {/* Campos do cartão expandidos */}
        {data.paymentMethod === 'CARD' && (
          <div className="bg-white border border-purple-200 rounded-xl px-4 pb-4 space-y-4 pt-4">
            {/* Preview do cartão */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white overflow-hidden h-28 sm:h-36 select-none">
              <div className="absolute top-4 right-4 w-10 h-6 bg-gray-600 rounded opacity-70" />
              <p className="font-mono text-base sm:text-lg tracking-widest mt-1 sm:mt-4 truncate">
                {cardDisplay}
              </p>
              <div className="flex justify-between mt-3 sm:mt-4 text-xs">
                <div>
                  <p className="uppercase text-gray-500 text-[9px] mb-0.5">Titular</p>
                  <p className="text-white text-xs sm:text-sm font-medium truncate max-w-[130px]">
                    {data.card.holderName || 'NOME COMPLETO'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="uppercase text-gray-500 text-[9px] mb-0.5">Validade</p>
                  <p className="text-white text-xs sm:text-sm">{expDisplay}</p>
                </div>
              </div>
            </div>

            {/* Número */}
            <div>
              <label className={labelClass}>Número do Cartão</label>
              <input
                className={inputClass}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={data.card.number}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
                  const masked = digits.replace(/(.{4})/g, '$1 ').trim()
                  onChange('card', { ...data.card, number: masked })
                }}
              />
            </div>

            {/* Titular */}
            <div>
              <label className={labelClass}>Titular do Cartão</label>
              <input
                className={inputClass}
                placeholder="Nome impresso no cartão"
                value={data.card.holderName}
                onChange={(e) =>
                  onChange('card', { ...data.card, holderName: e.target.value.toUpperCase() })
                }
              />
            </div>

            {/* Validade + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Validade</label>
                <input
                  className={inputClass}
                  placeholder="MM/AA"
                  maxLength={5}
                  value={
                    data.card.expMonth || data.card.expYear
                      ? `${data.card.expMonth}${data.card.expYear ? '/' + data.card.expYear.slice(-2) : ''}`
                      : ''
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                    const month = digits.slice(0, 2)
                    const year = digits.length >= 3 ? `20${digits.slice(2, 4)}` : ''
                    onChange('card', { ...data.card, expMonth: month, expYear: year })
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>CVV</label>
                <input
                  className={inputClass}
                  placeholder="CVV"
                  maxLength={4}
                  value={data.card.cvv}
                  onChange={(e) =>
                    onChange('card', { ...data.card, cvv: e.target.value.replace(/\D/g, '') })
                  }
                />
              </div>
            </div>

            {/* Parcelamento */}
            <div>
              <label className={labelClass}>Parcelamento</label>
              <select
                className={inputClass}
                value={data.installments}
                onChange={(e) => onChange('installments', Number(e.target.value))}
              >
                {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de {formatCurrency(effectivePrice / n)}
                    {n === 1 ? ' sem juros' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* PIX */}
        <label className={radioClass(data.paymentMethod === 'PIX')}>
          <input
            type="radio"
            name="paymentMethod"
            value="PIX"
            checked={data.paymentMethod === 'PIX'}
            onChange={() => onChange('paymentMethod', 'PIX')}
            className="mt-0.5 accent-purple-600"
          />
          <div>
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-gray-600 shrink-0" />
              <span className="font-medium text-sm text-gray-900">Pix à vista</span>
            </div>
            {data.paymentMethod === 'PIX' && (
              <p className="text-xs text-gray-500 mt-1">
                Ao confirmar, geramos um QR Code Pix de {formatCurrency(effectivePrice)} para pagamento imediato.
              </p>
            )}
          </div>
        </label>

        {/* Boleto */}
        <label className={radioClass(data.paymentMethod === 'BOLETO')}>
          <input
            type="radio"
            name="paymentMethod"
            value="BOLETO"
            checked={data.paymentMethod === 'BOLETO'}
            onChange={() => onChange('paymentMethod', 'BOLETO')}
            className="mt-0.5 accent-purple-600"
          />
          <div className="flex items-center gap-2">
            <Barcode size={18} className="text-gray-600 shrink-0" />
            <span className="font-medium text-sm text-gray-900">Boleto à vista</span>
          </div>
        </label>
      </div>

      {/* CPF / CNPJ */}
      <div>
        <label className={labelClass}>CPF / CNPJ (para nota fiscal)</label>
        <input
          className={inputClass}
          placeholder="000.000.000-00"
          value={data.customerCpf}
          onChange={(e) => onChange('customerCpf', maskCpf(e.target.value))}
        />
      </div>

      {/* Botão confirmar */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Check size={16} />
            Confirmar Pagamento — {formatCurrency(effectivePrice)}
          </>
        )}
      </button>

      {/* Remover cupom aplicado (caso exista — vem da sidebar mas exibe aqui também) */}
      {appliedCoupon && (
        <div className="flex items-center justify-between text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
          <span className="font-medium">{appliedCoupon.code} aplicado</span>
          <span>Economia: {formatCurrency(appliedCoupon.discount)}</span>
        </div>
      )}
    </div>
  )
}

// Suprimir avisos de props não usadas na tela de resultado
void (X as unknown)
