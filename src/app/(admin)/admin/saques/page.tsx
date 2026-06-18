'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, Clock } from 'lucide-react'

interface Withdrawal {
  id: string
  amount: number
  status: string
  notes: string | null
  createdAt: string
  seller: { name: string }
}

export default function SaquesPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/saques').then((r) => r.json())
    setWithdrawals(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(() => withdrawals.filter((w) => w.status === 'PENDING'), [withdrawals])
  const history = useMemo(
    () => withdrawals.filter((w) => w.status === 'PAID' || w.status === 'REJECTED'),
    [withdrawals]
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Saques</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Aprovou? Faça o Pix por fora e marque como pago anexando o comprovante.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="font-medium text-[var(--admin-text)] flex items-center gap-2">
              <Clock size={18} className="text-yellow-400" />
              Aguardando pagamento ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-12 text-center">
                <Banknote size={36} className="mx-auto mb-3 text-purple-800" />
                <p className="text-[var(--admin-muted)]">Nenhum saque pendente no momento.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {pending.map((w) => (
                  <li key={w.id} className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4 flex justify-between">
                    <span className="text-[var(--admin-text)]">{w.seller.name}</span>
                    <span className="text-yellow-400 font-medium">R$ {w.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-medium text-[var(--admin-text)]">Histórico</h2>
            {history.length === 0 ? (
              <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-12 text-center">
                <p className="text-[var(--admin-text)]">Nenhum saque processado ainda</p>
                <p className="text-[var(--admin-muted)] text-sm mt-2">
                  O histórico aparece aqui depois que você paga ou rejeita o primeiro saque.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {history.map((w) => (
                  <li key={w.id} className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4 flex justify-between">
                    <div>
                      <span className="text-[var(--admin-text)]">{w.seller.name}</span>
                      <span className="text-[var(--admin-muted)] text-xs ml-2">{w.status}</span>
                    </div>
                    <span className="text-[var(--admin-text)]">R$ {w.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
