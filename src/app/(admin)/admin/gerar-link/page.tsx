'use client'
import { useEffect, useMemo, useState } from 'react'
import { Copy, Link2, History, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

interface CheckoutOption {
  id: string
  name: string
  slug: string
  productName: string
}

interface Seller {
  id: string
  name: string
}

interface LinkHistoryItem {
  url: string
  checkoutName: string
  sellerName: string
  createdAt: string
}

const STORAGE_KEY = 'x1pay-link-history'

export default function GerarLinkPage() {
  const [checkouts, setCheckouts] = useState<CheckoutOption[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<LinkHistoryItem[]>([])

  const [checkoutSlug, setCheckoutSlug] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')

  const inputClass =
    'w-full px-4 py-2 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text)] focus:outline-none focus:border-purple-500 text-sm'

  useEffect(() => {
    Promise.all([fetch('/api/produtos').then((r) => r.json()), fetch('/api/vendedores').then((r) => r.json())])
      .then(([products, sellersData]) => {
        const options: CheckoutOption[] = []
        for (const product of products) {
          for (const checkout of product.checkouts ?? []) {
            if (checkout.isActive) {
              options.push({
                id: checkout.id,
                name: checkout.name,
                slug: checkout.slug,
                productName: product.name,
              })
            }
          }
        }
        setCheckouts(options)
        setSellers(sellersData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      })
      .finally(() => setLoading(false))

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {
      /* ignore */
    }
  }, [])

  const generatedUrl = useMemo(() => {
    if (!checkoutSlug || typeof window === 'undefined') return ''
    const url = new URL(`${window.location.origin}/checkout/${checkoutSlug}`)
    if (sellerId) url.searchParams.set('src', sellerId)
    if (utmSource.trim()) url.searchParams.set('utm_source', utmSource.trim())
    if (utmMedium.trim()) url.searchParams.set('utm_medium', utmMedium.trim())
    if (utmCampaign.trim()) url.searchParams.set('utm_campaign', utmCampaign.trim())
    return url.toString()
  }, [checkoutSlug, sellerId, utmSource, utmMedium, utmCampaign])

  function saveToHistory(url: string) {
    const checkout = checkouts.find((c) => c.slug === checkoutSlug)
    const seller = sellers.find((s) => s.id === sellerId)
    const item: LinkHistoryItem = {
      url,
      checkoutName: checkout?.name ?? checkoutSlug,
      sellerName: seller?.name ?? 'Sem vendedor',
      createdAt: new Date().toISOString(),
    }
    const updated = [item, ...history.filter((h) => h.url !== url)].slice(0, 10)
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  async function handleCopy() {
    if (!generatedUrl) {
      toast.error('Selecione um checkout')
      return
    }
    await navigator.clipboard.writeText(generatedUrl)
    saveToHistory(generatedUrl)
    toast.success('Link copiado!')
  }

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
        <h1 className="text-2xl font-bold text-[var(--admin-text)]">Gerar link</h1>
        <p className="text-[var(--admin-muted)] text-sm mt-1">
          Crie links de checkout com rastreamento de vendedor e parâmetros UTM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--admin-text)] flex items-center gap-2">
            <Link2 size={18} /> Configurar link
          </h2>

          <div>
            <label className="block text-sm text-[var(--admin-muted)] mb-1">Checkout / Oferta</label>
            <select
              className={inputClass}
              value={checkoutSlug}
              onChange={(e) => setCheckoutSlug(e.target.value)}
            >
              <option value="">Selecione...</option>
              {checkouts.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} — {c.productName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--admin-muted)] mb-1">Vendedor (src)</label>
            <select
              className={inputClass}
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[var(--admin-muted)] mb-1">utm_source</label>
              <input
                className={inputClass}
                placeholder="instagram"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--admin-muted)] mb-1">utm_medium</label>
              <input
                className={inputClass}
                placeholder="social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--admin-muted)] mb-1">utm_campaign</label>
              <input
                className={inputClass}
                placeholder="promo-junho"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--admin-muted)] mb-1">Link gerado</label>
            <div className="flex gap-2">
              <input
                readOnly
                className={cn(inputClass, 'flex-1 font-mono text-xs')}
                value={generatedUrl}
                placeholder="Selecione um checkout para gerar o link"
              />
              <button
                onClick={handleCopy}
                disabled={!generatedUrl}
                className="px-4 py-2 rounded-lg gradient-brand text-white text-sm flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>

          {generatedUrl && (
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-purple-400 hover:underline"
            >
              <ExternalLink size={14} /> Abrir checkout
            </a>
          )}
        </div>

        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-6">
          <h2 className="font-semibold text-[var(--admin-text)] flex items-center gap-2 mb-4">
            <History size={18} /> Histórico (últimos 10)
          </h2>
          {history.length === 0 ? (
            <p className="text-[var(--admin-muted)] text-sm text-center py-8">
              Nenhum link copiado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item, i) => (
                <div
                  key={`${item.url}-${i}`}
                  className="p-3 rounded-lg bg-[var(--admin-bg)] border border-[var(--admin-border)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--admin-text)] font-medium truncate">
                        {item.checkoutName}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {item.sellerName} · {formatDate(item.createdAt)}
                      </p>
                      <p className="text-xs text-purple-400 font-mono truncate mt-1">{item.url}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.url)
                        toast.success('Link copiado!')
                      }}
                      className="p-1.5 text-[var(--admin-muted)] hover:text-purple-400 shrink-0"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
