import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, FileText, List, Settings, CreditCard } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-navy-800 border-r border-navy-600 flex flex-col">
        <div className="p-4 border-b border-navy-600">
          <span className="font-semibold text-cream-50 text-sm tracking-wide">
            CLINOTE
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/editor"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-50/70
                       hover:text-cream-50 hover:bg-navy-700 transition-colors"
          >
            <FileText size={16} />
            Nueva nota
          </Link>
          <Link
            href="/cases"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-50/70
                       hover:text-cream-50 hover:bg-navy-700 transition-colors"
          >
            <List size={16} />
            Mis casos
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-50/70
                       hover:text-cream-50 hover:bg-navy-700 transition-colors"
          >
            <Settings size={16} />
            Ajustes
          </Link>
          <Link
            href="/billing"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-50/70
                       hover:text-cream-50 hover:bg-navy-700 transition-colors"
          >
            <CreditCard size={16} />
            Suscripción
          </Link>
        </nav>

        <div className="p-3 border-t border-navy-600">
          <p className="text-xs text-cream-50/40 px-3 mb-2 truncate">
            {user.email}
          </p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream-50/60
                         hover:text-cream-50 hover:bg-navy-700 transition-colors w-full text-left"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
