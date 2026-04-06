'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MFAPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCodeChange = async (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError('')

    if (digits.length === 6) {
      setLoading(true)
      try {
        const factors = await supabase.auth.mfa.listFactors()
        const totpFactor = factors.data?.totp?.[0]

        if (!totpFactor) {
          router.push('/editor')
          return
        }

        const { data: challengeData } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        })

        if (!challengeData) {
          setError('Error al iniciar desafío MFA')
          setLoading(false)
          return
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challengeData.id,
          code: digits,
        })

        if (verifyError) {
          setError('Código incorrecto. Inténtalo de nuevo.')
          setCode('')
          setLoading(false)
        } else {
          router.push('/editor')
        }
      } catch {
        setError('Error al verificar el código')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 grain flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-8">
          <h2 className="text-xl font-semibold text-cream-50 mb-2">
            Verificación de dos pasos
          </h2>
          <p className="text-sm text-cream-50/60 mb-6">
            Introduce el código de 6 dígitos de tu aplicación autenticadora.
          </p>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="000000"
            disabled={loading}
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3
                       text-center text-2xl font-mono tracking-widest text-cream-50
                       placeholder:text-cream-50/20 focus:outline-none focus:border-teal-400
                       disabled:opacity-50 transition-colors"
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}

          {loading && (
            <p className="text-teal-400 text-sm mt-3 text-center">
              Verificando...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
