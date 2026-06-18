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
  {
    label: 'Vendedores',
    icon: Users,
    children: [
      { href: '/admin/vendedores', label: 'Ranking' },
      { href: '/admin/vendedores/lista', label: 'Todos' },
    ],
  },
  { href: '/admin/acerto-logistica', label: 'Acerto logística', icon: Truck },
  {
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { href: '/admin/cupons', label: 'Cupons' },
    ],
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { href: '/admin/configuracoes', label: 'Geral' },
      { href: '/admin/configuracoes?tab=pagamento', label: 'Pagamento' },
      { href: '/admin/configuracoes?tab=logistica', label: 'Logística' },
    ],
  },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])

  function toggleExpand(label: string) {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] z-50 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-[var(--admin-muted)] hover:text-[var(--admin-text)] lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item) => {
            if (item.children) {
              const isExp = expanded.includes(item.label)
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-300 hover:bg-purple-900/20 hover:text-white transition"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform', isExp && 'rotate-180')}
                    />
                  </button>
                  {isExp && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition',
                            pathname === child.href.split('?')[0]
                              ? 'bg-purple-700 text-white'
                              : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-purple-900/20'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
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
                  pathname === item.href
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
