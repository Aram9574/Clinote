'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase redirects here with a session already set via the magic link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.')
    })
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('No se pudo actualizar la contraseña. Inténtalo de nuevo.')
    } else {
      router.push('/editor?reset=1')
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 grain flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-cream-50 tracking-tight">CLINOTE</h1>
          <p className="text-sm text-cream-50/50 mt-1">Documentación clínica inteligente</p>
        </div>

        <div className="bg-navy-800 rounded-xl border border-navy-600 p-8">
          <h2 className="text-lg font-semibold text-cream-50 mb-2">Nueva contraseña</h2>
          <p className="text-sm text-cream-50/50 mb-6">Elige una contraseña segura para tu cuenta.</p>

          {!ready && error ? (
            <div className="space-y-4">
              <p className="text-sm text-red-400">{error}</p>
              <a
                href="/forgot-password"
                className="inline-block w-full text-center py-2.5 text-sm font-medium
                           border border-navy-600 text-cream-50/70 rounded-lg
                           hover:text-cream-50 hover:border-navy-500 transition-colors"
              >
                Solicitar nuevo enlace
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-cream-50/60 mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                             text-sm text-cream-50 placeholder:text-cream-50/25
                             focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream-50/60 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                             text-sm text-cream-50 placeholder:text-cream-50/25
                             focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !ready}
                className="w-full py-2.5 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                           hover:bg-teal-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Establecer nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
