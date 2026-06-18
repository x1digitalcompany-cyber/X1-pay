'use client'
import { useState } from 'react'
import { maskPhone } from '@/lib/utils'

interface StepDadosPessoaisProps {
  checkoutSlug: string
  src?: string
  data: {
    customerName: string
    customerEmail: string
    customerPhone: string
  }
  onChange: (field: string, value: string) => void
  onNext: () => void
}

export function StepDadosPessoais({ checkoutSlug, src, data, onChange, onNext }: StepDadosPessoaisProps) {
  const [noEmail, setNoEmail] = useState(false)

  const labelClass = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1'
  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition text-base'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (data.customerName && (data.customerEmail || data.customerPhone)) {
      fetch('/api/carrinho-abandonado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutSlug,
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          src,
        }),
      }).catch(() => {})
    }
    onNext()
  }

  function handleNoEmail(checked: boolean) {
    setNoEmail(checked)
    if (checked) onChange('customerEmail', 'sem-email@x1pay.com')
    else onChange('customerEmail', '')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div>
        <label className={labelClass}>Nome Completo</label>
        <input
          className={inputClass}
          placeholder="Seu nome completo"
          value={data.customerName}
          onChange={(e) => onChange('customerName', e.target.value)}
          required
        />
      </div>

      {/* E-mail */}
      <div>
        <label className={labelClass}>E-mail</label>
        <input
          type={noEmail ? 'text' : 'email'}
          className={inputClass}
          placeholder={noEmail ? '—' : 'Digite seu e-mail'}
          value={noEmail ? '' : data.customerEmail}
          onChange={(e) => onChange('customerEmail', e.target.value)}
          disabled={noEmail}
          required={!noEmail}
        />
        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noEmail}
            onChange={(e) => handleNoEmail(e.target.checked)}
            className="rounded accent-purple-600"
          />
          <span className="text-xs text-gray-500">Não tenho e-mail</span>
        </label>
      </div>

      {/* Celular */}
      <div>
        <label className={labelClass}>Celular / WhatsApp</label>
        <input
          className={inputClass}
          placeholder="(00) 00000-0000"
          value={data.customerPhone}
          onChange={(e) => onChange('customerPhone', maskPhone(e.target.value))}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition"
      >
        continuar →
      </button>
    </form>
  )
}
