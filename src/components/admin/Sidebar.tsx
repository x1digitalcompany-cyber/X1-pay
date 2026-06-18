'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Megaphone,
  Settings,
  X,
  ChevronDown,
  ShoppingBag,
  Banknote,
  Dices,
  Link2,
  Calculator,
  FileText,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/carrinhos', label: 'Carrinho abandonado', icon: ShoppingBag },
  {
    label: 'Vendedores',
    icon: Users,
    children: [
      { href: '/admin/vendedores', label: 'Vendedores' },
      { href: '/admin/saques', label: 'Saques' },
      { href: '/admin/vendedores/roleta', label: 'Roleta de premiação' },
    ],
  },
  { href: '/admin/relatorios/logistica', label: 'Acerto logística', icon: Truck },
  { href: '/admin/simulador', label: 'Simulador', icon: Calculator },
  { href: '/admin/logs', label: 'Logs de webhook', icon: FileText },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { href: '/admin/cupons', label: 'Cupons' },
      { href: '/admin/gerar-link', label: 'Gerar link' },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { href: '/admin/configuracoes', label: 'Geral' },
      { href: '/admin/configuracoes?tab=pagamento', label: 'Pagamento' },
      { href: '/admin/configuracoes?tab=logistica', label: 'Logística' },
      { href: '/admin/configuracoes?tab=parcelamentos', label: 'Parcelamentos' },
      { href: '/admin/configuracoes?tab=track', label: 'Luminar Track' },
      { href: '/admin/configuracoes?tab=dashboard', label: 'Dashboard Luminar' },
      { href: '/admin/configuracoes?tab=funcionarios', label: 'Funcionários' },
      { href: '/admin/configuracoes?tab=notificacoes', label: 'Notificações' },
      { href: '/admin/configuracoes?tab=seguranca', label: 'Segurança' },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['Vendedores', 'Marketing', 'Configurações'])

  function toggleExpand(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function isActive(href: string) {
    const base = href.split('?')[0]
    if (base === '/admin/configuracoes') {
      return pathname === '/admin/configuracoes'
    }
    return pathname === base || pathname.startsWith(base + '/')
  }

  const iconMap: Record<string, typeof LayoutDashboard> = {
    Saques: Banknote,
    'Roleta de premiação': Dices,
    'Gerar link': Link2,
    Parcelamentos: CreditCard,
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] z-50 flex flex-col shadow-xl">
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {menuItems.map((item) => {
            if (item.children) {
              const isExp = expanded.includes(item.label)
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[var(--admin-muted)] hover:bg-purple-900/20 hover:text-[var(--admin-text)] transition"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronDown size={14} className={cn('transition-transform', isExp && 'rotate-180')} />
                  </button>
                  {isExp && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = iconMap[child.label]
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                              isActive(child.href)
                                ? 'bg-purple-700 text-white'
                                : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-purple-900/20'
                            )}
                          >
                            {ChildIcon && <ChildIcon size={14} />}
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                  isActive(item.href!)
                    ? 'bg-purple-700 text-white'
                    : 'text-[var(--admin-muted)] hover:bg-purple-900/20 hover:text-[var(--admin-text)]'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
