'use client'
import { useState } from 'react'
import { maskCep, fetchAddressByCep } from '@/lib/utils'

interface StepEntregaProps {
  data: {
    zipCode: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
  onChange: (field: string, value: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepEntrega({ data, onChange, onNext, onBack }: StepEntregaProps) {
  const [loadingCep, setLoadingCep] = useState(false)

  async function handleCepChange(cep: string) {
    const masked = maskCep(cep)
    onChange('zipCode', masked)
    const clean = cep.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingCep(true)
      const address = await fetchAddressByCep(clean)
      setLoadingCep(false)
      if (address) {
        onChange('street', address.street)
        onChange('neighborhood', address.neighborhood)
        onChange('city', address.city)
        onChange('state', address.state)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onNext()
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-purple-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Endereço de entrega</h2>
      <div>
        <label className="block text-sm text-gray-600 mb-1">CEP {loadingCep && <span className="text-purple-500">buscando...</span>}</label>
        <input
          className={inputClass}
          value={data.zipCode}
          onChange={(e) => handleCepChange(e.target.value)}
          placeholder="00000-000"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Rua</label>
          <input className={inputClass} value={data.street} onChange={(e) => onChange('street', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Número</label>
          <input className={inputClass} value={data.number} onChange={(e) => onChange('number', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Complemento</label>
        <input className={inputClass} value={data.complement} onChange={(e) => onChange('complement', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Bairro</label>
        <input className={inputClass} value={data.neighborhood} onChange={(e) => onChange('neighborhood', e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Cidade</label>
          <input className={inputClass} value={data.city} onChange={(e) => onChange('city', e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">UF</label>
          <input className={inputClass} value={data.state} onChange={(e) => onChange('state', e.target.value)} maxLength={2} required />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium">
          Voltar
        </button>
        <button type="submit" className="flex-1 py-3 rounded-lg gradient-brand text-white font-semibold">
          Continuar
        </button>
      </div>
    </form>
  )
}
