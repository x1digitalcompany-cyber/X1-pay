'use client'
import { maskCpf, maskPhone } from '@/lib/utils'

interface StepDadosPessoaisProps {
  data: {
    customerName: string
    customerEmail: string
    customerPhone: string
    customerCpf: string
  }
  onChange: (field: string, value: string) => void
  onNext: () => void
}

export function StepDadosPessoais({ data, onChange, onNext }: StepDadosPessoaisProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onNext()
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-purple-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Seus dados</h2>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Nome completo</label>
        <input
          className={inputClass}
          value={data.customerName}
          onChange={(e) => onChange('customerName', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          className={inputClass}
          value={data.customerEmail}
          onChange={(e) => onChange('customerEmail', e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Telefone</label>
        <input
          className={inputClass}
          value={data.customerPhone}
          onChange={(e) => onChange('customerPhone', maskPhone(e.target.value))}
          placeholder="(00) 00000-0000"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">CPF</label>
        <input
          className={inputClass}
          value={data.customerCpf}
          onChange={(e) => onChange('customerCpf', maskCpf(e.target.value))}
          placeholder="000.000.000-00"
          required
        />
      </div>
      <button type="submit" className="w-full py-3 rounded-lg gradient-brand text-white font-semibold">
        Continuar
      </button>
    </form>
  )
}
