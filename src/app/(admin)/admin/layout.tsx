'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'
import { Menu, Moon, Sun } from 'lucide-react'
import { MetaModal } from '@/components/admin/MetaModal'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [config, setConfig] = useState<{
    brandName: string
    logoUrl?: string
    brandColor?: string
    monthlyGoal: number
  }>({ brandName: 'X1 Pay', logoUrl: undefined, brandColor: '#7c3aed', monthlyGoal: 0 })

  const [theme, setTheme] = useState<'dark' | 'light'>(() => 'dark')

  useEffect(() => {
    if (session) {
      fetch('/api/configuracoes')
        .then((r) => r.json())
        .then((data) => {
          setConfig({
            brandName: data.brandName || 'X1 Pay',
            logoUrl: data.logoUrl || undefined,
            brandColor: data.brandColor || '#7c3aed',
            monthlyGoal: data.settings?.monthlyGoal ?? 0,
          })
        })
        .catch(() => {})
    }
  }, [session])

  useEffect(() => {
    // Aplica classe do Tailwind + CSS vars (.dark) no documento
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('x1pay-theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('x1pay-theme')
      if (stored === 'light' || stored === 'dark') setTheme(stored)
    } catch {
      // ignore
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--admin-bg)]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div
      className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] flex"
      style={{ ['--brand-color' as any]: config.brandColor || '#7c3aed' }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-14 border-b border-[var(--admin-border)] flex items-center justify-between px-4 sticky top-0 bg-[var(--admin-bg)] z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[var(--admin-muted)] hover:text-[var(--admin-text)] lg:hidden"
            >
              <Menu size={22} />
            </button>

            <MetaModal
              currentGoal={config.monthlyGoal}
              onSave={async (goal) => {
                const res = await fetch('/api/configuracoes', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ settings: { monthlyGoal: goal } }),
                })
                if (res.ok) setConfig((prev) => ({ ...prev, monthlyGoal: goal }))
              }}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-[var(--admin-muted)] truncate max-w-[220px]">
              {session.user?.email}
            </span>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition p-2 rounded-lg"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
