import { Suspense } from 'react'
import ConfiguracoesPage from './ConfiguracoesClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ConfiguracoesPage />
    </Suspense>
  )
}
