'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Trash2, Plus, Loader2 } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
}

interface PushSub {
  id: string
  endpoint: string
  createdAt: string
}

interface WebhookLogEntry {
  event: string
  status: number
  date: string
}

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
      luminarDashboardUrl: '',
      monthlyGoal: 0,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      webhookUrl: '',
      webhookLog: '[]',
    },
  })

  const [employees, setEmployees] = useState<Employee[]>([])
  const [pushSubs, setPushSubs] = useState<PushSub[]>([])
  const [empModal, setEmpModal] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [empForm, setEmpForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)
  const [vapidLoading, setVapidLoading] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [luminarTesting, setLuminarTesting] = useState(false)
  const [webhookTesting, setWebhookTesting] = useState(false)

  const loadConfig = useCallback(() => {
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

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (tab === 'funcionarios') {
      fetch('/api/funcionarios').then((r) => r.json()).then(setEmployees)
    }
    if (tab === 'notificacoes') {
      fetch('/api/configuracoes/push-subscription').then((r) => r.json()).then(setPushSubs)
    }
  }, [tab])

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

  async function saveEmployee() {
    if (!empForm.name || !empForm.email) return toast.error('Nome e email obrigatórios')
    if (!editEmp && (!empForm.password || empForm.password !== empForm.confirm)) {
      return toast.error('Senhas não conferem')
    }
    if (editEmp && empForm.password && empForm.password !== empForm.confirm) {
      return toast.error('Senhas não conferem')
    }

    const url = editEmp ? `/api/funcionarios/${editEmp.id}` : '/api/funcionarios'
    const method = editEmp ? 'PUT' : 'POST'
    const body: Record<string, string> = { name: empForm.name, email: empForm.email }
    if (empForm.password) body.password = empForm.password

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editEmp ? 'Funcionário atualizado' : 'Funcionário criado')
      setEmpModal(false)
      setEditEmp(null)
      setEmpForm({ name: '', email: '', password: '', confirm: '' })
      fetch('/api/funcionarios').then((r) => r.json()).then(setEmployees)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro')
    }
  }

  async function toggleEmployee(emp: Employee) {
    await fetch(`/api/funcionarios/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !emp.isActive }),
    })
    fetch('/api/funcionarios').then((r) => r.json()).then(setEmployees)
  }

  async function deleteEmployee(id: string) {
    if (!confirm('Excluir funcionário?')) return
    await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' })
    fetch('/api/funcionarios').then((r) => r.json()).then(setEmployees)
    toast.success('Funcionário excluído')
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('Senhas não conferem')
    setPwdSaving(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd }),
    })
    setPwdSaving(false)
    if (res.ok) {
      toast.success('Senha alterada!')
      setPwdForm({ current: '', newPwd: '', confirm: '' })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Erro')
    }
  }

  async function generateVapid() {
    setVapidLoading(true)
    const res = await fetch('/api/configuracoes/vapid', { method: 'POST' })
    setVapidLoading(false)
    if (res.ok) {
      const { publicKey } = await res.json()
      setData((d) => ({ ...d, settings: { ...d.settings, vapidPublicKey: publicKey } }))
      toast.success('Par VAPID gerado!')
      loadConfig()
    } else toast.error('Erro ao gerar chaves')
  }

  async function activatePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return toast.error('Push não suportado neste navegador')
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return toast.error('Permissão negada')

    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = data.settings.vapidPublicKey
      if (!vapidKey) {
        toast.error('Gere as chaves VAPID primeiro')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      await fetch('/api/configuracoes/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      })
      toast.success('Notificações ativadas!')
      fetch('/api/configuracoes/push-subscription').then((r) => r.json()).then(setPushSubs)
    } catch {
      toast.error('Erro ao ativar notificações')
    } finally {
      setPushLoading(false)
    }
  }

  async function removePushSub(id: string) {
    await fetch(`/api/configuracoes/push-subscription?id=${id}`, { method: 'DELETE' })
    setPushSubs((s) => s.filter((x) => x.id !== id))
    toast.success('Dispositivo removido')
  }

  async function testLuminar() {
    const url = data.settings.luminarTrackUrl
    if (!url) return toast.error('Informe a URL Luminar Track')
    setLuminarTesting(true)
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 5000)
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal })
      clearTimeout(t)
      toast.success(res.ok ? 'Conexão OK!' : `Resposta: ${res.status}`)
    } catch {
      toast.error('Falha na conexão (timeout ou erro)')
    } finally {
      setLuminarTesting(false)
    }
  }

  async function testWebhook() {
    setWebhookTesting(true)
    const res = await fetch('/api/configuracoes/test-webhook', { method: 'POST' })
    setWebhookTesting(false)
    if (res.ok) {
      toast.success('Webhook de teste enviado!')
      loadConfig()
    } else toast.error('Erro ao testar webhook')
  }

  const webhookLog: WebhookLogEntry[] = (() => {
    try {
      return JSON.parse(data.settings.webhookLog || '[]')
    } catch {
      return []
    }
  })()

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-input-bg,#0f0a1e)] border border-purple-900/50 text-white focus:outline-none focus:border-purple-500'

  const tabs = [
    { id: 'geral', label: 'Geral', href: '/admin/configuracoes' },
    { id: 'pagamento', label: 'Pagamento', href: '/admin/configuracoes?tab=pagamento' },
    { id: 'logistica', label: 'Logística', href: '/admin/configuracoes?tab=logistica' },
    { id: 'rastreamento', label: 'Rastreamento', href: '/admin/configuracoes?tab=rastreamento' },
    { id: 'funcionarios', label: 'Funcionários', href: '/admin/configuracoes?tab=funcionarios' },
    { id: 'notificacoes', label: 'Notificações', href: '/admin/configuracoes?tab=notificacoes' },
    { id: 'seguranca', label: 'Segurança', href: '/admin/configuracoes?tab=seguranca' },
    { id: 'webhook', label: 'Webhook', href: '/admin/configuracoes?tab=webhook' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const settingsTabs = ['geral', 'pagamento', 'logistica', 'rastreamento', 'webhook']

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <div className="flex flex-wrap gap-2 border-b border-purple-900/30 pb-2">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={t.href}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              tab === t.id ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {settingsTabs.includes(tab) && (
        <form onSubmit={handleSave} className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
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
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((n) => {
                    const key = `taxCard${n}x` as keyof typeof data.settings
                    return (
                      <div key={n}>
                        <label className="block text-xs text-gray-400 mb-1">{n}x</label>
                        <input
                          type="number"
                          step="0.01"
                          className={inputClass}
                          value={data.settings[key] as number}
                          onChange={(e) => setData({ ...data, settings: { ...data.settings, [key]: Number(e.target.value) } })}
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
            </>
          )}

          {tab === 'rastreamento' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL Luminar Track</label>
                <input className={inputClass} value={data.settings.luminarTrackUrl || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, luminarTrackUrl: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Token postback Payt</label>
                <input className={inputClass} value={data.settings.logisticsPostbackKey || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, logisticsPostbackKey: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL dashboard Luminar</label>
                <input className={inputClass} value={data.settings.luminarDashboardUrl || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, luminarDashboardUrl: e.target.value } })} />
              </div>
              <button
                type="button"
                onClick={testLuminar}
                disabled={luminarTesting}
                className="px-4 py-2 rounded-lg bg-purple-900/50 text-white text-sm disabled:opacity-50"
              >
                {luminarTesting ? 'Testando...' : 'Testar conexão Luminar'}
              </button>
            </>
          )}

          {tab === 'webhook' && (
            <>
              <p className="text-sm text-gray-400">
                Quando um pedido for marcado como PAID, o sistema fará POST para esta URL com o objeto do pedido.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL do webhook de pedido pago</label>
                <input className={inputClass} value={data.settings.webhookUrl || ''} onChange={(e) => setData({ ...data, settings: { ...data.settings, webhookUrl: e.target.value } })} />
              </div>
              <button
                type="button"
                onClick={testWebhook}
                disabled={webhookTesting}
                className="px-4 py-2 rounded-lg bg-purple-900/50 text-white text-sm disabled:opacity-50"
              >
                {webhookTesting ? 'Enviando...' : 'Testar webhook'}
              </button>
              {webhookLog.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-300 font-medium mb-2">Últimos disparos</p>
                  <div className="space-y-2">
                    {webhookLog.map((entry, i) => (
                      <div key={i} className="flex justify-between text-sm bg-[#0f0a1e] rounded-lg px-3 py-2">
                        <span className="text-gray-400">{entry.event}</span>
                        <span className={entry.status >= 200 && entry.status < 300 ? 'text-green-400' : 'text-red-400'}>
                          HTTP {entry.status}
                        </span>
                        <span className="text-gray-500">{new Date(entry.date).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={saving} className="w-full py-3 rounded-lg gradient-brand text-white font-semibold disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      )}

      {tab === 'funcionarios' && (
        <div className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Gerencie os funcionários com acesso ao painel.</p>
            <button
              type="button"
              onClick={() => { setEditEmp(null); setEmpForm({ name: '', email: '', password: '', confirm: '' }); setEmpModal(true) }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg gradient-brand text-white text-sm"
            >
              <Plus size={16} /> Novo funcionário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-purple-900/30">
                  <th className="text-left py-2">Nome</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-purple-900/20">
                    <td className="py-2 text-white">{emp.name}</td>
                    <td className="py-2 text-gray-300">{emp.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${emp.isActive ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                        {emp.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <button type="button" onClick={() => { setEditEmp(emp); setEmpForm({ name: emp.name, email: emp.email, password: '', confirm: '' }); setEmpModal(true) }} className="text-purple-400 text-xs">Editar</button>
                      <button type="button" onClick={() => toggleEmployee(emp)} className="text-yellow-400 text-xs">{emp.isActive ? 'Desativar' : 'Ativar'}</button>
                      <button type="button" onClick={() => deleteEmployee(emp.id)} className="text-red-400 text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">Nenhum funcionário cadastrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'notificacoes' && (
        <div className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
          <p className="text-sm text-gray-400">Receba notificações no navegador quando um pedido for pago.</p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">VAPID Public Key</label>
            <input className={inputClass} readOnly value={data.settings.vapidPublicKey || 'Não configurada'} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={generateVapid} disabled={vapidLoading} className="px-4 py-2 rounded-lg bg-purple-900/50 text-white text-sm disabled:opacity-50">
              {vapidLoading ? 'Gerando...' : 'Gerar par de chaves'}
            </button>
            <button type="button" onClick={activatePush} disabled={pushLoading} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm disabled:opacity-50">
              {pushLoading ? <Loader2 className="animate-spin" size={16} /> : 'Ativar notificações neste dispositivo'}
            </button>
          </div>
          {pushSubs.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-300 font-medium">Dispositivos inscritos</p>
              {pushSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between bg-[#0f0a1e] rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-400 truncate max-w-xs">{sub.endpoint.slice(0, 50)}...</span>
                  <span className="text-gray-500 text-xs">{new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                  <button type="button" onClick={() => removePushSub(sub.id)} className="text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'seguranca' && (
        <div className="space-y-6">
          <form onSubmit={changePassword} className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-white font-medium">Alterar senha</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha atual</label>
              <input type="password" className={inputClass} value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nova senha</label>
              <input type="password" className={inputClass} value={pwdForm.newPwd} onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirmar nova senha</label>
              <input type="password" className={inputClass} value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} required />
            </div>
            <button type="submit" disabled={pwdSaving} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm disabled:opacity-50">
              {pwdSaving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>

          <div className="space-y-4 bg-[var(--admin-panel-bg,#1a1030)] rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-white font-medium">Sessões ativas</h3>
            <p className="text-sm text-gray-400">Sua sessão JWT expira automaticamente após o período configurado.</p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 rounded-lg bg-red-900/40 text-red-400 text-sm"
            >
              Encerrar todas as sessões
            </button>
          </div>
        </div>
      )}

      {empModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1030] rounded-xl border border-purple-900/30 p-6 w-full max-w-md space-y-4">
            <h3 className="text-white font-medium">{editEmp ? 'Editar funcionário' : 'Novo funcionário'}</h3>
            <input className={inputClass} placeholder="Nome" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
            <input className={inputClass} placeholder="Email" type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
            <input className={inputClass} placeholder={editEmp ? 'Nova senha (opcional)' : 'Senha'} type="password" value={empForm.password} onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} />
            <input className={inputClass} placeholder="Confirmar senha" type="password" value={empForm.confirm} onChange={(e) => setEmpForm({ ...empForm, confirm: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEmpModal(false)} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">Cancelar</button>
              <button type="button" onClick={saveEmployee} className="flex-1 py-2 rounded-lg gradient-brand text-white text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
