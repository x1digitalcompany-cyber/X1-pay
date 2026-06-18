'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportarRastreiosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return toast.error('Selecione um arquivo .xlsx')
    setImporting(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/pedidos/importar-rastreios', { method: 'POST', body: fd })
    setImporting(false)
    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.updated} rastreios atualizados`)
      if (data.notFound?.length) toast.error(`${data.notFound.length} pedidos não encontrados`)
      setFile(null)
    } else {
      toast.error('Erro ao importar')
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-purple-400 hover:underline">
          ← Voltar para pedidos
        </Link>
        <h1 className="text-2xl font-bold text-[var(--admin-text)] mt-2">Importar rastreios</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Envie uma planilha .xlsx com as colunas <code className="text-purple-300">order_id</code> e{' '}
          <code className="text-purple-300">tracking_code</code> (opcional: <code className="text-purple-300">tracking_url</code>).
        </p>
      </div>

      <form
        onSubmit={handleImport}
        className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4"
      >
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--admin-bg)] border border-dashed border-[var(--admin-border)]">
          <FileSpreadsheet size={24} className="text-purple-400 shrink-0" />
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-[var(--admin-muted)]"
          />
        </div>
        <button
          type="submit"
          disabled={importing || !file}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg gradient-brand text-white font-medium disabled:opacity-50"
        >
          <Upload size={16} />
          {importing ? 'Importando...' : 'Importar rastreios'}
        </button>
      </form>
    </div>
  )
}
