'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Gift,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SpinPrize {
  id: string
  label: string
  probability: number
  color: string
  isActive: boolean
}

const emptyPrizeForm = { label: '', probability: 10, color: '#7c3aed' }
const ROULETTE_STORAGE_KEY = 'x1pay-roulette-enabled'

export default function RoletaPremiacaoPage() {
  const [prizes, setPrizes] = useState<SpinPrize[]>([])
  const [loading, setLoading] = useState(true)
  const [rouletteEnabled, setRouletteEnabled] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [editingPrize, setEditingPrize] = useState<SpinPrize | null>(null)
  const [prizeForm, setPrizeForm] = useState(emptyPrizeForm)
  const [savingPrize, setSavingPrize] = useState(false)

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  const loadPrizes = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/roleta/premios').then((r) => r.json())
    setPrizes(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPrizes()
    const stored = localStorage.getItem(ROULETTE_STORAGE_KEY)
    if (stored !== null) setRouletteEnabled(stored === 'true')

    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((res) => {
        const settings = res.settings as Record<string, unknown> | null
        if (settings && typeof settings.rouletteEnabled === 'boolean') {
          setRouletteEnabled(settings.rouletteEnabled)
        }
      })
      .catch(() => {})
  }, [loadPrizes])

  const activeCount = prizes.filter((p) => p.isActive).length

  async function handleToggleRoulette() {
    const next = !rouletteEnabled
    setSavingToggle(true)

    const res = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { rouletteEnabled: next } }),
    })

    if (res.ok) {
      setRouletteEnabled(next)
      localStorage.setItem(ROULETTE_STORAGE_KEY, String(next))
      toast.success(next ? 'Roleta liberada pros atendentes' : 'Roleta fechada')
    } else {
      setRouletteEnabled(next)
      localStorage.setItem(ROULETTE_STORAGE_KEY, String(next))
      toast.success(next ? 'Roleta liberada (local)' : 'Roleta fechada (local)')
    }

    setSavingToggle(false)
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Roleta de premiação</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Cadastre os prêmios, libere pros atendentes e gire ao vivo.
        </p>
      </div>

      <section className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">A roleta</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleToggleRoulette}
            disabled={savingToggle}
            className="flex items-center gap-3 text-[var(--admin-text)] disabled:opacity-50"
          >
            {rouletteEnabled ? (
              <ToggleRight size={28} className="text-green-400 shrink-0" />
            ) : (
              <ToggleLeft size={28} className="text-[var(--admin-muted)] shrink-0" />
            )}
            <span className="text-sm font-medium">
              {rouletteEnabled ? 'Liberada pros atendentes' : 'Fechada'}
            </span>
          </button>
        </div>
        {activeCount < 2 && (
          <div className="flex items-start gap-2 text-sm text-yellow-500/90 bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>
              É preciso{' '}
              <Link href="#premios" className="underline hover:text-yellow-400">
                pelo menos 2 prêmios ativos
              </Link>{' '}
              para girar a roleta.
            </p>
          </div>
        )}
      </section>

      <section id="premios" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Prêmios cadastrados</h2>
          <button
            type="button"
            onClick={() => openPrizeForm()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-brand text-white text-sm"
          >
            <Plus size={16} /> Novo
          </button>
        </div>

        {showPrizeForm && (
          <form
            onSubmit={handleSavePrize}
            className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4"
          >
            <h3 className="text-[var(--admin-text)] font-semibold">
              {editingPrize ? 'Editar prêmio' : 'Novo prêmio'}
            </h3>
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
        ) : prizes.length === 0 ? (
          <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
            <Gift size={40} className="mx-auto mb-3 text-purple-700" />
            <p className="text-[var(--admin-muted)]">
              Nenhum prêmio cadastrado ainda. Crie o primeiro pra começar.
            </p>
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
                        type="button"
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
                          type="button"
                          onClick={() => openPrizeForm(prize)}
                          className="text-xs text-purple-400 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePrize(prize.id)}
                          className="text-[var(--admin-muted)] hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
