'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { StepDadosPessoais } from '@/components/checkout/StepDadosPessoais'
import { StepEntrega } from '@/components/checkout/StepEntrega'
import { StepPagamento } from '@/components/checkout/StepPagamento'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ShieldCheck, Check, Pencil, X } from 'lucide-react'

interface CheckoutData {
  id: string
  name: string
  price: number
  brandName: string
  brandColor: string
  logoUrl?: string
  maxInstallments: number
  product: {
    name: string
    description?: string
    imageUrl?: string
  }
}

interface AppliedCoupon {
  code: string
  discount: number
  finalPrice: number
  type: 'PERCENTAGE' | 'FIXED'
  value: number
}

// ─── Accordion Step ───────────────────────────────────────────────────────────
function AccordionStep({
  numero,
  titulo,
  concluido,
  ativo,
  resumo,
  onEdit,
  children,
}: {
  numero: number
  titulo: string
  concluido: boolean
  ativo: boolean
  resumo: string | null
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${
        ativo ? 'border-purple-200 shadow-sm' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              concluido || ativo ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {concluido ? <Check size={16} /> : numero}
          </div>
          <div>
            <p
              className={`font-semibold text-sm ${
                ativo || concluido ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {titulo}
            </p>
            {concluido && resumo && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{resumo}</p>
            )}
          </div>
        </div>
        {concluido && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-gray-400 hover:text-purple-600 transition p-1"
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      {ativo && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar Resumo ───────────────────────────────────────────────────────────
function SidebarResumo({
  checkout,
  appliedCoupon,
  onCouponApply,
  onCouponRemove,
  slug,
}: {
  checkout: CheckoutData
  appliedCoupon: AppliedCoupon | null
  onCouponApply: (c: AppliedCoupon) => void
  onCouponRemove: () => void
  slug: string
}) {
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : checkout.price

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 lg:sticky lg:top-6">
      {checkout.product.imageUrl && (
        <img
          src={checkout.product.imageUrl}
          alt=""
          className="w-full rounded-xl object-cover max-h-40"
        />
      )}

      <div>
        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">
          Resumo da Compra
        </p>
        <p className="font-semibold text-gray-900 text-sm leading-tight">{checkout.name}</p>
        {checkout.product.description && (
          <p className="text-xs text-gray-500 mt-1 leading-snug">{checkout.product.description}</p>
        )}
      </div>

      {/* Cupom */}
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition"
            placeholder="Cupom de desconto"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
          />
          <button
            type="button"
            onClick={applyCoupon}
            disabled={couponLoading || !couponInput.trim()}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:border-purple-400 hover:text-purple-700 disabled:opacity-40 transition whitespace-nowrap"
          >
            {couponLoading ? '...' : 'Aplicar'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
          <span className="text-green-700 font-medium">{appliedCoupon.code}</span>
          <div className="flex items-center gap-2">
            <span className="text-green-600">
              -{appliedCoupon.type === 'PERCENTAGE'
                ? `${appliedCoupon.value}%`
                : formatCurrency(appliedCoupon.discount)}
            </span>
            <button type="button" onClick={onCouponRemove} className="text-gray-400 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100" />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total:</span>
        <div className="text-right">
          {appliedCoupon && (
            <p className="text-xs text-gray-400 line-through">{formatCurrency(checkout.price)}</p>
          )}
          <p className="font-bold text-green-600 text-lg">
            1x {formatCurrency(finalPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
        <ShieldCheck size={15} className="text-green-500 shrink-0" />
        <span className="text-xs text-gray-500 font-medium">Pagamento 100% seguro</span>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const sellerId = searchParams.get('seller') || searchParams.get('src') || undefined

  const [checkout, setCheckout] = useState<CheckoutData | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [result, setResult] = useState<{
    pixCode?: string
    pixQrCode?: string
    boletoUrl?: string
    boletoBarCode?: string
    status?: string
  } | null>(null)

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCpf: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'PIX' as 'PIX' | 'CARD' | 'BOLETO',
    installments: 1,
    card: { number: '', holderName: '', expMonth: '', expYear: '', cvv: '' },
  })

  // Carrega checkout
  useEffect(() => {
    fetch(`/api/checkout/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then(setCheckout)
      .catch(() => toast.error('Checkout não encontrado'))
      .finally(() => setLoading(false))
  }, [slug])

  // Polling de status após PIX/Boleto
  useEffect(() => {
    if (!orderId || !result || result.status === 'PAID') return
    if (form.paymentMethod === 'CARD') return

    let attempts = 0
    const maxAttempts = 60

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/checkout/status/${orderId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'PAID' || data.status === 'CONFIRMED') {
          clearInterval(interval)
          setResult((prev) => ({ ...prev!, status: 'PAID' }))
        }
      } catch {
        // silencioso
      }
      if (attempts >= maxAttempts) clearInterval(interval)
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, result?.status, form.paymentMethod])

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ── Não alterar esta função ──────────────────────────────────────────────
  async function handlePayment() {
    setSubmitting(true)
    const res = await fetch(`/api/checkout/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        couponCode: appliedCoupon?.code ?? null,
        sellerId: sellerId ?? null,
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      toast.error(data.error || 'Erro ao processar pagamento')
      return
    }

    setResult(data)
    setOrderId(data.orderId ?? null)
  }
  // ────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Checkout não encontrado</p>
      </div>
    )
  }

  const resumoStep1 = form.customerName
    ? `${form.customerName}${form.customerPhone ? ' · ' + form.customerPhone : ''}`
    : null

  const resumoStep2 = form.street
    ? `${form.street}${form.number ? ', ' + form.number : ''} — ${form.city}/${form.state}`
    : null

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--brand-color': checkout.brandColor } as React.CSSProperties}
    >
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-sm text-gray-500 font-medium">Pagamento 100% seguro</span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Mobile: sidebar topo · Desktop: sidebar direita (flex-col-reverse inverte no mobile) */}
        <div className="flex flex-col-reverse lg:flex-row gap-6">

          {/* Coluna esquerda — Accordion */}
          <div className="flex-1 space-y-3">

            {/* Tela de resultado (PIX/Boleto/Confirmado) — sobrepõe o accordion */}
            {result && (
              <StepPagamento
                slug={slug}
                price={checkout.price}
                maxInstallments={checkout.maxInstallments}
                brandColor={checkout.brandColor}
                data={form}
                appliedCoupon={appliedCoupon}
                onCouponApply={setAppliedCoupon}
                onCouponRemove={() => setAppliedCoupon(null)}
                onChange={updateForm}
                onBack={() => setStep(2)}
                onSubmit={handlePayment}
                loading={submitting}
                result={result}
              />
            )}

            {!result && (
              <>
                <AccordionStep
                  numero={1}
                  titulo="Dados Pessoais"
                  concluido={step > 1}
                  ativo={step === 1}
                  resumo={resumoStep1}
                  onEdit={() => setStep(1)}
                >
                  <StepDadosPessoais
                    checkoutSlug={slug}
                    data={form}
                    onChange={updateForm}
                    onNext={() => setStep(2)}
                  />
                </AccordionStep>

                <AccordionStep
                  numero={2}
                  titulo="Entrega"
                  concluido={step > 2}
                  ativo={step === 2}
                  resumo={resumoStep2}
                  onEdit={() => setStep(2)}
                >
                  <StepEntrega
                    data={form}
                    onChange={updateForm}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                  />
                </AccordionStep>

                <AccordionStep
                  numero={3}
                  titulo="Pagamento"
                  concluido={false}
                  ativo={step === 3}
                  resumo={null}
                >
                  <StepPagamento
                    slug={slug}
                    price={checkout.price}
                    maxInstallments={checkout.maxInstallments}
                    brandColor={checkout.brandColor}
                    data={form}
                    appliedCoupon={appliedCoupon}
                    onCouponApply={setAppliedCoupon}
                    onCouponRemove={() => setAppliedCoupon(null)}
                    onChange={updateForm}
                    onBack={() => setStep(2)}
                    onSubmit={handlePayment}
                    loading={submitting}
                    result={null}
                  />
                </AccordionStep>
              </>
            )}
          </div>

          {/* Coluna direita — Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <SidebarResumo
              checkout={checkout}
              appliedCoupon={appliedCoupon}
              onCouponApply={setAppliedCoupon}
              onCouponRemove={() => setAppliedCoupon(null)}
              slug={slug}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 space-y-1">
        <p>🔒 Compra processada com segurança</p>
        <p>© 2026 {checkout.brandName}</p>
      </footer>
    </div>
  )
}
