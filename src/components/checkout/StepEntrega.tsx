'use client'
import { useEffect, useState } from 'react'
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

export function StepEntrega({ data, onChange, onNext }: StepEntregaProps) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [noNumber, setNoNumber] = useState(false)

  const labelClass = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1'
  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-100 transition text-base'

  useEffect(() => {
    if (noNumber) onChange('number', 'S/N')
  }, [noNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCepChange(value: string) {
    const masked = maskCep(value)
    onChange('zipCode', masked)
    const clean = value.replace(/\D/g, '')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* CEP + Cidade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            CEP {loadingCep && <span className="text-purple-500 normal-case font-normal">buscando...</span>}
          </label>
          <input
            className={inputClass}
            placeholder="00000-000"
            value={data.zipCode}
            onChange={(e) => handleCepChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Cidade</label>
          <input
            className={inputClass}
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className={labelClass}>Estado (UF)</label>
        <input
          className={inputClass}
          value={data.state}
          onChange={(e) => onChange('state', e.target.value.toUpperCase())}
          maxLength={2}
          required
        />
      </div>

      {/* Endereço */}
      <div>
        <label className={labelClass}>Endereço</label>
        <input
          className={inputClass}
          placeholder="Rua, Avenida..."
          value={data.street}
          onChange={(e) => onChange('street', e.target.value)}
          required
        />
      </div>

      {/* Número */}
      <div>
        <label className={labelClass}>Número</label>
        <div className="flex items-center gap-3">
          <input
            className={`${inputClass} flex-1`}
            value={noNumber ? 'S/N' : data.number}
            onChange={(e) => onChange('number', e.target.value)}
            disabled={noNumber}
            required={!noNumber}
          />
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={noNumber}
              onChange={(e) => setNoNumber(e.target.checked)}
              className="rounded accent-purple-600"
            />
            Sem número
          </label>
        </div>
      </div>

      {/* Bairro */}
      <div>
        <label className={labelClass}>Bairro</label>
        <input
          className={inputClass}
          value={data.neighborhood}
          onChange={(e) => onChange('neighborhood', e.target.value)}
          required
        />
      </div>

      {/* Complemento */}
      <div>
        <label className={labelClass}>Complemento</label>
        <input
          className={inputClass}
          placeholder="Apto, bloco, referência..."
          value={data.complement}
          onChange={(e) => onChange('complement', e.target.value)}
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
