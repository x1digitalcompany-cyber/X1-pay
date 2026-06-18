'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH = 'w-[200px]'

interface SidebarProps {
  /** Apenas mobile: drawer aberto */
  mobileOpen: boolean
  onMobileClose: () => void
  brandName: string
  logoUrl?: string
  userEmail?: string
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

function SidebarNav({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void
  pathname: string
}) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const [expanded, setExpanded] = useState<string[]>(['Vendedores', 'Marketing', 'Configurações'])

  function toggleExpand(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function linkActive(href: string) {
    if (href.includes('tab=')) {
      const tab = new URLSearchParams(href.split('?')[1]).get('tab')
      return pathname === '/admin/configuracoes' && currentTab === tab
    }
    if (href === '/admin/configuracoes') {
      return pathname === '/admin/configuracoes' && !currentTab
    }
    const base = href.split('?')[0]
    if (base === '/admin/vendedores') {
      return (
        pathname === '/admin/vendedores' ||
        (pathname.startsWith('/admin/vendedores/') && !pathname.includes('/roleta'))
      )
    }
    return pathname === base || pathname.startsWith(base + '/')
  }

  const iconMap: Record<string, typeof LayoutDashboard> = {
    Saques: Banknote,
    'Roleta de premiação': Dices,
    'Gerar link': Link2,
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2">
      {menuItems.map((item) => {
        if (item.children) {
          const isExp = expanded.includes(item.label)
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleExpand(item.label)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[var(--admin-muted)] hover:bg-purple-900/20 hover:text-[var(--admin-text)] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm truncate">{item.label}</span>
                </div>
                <ChevronDown size={14} className={cn('transition-transform shrink-0', isExp && 'rotate-180')} />
              </button>
              {isExp && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-purple-900/30 pl-2">
                  {item.children.map((child) => {
                    const ChildIcon = iconMap[child.label]
                    const active = linkActive(child.href)
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition',
                          active
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

        const active = linkActive(item.href!)
        return (
          <Link
            key={item.href}
            href={item.href!}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
              active
                ? 'bg-purple-700 text-white'
                : 'text-[var(--admin-muted)] hover:bg-purple-900/20 hover:text-[var(--admin-text)]'
            )}
          >
            <item.icon size={18} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarHeader({ brandName, logoUrl }: { brandName: string; logoUrl?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-purple-900/30 shrink-0">
      <div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-700/50 flex items-center justify-center overflow-hidden shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-purple-300 font-bold text-sm">
            {brandName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-[var(--admin-text)] truncate">
        {brandName}
      </span>
    </div>
  )
}

function SidebarFooter({ userEmail }: { userEmail?: string }) {
  return (
    <div className="border-t border-purple-900/30 p-4 space-y-2 shrink-0">
      {userEmail && (
        <p className="text-xs text-[var(--admin-muted)] truncate" title={userEmail}>
          {userEmail}
        </p>
      )}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-[var(--admin-muted)] hover:text-red-400 hover:bg-red-900/20 transition"
      >
        <LogOut size={16} />
        Sair
      </button>
    </div>
  )
}

function SidebarPanel({
  brandName,
  logoUrl,
  userEmail,
  pathname,
  onNavigate,
  showClose,
  onClose,
  className,
}: {
  brandName: string
  logoUrl?: string
  userEmail?: string
  pathname: string
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
  className?: string
}) {
  return (
    <aside
      className={cn(
        SIDEBAR_WIDTH,
        'shrink-0 flex flex-col bg-[var(--sidebar-bg)] border-r border-purple-900/30 h-full',
        className
      )}
    >
      <div className="relative shrink-0">
        <SidebarHeader brandName={brandName} logoUrl={logoUrl} />
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-3 text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <SidebarNav pathname={pathname} onNavigate={onNavigate} />
      <SidebarFooter userEmail={userEmail} />
    </aside>
  )
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
  brandName,
  logoUrl,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop (≥1024px): permanente, fixa à esquerda, sem colapsar */}
      <div className={cn('hidden lg:flex', SIDEBAR_WIDTH, 'shrink-0 sticky top-0 h-screen z-40')}>
        <SidebarPanel
          brandName={brandName}
          logoUrl={logoUrl}
          userEmail={userEmail}
          pathname={pathname}
          className="h-screen"
        />
      </div>

      {/* Mobile (<1024px): drawer sob demanda */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <SidebarPanel
              brandName={brandName}
              logoUrl={logoUrl}
              userEmail={userEmail}
              pathname={pathname}
              onNavigate={onMobileClose}
              showClose
              onClose={onMobileClose}
              className="h-full shadow-xl"
            />
          </div>
        </>
      )}
    </>
  )
}
