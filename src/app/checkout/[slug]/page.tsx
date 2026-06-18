'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { StepDadosPessoais } from '@/components/checkout/StepDadosPessoais'
import { StepEntrega } from '@/components/checkout/StepEntrega'
import { StepPagamento } from '@/components/checkout/StepPagamento'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

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

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const [checkout, setCheckout] = useState<CheckoutData | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    pixCode?: string
    pixQrCode?: string
    boletoUrl?: string
    boletoBarCode?: string
    status?: string
  } | null>(null)

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    finalPrice: number
    type: 'PERCENTAGE' | 'FIXED'
    value: number
  } | null>(null)

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

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePayment() {
    setSubmitting(true)
    const res = await fetch(`/api/checkout/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        couponCode: appliedCoupon?.code ?? null,
      }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      toast.error(data.error || 'Erro ao processar pagamento')
      return
    }

    setResult(data)
    setStep(4)
  }

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

  const steps = ['Dados', 'Entrega', 'Pagamento']

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--brand-color': checkout.brandColor } as React.CSSProperties}>
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {checkout.logoUrl ? (
            <img src={checkout.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">X1</span>
            </div>
          )}
          <span className="font-semibold text-gray-900">{checkout.brandName}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-6">
            {checkout.product.imageUrl && (
              <img src={checkout.product.imageUrl} alt="" className="w-full rounded-xl mb-4 object-cover" />
            )}
            <h1 className="text-xl font-bold text-gray-900">{checkout.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{checkout.product.description}</p>
            <p className="text-3xl font-bold text-purple-700 mt-4">{formatCurrency(checkout.price)}</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          {step < 4 && (
            <div className="flex gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > i + 1 ? 'bg-green-500 text-white' :
                    step === i + 1 ? 'gradient-brand text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm hidden sm:block ${step === i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {step === 1 && (
              <StepDadosPessoais
                checkoutSlug={slug}
                data={form}
                onChange={updateForm}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepEntrega
                data={form}
                onChange={updateForm}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
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
            )}
            {step === 4 && result && (
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
                onBack={() => setStep(3)}
                onSubmit={handlePayment}
                loading={false}
                result={result}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
