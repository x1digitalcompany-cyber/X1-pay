'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { cn, formatDate, maskPhone } from '@/lib/utils'
import { toast } from 'sonner'

interface CartDetail {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  src: string | null
  checkoutSlug: string
  checkoutName: string | null
  productName: string | null
  createdAt: string
  updatedAt: string
  converted: boolean
  convertedOrderId: string | null
}

export default function CarrinhoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cart, setCart] = useState<CartDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/carrinho-abandonado/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setCart)
      .catch(() => toast.error('Carrinho não encontrado'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Remover este carrinho permanentemente?')) return
    setDeleting(true)
    await fetch(`/api/carrinho-abandonado/${id}`, { method: 'DELETE' })
    toast.success('Carrinho removido')
    router.push('/admin/carrinho-abandonado')
  }

  function displayEmail(email: string | null) {
    if (!email || email.startsWith('no-email-')) return '—'
    return email
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--admin-muted)] mb-4">Carrinho não encontrado</p>
        <Link href="/admin/carrinho-abandonado" className="text-purple-400 hover:underline">
          Voltar para carrinhos
        </Link>
      </div>
    )
  }

  const sectionClass = 'bg-[var(--admin-panel-bg)] rounded-xl border border-[var(--admin-border)] p-5 space-y-4'
  const labelClass = 'text-xs text-[var(--admin-muted)] uppercase tracking-wide'
  const valueClass = 'text-[var(--admin-text)] text-sm mt-0.5'

  function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--admin-text)] truncate">
            {cart.name || 'Carrinho sem nome'}
          </h1>
          <p className="text-[var(--admin-muted)] text-sm">
            {cart.productName}
            {cart.checkoutName ? ` — ${cart.checkoutName}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
            cart.converted
              ? 'bg-green-900/30 text-green-400'
              : 'bg-yellow-900/30 text-yellow-400'
          )}
        >
          {cart.converted ? 'Convertido' : 'Abandonado'}
        </span>
      </div>

      {/* Dados do lead */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 font-semibold text-[var(--admin-text)]">
          <ShoppingBag size={16} className="text-purple-400" /> Dados do lead
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" value={cart.name} />
          <Field label="Telefone" value={cart.phone ? maskPhone(cart.phone) : null} />
          <Field label="E-mail" value={displayEmail(cart.email)} />
          <Field label="Origem (src)" value={cart.src} />
          <Field label="Registrado em" value={formatDate(cart.createdAt)} />
          <Field label="Última atualização" value={formatDate(cart.updatedAt)} />
        </div>
      </div>

      {/* Checkout */}
      <div className={sectionClass}>
        <p className="font-semibold text-[var(--admin-text)]">Checkout</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Oferta" value={cart.checkoutName} />
          <Field label="Produto" value={cart.productName} />
          <div>
            <p className={labelClass}>Link do checkout</p>
            <a
              href={`/checkout/${cart.checkoutSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline text-sm flex items-center gap-1 mt-0.5"
            >
              /checkout/{cart.checkoutSlug} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Conversão */}
      {cart.converted && cart.convertedOrderId && (
        <div className="bg-[var(--admin-panel-bg)] rounded-xl border border-green-900/40 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 size={16} />
              <span className="font-semibold text-sm">Lead convertido em pedido</span>
            </div>
            <Link
              href={`/admin/pedidos/${cart.convertedOrderId}`}
              className="text-purple-400 hover:underline text-sm flex items-center gap-1"
            >
              Ver pedido <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-800/50 text-red-400 text-sm hover:bg-red-900/20 transition disabled:opacity-50"
        >
          <Trash2 size={15} />
          {deleting ? 'Removendo...' : 'Remover carrinho'}
        </button>
      </div>
    </div>
  )
}
