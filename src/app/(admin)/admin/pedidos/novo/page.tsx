'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Seller {
  id: string
  name: string
}

export default function NovoPedidoPage() {
  const router = useRouter()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    offerName: '',
    value: 0,
    paymentMethod: 'PIX',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCpf: '',
    sellerId: '',
    status: 'PAID',
    directPayment: true,
  })

  useEffect(() => {
    fetch('/api/vendedores').then((r) => r.json()).then(setSellers)
  }, [])

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        sellerId: form.sellerId || null,
        netValue: form.value,
      }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Pedido criado!')
      router.push('/admin/pedidos')
    } else {
      toast.error('Erro ao criar pedido')
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Novo pedido manual</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1030] rounded-xl border border-purple-900/30 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Nome da oferta</label>
            <input className={inputClass} value={form.offerName} onChange={(e) => update('offerName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" className={inputClass} value={form.value} onChange={(e) => update('value', Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pagamento</label>
            <select className={inputClass} value={form.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)}>
              <option value="PIX">PIX</option>
              <option value="CARD">Cartão</option>
              <option value="BOLETO">Boleto</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Cliente</label>
            <input className={inputClass} value={form.customerName} onChange={(e) => update('customerName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" className={inputClass} value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input className={inputClass} value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">CPF</label>
            <input className={inputClass} value={form.customerCpf} onChange={(e) => update('customerCpf', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Vendedor</label>
            <select className={inputClass} value={form.sellerId} onChange={(e) => update('sellerId', e.target.value)}>
              <option value="">Nenhum</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {loading ? 'Salvando...' : 'Criar pedido'}
        </button>
      </form>
    </div>
  )
}
