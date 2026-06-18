'use client'
import { useState } from 'react'
import { Target } from 'lucide-react'

interface MetaModalProps {
  currentGoal: number
  onSave: (goal: number) => Promise<void>
}

export function MetaModal({ currentGoal, onSave }: MetaModalProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(currentGoal)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(goal)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-800/50 text-sm hover:bg-purple-900/50 transition"
      >
        <Target size={16} className="text-purple-400" />
        <span>Definir meta do mês</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              Meta de lucro
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Quanto de lucro você quer este mês? (líquido, já descontando taxas, comissões e custos)
            </p>
            <label className="block text-sm text-gray-400 mb-1">Valor da meta (R$)</label>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
              >
                Agora não
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg gradient-brand text-white font-medium disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Definir meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
