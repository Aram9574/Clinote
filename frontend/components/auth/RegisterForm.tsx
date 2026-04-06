'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este correo ya está registrado. Inicia sesión.')
        } else {
          setError(signUpError.message || 'Error al crear la cuenta.')
        }
        setLoading(false)
        return
      }

      if (data.user) {
        router.push('/editor?welcome=1')
      }
    } catch {
      setError('Error al crear la cuenta. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-8">
      <h2 className="text-lg font-semibold text-cream-50 mb-6">Crear cuenta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-cream-50/60 mb-1.5">
            Nombre completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Dra. María García"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                       text-sm text-cream-50 placeholder:text-cream-50/25
                       focus:outline-none focus:border-teal-400 transition-colors"
          />
        </div>

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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-xs text-cream-50/40 mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
