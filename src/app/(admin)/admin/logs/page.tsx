'use client'
import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface WebhookLogEntry {
  event: string
  status: number
  date: string
  payload?: unknown
  value?: number
}

function statusLabel(status: number) {
  if (status >= 200 && status < 300) return 'Sucesso'
  if (status >= 400) return 'Erro'
  return 'Enviado'
}

function statusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-900/30 text-green-400'
  if (status >= 400) return 'bg-red-900/30 text-red-400'
  return 'bg-yellow-900/30 text-yellow-400'
}

export default function LogsPage() {
  const [logs, setLogs] = useState<WebhookLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((res) => {
        try {
          const parsed = JSON.parse(res.settings?.webhookLog || '[]')
          setLogs(Array.isArray(parsed) ? parsed : [])
        } catch {
          setLogs([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Logs de webhook</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Cada envio de venda aos webhooks de saída — com valor, status e o JSON enviado.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-16 text-center">
          <FileText size={40} className="mx-auto mb-3 text-purple-700" />
          <p className="text-[var(--admin-text)] font-medium">
            Nenhuma entrega de webhook registrada ainda.
          </p>
          <p className="text-[var(--admin-muted)] text-sm mt-2">
            Assim que uma venda for enviada a um destino, ela aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((entry, i) => (
            <div
              key={`${entry.date}-${i}`}
              className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--admin-text)] font-medium">{entry.event}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(entry.status)}`}>
                    {entry.status} — {statusLabel(entry.status)}
                  </span>
                </div>
                <span className="text-xs text-[var(--admin-muted)]">
                  {formatDate(entry.date)}
                </span>
              </div>
              {entry.value !== undefined && (
                <p className="text-sm text-[var(--admin-muted)] mb-2">
                  Valor: <span className="text-[var(--admin-text)]">{entry.value}</span>
                </p>
              )}
              {entry.payload !== undefined && (
                <pre className="text-xs bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-lg p-3 overflow-x-auto text-[var(--admin-muted)]">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
