'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'geral'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    brandName: '',
    brandColor: '#7c3aed',
    logoUrl: '',
    currency: 'BRL',
    maxInstallments: 12,
    settings: {
      gateway: 'pagarme',
      pagarmeSecretKey: '',
      taxPix: 0.69,
      taxBoleto: 2.99,
      taxGateway: 0.35,
      taxAntifraude: 0.35,
      taxCard1x: 3.69,
      taxCard2x: 5.19,
      taxCard3x: 6.22,
      taxCard4x: 7.25,
      taxCard5x: 8.28,
      taxCard6x: 9.31,
      taxCard7x: 10.46,
      taxCard8x: 11.49,
      taxCard9x: 12.52,
      taxCard10x: 13.55,
      taxCard11x: 14.58,
      taxCard12x: 15.61,
      logisticsEnabled: false,
      logisticsProvider: '123log',
      logisticsApiUrl: '',
      logisticsApiKey: '',
      logisticsOrigin: '',
      logisticsPostbackKey: '',
      luminarTrackUrl: '',
      monthlyGoal: 0,
    },
  })

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((res) => {
        setData((prev) => ({
          brandName: res.brandName || '',
          brandColor: res.brandColor || '#7c3aed',
          logoUrl: res.logoUrl || '',
          currency: res.currency || 'BRL',
          maxInstallments: res.maxInstallments || 12,
          settings: { ...prev.settings, ...res.settings },
        }))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) toast.success('Configurações salvas!')
    else toast.error('Erro ao salvar')
  }

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[#0f0a1e] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  const tabs = [
    { id: 'geral', label: 'Geral', href: '/admin/configuracoes' },
    { id: 'pagamento', label: 'Pagamento', href: '/admin/configuracoes?tab=pagamento' },
    { id: 'logistica', label: 'Logística', href: '/admin/configuracoes?tab=logistica' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <div className="flex gap-2 border-b border-purple-900/30 pb-2">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={t.href}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              tab === t.id ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4 bg-[#1a1030] rounded-xl border border-purple-900/30 p-6">
        {tab === 'geral' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome da marca</label>
              <input className={inputClass} value={data.brandName} onChange={(e) => setData({ ...data, brandName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cor da marca</label>
              <input type="color" className="w-16 h-10 rounded cursor-pointer" value={data.brandColor} onChange={(e) => setData({ ...data, brandColor: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL do logo</label>
              <input className={inputClass} value={data.logoUrl} onChange={(e) => setData({ ...data, logoUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Máx. parcelas</label>
              <input type="number" className={inputClass} value={data.maxInstallments} onChange={(e) => setData({ ...data, maxInstallments: Number(e.target.value) })} />
            </div>
          </>
        )}

        {tab === 'pagamento' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chave secreta Pagar.me</label>
              <input
                type="password"
                className={inputClass}
                value={data.settings.pagarmeSecretKey || ''}
                onChange={(e) => setData({ ...data, settings: { ...data.settings, pagarmeSecretKey: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taxa PIX (%)</label>
                <input type="number" step="0.01" className={inputClass} value={data.settings.taxPix} onChange={(e) => setData({ ...data, settings: { ...data.settings, taxPix: Number(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taxa Boleto (R$)</label>
                <input type="number" step="0.01" className={inputClass} value={data.settings.taxBoleto} onChange={(e) => setData({ ...data, settings: { ...data.settings, taxBoleto: Number(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taxa Gateway (R$)</label>
                <input type="number" step="0.01" className={inputClass} value={data.settings.taxGateway} onChange={(e) => setData({ ...data, settings: { ...data.settings, taxGateway: Number(e.target.value) } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taxa Antifraude (R$)</label>
                <input type="number" step="0.01" className={inputClass} value={data.settings.taxAntifraude} onChange={(e) => setData({ ...data, settings: { ...data.settings, taxAntifraude: Number(e.target.value) } })} />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-300 font-medium mb-3">Taxas de cartão por parcela (%)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([1,2,3,4,5,6,7,8,9,10,11,12] as const).map((n) => {
                  const key = `taxCard${n}x` as keyof typeof data.settings
                  return (
                    <div key={n}>
                      <label className="block text-xs text-gray-400 mb-1">{n}x</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={data.settings[key] as number}
                        onChange={(e) =>
                          setData({ ...data, settings: { ...data.settings, [key]: Number(e.target.value) } })
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'logistica' && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="logisticsEnabled"
                checked={data.settings.logisticsEnabled}
                onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsEnabled: e.target.checked } })}
              />
              <label htmlFor="logisticsEnabled" className="text-sm text-gray-300">Habilitar logística</label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL da API</label>
              <input className={inputClass} value={data.settings.logisticsApiUrl || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsApiUrl: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">API Key</label>
              <input type="password" className={inputClass} value={data.settings.logisticsApiKey || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsApiKey: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Origem</label>
              <input className={inputClass} value={data.settings.logisticsOrigin || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsOrigin: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Token webhook (Payt)</label>
              <input className={inputClass} value={data.settings.logisticsPostbackKey || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsPostbackKey: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Luminar Track URL</label>
              <input className={inputClass} value={data.settings.luminarTrackUrl || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, luminarTrackUrl: e.target.value } })} />
            </div>
          </>
        )}

        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
