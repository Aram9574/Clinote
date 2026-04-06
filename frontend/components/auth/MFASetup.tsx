'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function MFASetup() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function enrollMFA() {
      const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (data) {
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setFactorId(data.id)
      }
    }
    enrollMFA()
  }, [supabase.auth.mfa])

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return
    setError('')

    const { data: challengeData } = await supabase.auth.mfa.challenge({ factorId })
    if (!challengeData) { setError('Error al crear desafío'); return }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })

    if (verifyError) {
      setError('Código incorrecto')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="bg-teal-400/10 border border-teal-400/20 rounded-xl p-6 text-center">
        <p className="text-teal-400 font-medium">MFA activado correctamente</p>
        <p className="text-sm text-cream-50/60 mt-2">
          Necesitarás el código de tu aplicación autenticadora en cada inicio de sesión.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {qrCode && (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="QR Code MFA" className="mx-auto w-40 h-40" />
          {secret && (
            <p className="text-xs font-mono text-cream-50/50 mt-2 break-all px-4">
              {secret}
            </p>
          )}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-3
                   text-center text-xl font-mono tracking-widest text-cream-50
                   placeholder:text-cream-50/20 focus:outline-none focus:border-teal-400"
      />
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button
        onClick={handleVerify}
        disabled={code.length !== 6}
        className="w-full py-2.5 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                   hover:bg-teal-500 transition-colors disabled:opacity-50"
      >
        Verificar
      </button>
    </div>
  )
}
