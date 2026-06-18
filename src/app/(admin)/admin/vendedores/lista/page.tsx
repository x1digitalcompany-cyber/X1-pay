'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Seller {
  id: string
  name: string
  email: string | null
  phone: string | null
  commissionRate: number
  isActive: boolean
}

export default function VendedoresListaPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', commissionRate: 10 })

  useEffect(() => {
    loadSellers()
  }, [])

  async function loadSellers() {
    const data = await fetch('/api/vendedores').then((r) => r.json())
    setSellers(data)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/vendedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, commission: form.commissionRate }),
    })
    if (res.ok) {
      toast.success('Vendedor criado!')
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', commissionRate: 10 })
      loadSellers()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir vendedor?')) return
    await fetch(`/api/vendedores?id=${id}`, { method: 'DELETE' })
    loadSellers()
    toast.success('Vendedor excluído')
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Todos os vendedores</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm"
        >
          <Plus size={16} /> Novo vendedor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input type="number" className={inputClass} placeholder="Comissão %" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} />
          <button type="submit" className="sm:col-span-2 py-2 rounded-lg gradient-brand text-white font-medium">Salvar</button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-purple-900/20">
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Comissão</th>
                <th className="text-left p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} className="border-b border-purple-900/10">
                  <td className="p-4 text-white">{seller.name}</td>
                  <td className="p-4 text-gray-400">{seller.email}</td>
                  <td className="p-4 text-gray-400">{seller.phone}</td>
                  <td className="p-4 text-purple-300">{seller.commissionRate}%</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${seller.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                      {seller.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(seller.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
