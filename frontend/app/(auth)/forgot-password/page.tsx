'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError('No se pudo enviar el email. Verifica la dirección e inténtalo de nuevo.')
    } else {
      setSent(true)
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-cream-50">Email enviado</h2>
              <p className="text-sm text-cream-50/60">
                Hemos enviado un enlace de recuperación a <span className="text-cream-50">{email}</span>.
                Revisa tu bandeja de entrada y carpeta de spam.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-cream-50 mb-2">Recuperar contraseña</h2>
              <p className="text-sm text-cream-50/50 mb-6">
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

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

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                             hover:bg-teal-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-cream-50/40 mt-6">
          <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
