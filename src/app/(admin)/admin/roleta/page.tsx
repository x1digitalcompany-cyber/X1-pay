'use client'
import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Dices, Gift, History, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

type Tab = 'girar' | 'premios' | 'historico'

interface Seller {
  id: string
  name: string
}

interface SpinPrize {
  id: string
  label: string
  probability: number
  color: string
  isActive: boolean
}

interface SpinResult {
  id: string
  createdAt: string
  seller: { name: string }
  prize: { label: string; color: string }
}

const emptyPrizeForm = { label: '', probability: 10, color: '#7c3aed' }

export default function RoletaPage() {
  const [tab, setTab] = useState<Tab>('girar')
  const [sellers, setSellers] = useState<Seller[]>([])
  const [prizes, setPrizes] = useState<SpinPrize[]>([])
  const [history, setHistory] = useState<SpinResult[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [selectedSeller, setSelectedSeller] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [lastResult, setLastResult] = useState<{ label: string; color: string; seller: string } | null>(null)

  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [editingPrize, setEditingPrize] = useState<SpinPrize | null>(null)
  const [prizeForm, setPrizeForm] = useState(emptyPrizeForm)
  const [savingPrize, setSavingPrize] = useState(false)

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  const loadSellers = useCallback(async () => {
    const data = await fetch('/api/vendedores').then((r) => r.json())
    setSellers(data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
  }, [])

  const loadPrizes = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/roleta/premios').then((r) => r.json())
    setPrizes(data)
    setLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/roleta/historico').then((r) => r.json())
    setHistory(data.results ?? [])
    setHistoryTotal(data.total ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSellers()
  }, [loadSellers])

  useEffect(() => {
    if (tab === 'premios') loadPrizes()
    if (tab === 'historico') loadHistory()
  }, [tab, loadPrizes, loadHistory])

  async function handleSpin() {
    if (!selectedSeller) {
      toast.error('Selecione um vendedor')
      return
    }
    setSpinning(true)
    setLastResult(null)
    const res = await fetch('/api/roleta/girar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId: selectedSeller }),
    })
    setSpinning(false)
    if (res.ok) {
      const data = await res.json()
      const sellerName = sellers.find((s) => s.id === selectedSeller)?.name ?? ''
      setLastResult({
        label: data.prize.label,
        color: data.prize.color,
        seller: sellerName,
      })
      toast.success(`Prêmio: ${data.prize.label}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao girar roleta')
    }
  }

  function openPrizeForm(prize?: SpinPrize) {
    if (prize) {
      setEditingPrize(prize)
      setPrizeForm({ label: prize.label, probability: prize.probability, color: prize.color })
    } else {
      setEditingPrize(null)
      setPrizeForm(emptyPrizeForm)
    }
    setShowPrizeForm(true)
  }

  async function handleSavePrize(e: React.FormEvent) {
    e.preventDefault()
    setSavingPrize(true)
    const url = editingPrize ? `/api/roleta/premios?id=${editingPrize.id}` : '/api/roleta/premios'
    const method = editingPrize ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prizeForm),
    })
    setSavingPrize(false)
    if (res.ok) {
      toast.success(editingPrize ? 'Prêmio atualizado!' : 'Prêmio criado!')
      setShowPrizeForm(false)
      loadPrizes()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro ao salvar prêmio')
    }
  }

  async function togglePrizeActive(prize: SpinPrize) {
    await fetch(`/api/roleta/premios?id=${prize.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !prize.isActive }),
    })
    setPrizes((prev) =>
      prev.map((p) => (p.id === prize.id ? { ...p, isActive: !p.isActive } : p))
    )
    toast.success(prize.isActive ? 'Prêmio desativado' : 'Prêmio ativado')
  }

  async function handleDeletePrize(id: string) {
    if (!confirm('Excluir este prêmio?')) return
    await fetch(`/api/roleta/premios?id=${id}`, { method: 'DELETE' })
    setPrizes((prev) => prev.filter((p) => p.id !== id))
    toast.success('Prêmio excluído')
  }

  const tabs = [
    { id: 'girar' as Tab, label: 'Girar', icon: Dices },
    { id: 'premios' as Tab, label: 'Prêmios', icon: Gift },
    { id: 'historico' as Tab, label: 'Histórico', icon: History },
  ]

  const totalProbability = prizes.filter((p) => p.isActive).reduce((s, p) => s + p.probability, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--admin-text)]">Roleta de prêmios</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition',
              tab === id
                ? 'bg-purple-700 text-white'
                : 'bg-[var(--admin-panel-bg)] border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]'
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'girar' && (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 max-w-lg space-y-6">
          <div>
            <label className="block text-sm text-[var(--admin-muted)] mb-1">Vendedor</label>
            <select
              className={inputClass}
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
            >
              <option value="">Selecione o vendedor...</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning || !selectedSeller}
            className="w-full py-3 rounded-xl gradient-brand text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Dices size={20} className={spinning ? 'animate-spin' : ''} />
            {spinning ? 'Girando...' : 'Girar roleta'}
          </button>

          {lastResult && (
            <div
              className="rounded-xl p-6 text-center border-2"
              style={{ borderColor: lastResult.color, backgroundColor: `${lastResult.color}15` }}
            >
              <p className="text-[var(--admin-muted)] text-sm">{lastResult.seller} ganhou</p>
              <p className="text-2xl font-bold mt-2" style={{ color: lastResult.color }}>
                {lastResult.label}
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'premios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--admin-muted)]">
              Probabilidade total (ativos): {totalProbability.toFixed(1)}%
            </p>
            <button
              onClick={() => openPrizeForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm"
            >
              <Plus size={16} /> Novo prêmio
            </button>
          </div>

          {showPrizeForm && (
            <form
              onSubmit={handleSavePrize}
              className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4"
            >
              <h2 className="text-[var(--admin-text)] font-semibold">
                {editingPrize ? 'Editar prêmio' : 'Novo prêmio'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-[var(--admin-muted)] mb-1">Nome do prêmio</label>
                  <input
                    className={inputClass}
                    value={prizeForm.label}
                    onChange={(e) => setPrizeForm({ ...prizeForm, label: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--admin-muted)] mb-1">Probabilidade (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    className={inputClass}
                    value={prizeForm.probability}
                    onChange={(e) => setPrizeForm({ ...prizeForm, probability: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--admin-muted)] mb-1">Cor</label>
                  <input
                    type="color"
                    className="w-full h-10 rounded-lg cursor-pointer border border-[var(--admin-border)]"
                    value={prizeForm.color}
                    onChange={(e) => setPrizeForm({ ...prizeForm, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPrizeForm(false)}
                  className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPrize}
                  className="flex-1 py-2 rounded-lg gradient-brand text-white text-sm disabled:opacity-50"
                >
                  {savingPrize ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                    <th className="text-left p-4">Prêmio</th>
                    <th className="text-left p-4">Probabilidade</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {prizes.map((prize) => (
                    <tr key={prize.id} className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: prize.color }}
                          />
                          <span className="text-[var(--admin-text)]">{prize.label}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--admin-muted)]">{prize.probability}%</td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePrizeActive(prize)}
                          className="flex items-center gap-1 text-[var(--admin-muted)] hover:text-purple-400"
                        >
                          {prize.isActive ? (
                            <ToggleRight size={20} className="text-green-400" />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                          <span className="text-xs">{prize.isActive ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openPrizeForm(prize)}
                            className="text-xs text-purple-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletePrize(prize.id)}
                            className="text-[var(--admin-muted)] hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {prizes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[var(--admin-muted)]">
                        Nenhum prêmio configurado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'historico' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--admin-muted)]">{historyTotal} giros no total</p>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--admin-muted)] border-b border-[var(--admin-border)]">
                    <th className="text-left p-4">Vendedor</th>
                    <th className="text-left p-4">Prêmio</th>
                    <th className="text-left p-4">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--admin-border)]/50 hover:bg-purple-900/10">
                      <td className="p-4 text-[var(--admin-text)]">{item.seller.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.prize.color }}
                          />
                          <span className="text-[var(--admin-text)]">{item.prize.label}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--admin-muted)]">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-[var(--admin-muted)]">
                        Nenhum giro registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
