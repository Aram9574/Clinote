'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Credenciales incorrectas. Inténtalo de nuevo.')
        setLoading(false)
        return
      }

      if (data.session?.user) {
        // Check if MFA is required
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const hasTOTP = factors?.totp && factors.totp.length > 0 &&
                        factors.totp.some(f => f.status === 'verified')

        if (hasTOTP) {
          router.push('/mfa')
        } else {
          router.push('/editor')
        }
      }
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-8">
      <h2 className="text-lg font-semibold text-cream-50 mb-6">Iniciar sesión</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-cream-50/60 mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="medico@clinica.es"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                       text-sm text-cream-50 placeholder:text-cream-50/25
                       focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-cream-50/60 mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                       text-sm text-cream-50 placeholder:text-cream-50/25
                       focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                     hover:bg-teal-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-xs text-cream-50/40 mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-teal-400 hover:text-teal-300 transition-colors">
          Regístrate
        </Link>
      </p>
    </div>
  )
}
