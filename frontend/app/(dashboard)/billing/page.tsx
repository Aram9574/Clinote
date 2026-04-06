'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function BillingPage() {
  const [plan, setPlan] = useState<string>('free')
  const [notesUsed, setNotesUsed] = useState(0)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      const { data } = await supabase
        .from('users')
        .select('notes_used_this_month, organizations(plan)')
        .eq('id', session.user.id)
        .single()
      if (data) {
        const typedData = data as unknown as { notes_used_this_month: number; organizations: { plan?: string } | null }
        setNotesUsed(typedData.notes_used_this_month || 0)
        setPlan(typedData.organizations?.plan || 'free')
      }
    })
  }, [router, supabase])

  const handleUpgrade = async (priceId: string, planName: string) => {
    if (!token) return
    setIsLoading(planName)
    try {
      const res = await fetch(`${API_BASE}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/billing?success=true`,
          cancel_url: `${window.location.origin}/billing?cancelled=true`,
        }),
      })
      if (!res.ok) throw new Error('Error creating checkout')
      const data = await res.json()
      window.location.href = data.checkout_url
    } catch (err) {
      console.error('Checkout error:', err)
      setIsLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!token) return
    setIsLoading('portal')
    try {
      const res = await fetch(`${API_BASE}/api/v1/billing/portal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error creating portal')
      const data = await res.json()
      window.location.href = data.portal_url
    } catch (err) {
      console.error('Portal error:', err)
      setIsLoading(null)
    }
  }

  const planNames = { free: 'Gratuito', pro: 'Pro', clinic: 'Clínica' }
  const planLimits = { free: 10, pro: -1, clinic: -1 }
  const limit = planLimits[plan as keyof typeof planLimits] || 10

  const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ''
  const CLINIC_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_CLINIC_PRICE_ID || ''

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-cream-50 mb-6">Suscripción</h1>

      {/* Current plan */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-cream-50/60">Plan actual</p>
            <p className="text-lg font-semibold text-cream-50">
              {planNames[plan as keyof typeof planNames] || plan}
            </p>
          </div>
          <span className="px-3 py-1 bg-teal-400/10 text-teal-400 rounded-full text-xs font-medium border border-teal-400/20">
            Activo
          </span>
        </div>

        {plan === 'free' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-cream-50/50 mb-2">
              <span>Notas este mes</span>
              <span>{notesUsed} / {limit}</span>
            </div>
            <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all"
                style={{ width: `${Math.min((notesUsed / limit) * 100, 100)}%` }}
              />
            </div>
            {notesUsed >= limit && (
              <p className="text-xs text-amber-400 mt-2">
                Has alcanzado el límite mensual. Actualiza para continuar.
              </p>
            )}
          </div>
        )}

        {plan !== 'free' && (
          <button
            onClick={handleManageSubscription}
            disabled={isLoading === 'portal'}
            className="mt-4 px-4 py-2 text-sm border border-navy-500 text-cream-50/70 rounded-lg hover:text-cream-50 hover:border-navy-400 transition-colors disabled:opacity-50"
          >
            {isLoading === 'portal' ? 'Cargando...' : 'Gestionar suscripción'}
          </button>
        )}
      </div>

      {/* Upgrade options */}
      {plan === 'free' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-navy-800 rounded-xl border border-teal-400/20 bg-teal-400/5 p-5">
            <p className="text-sm font-semibold text-cream-50 mb-1">Pro</p>
            <p className="text-2xl font-bold text-cream-50">€39<span className="text-sm font-normal text-cream-50/50">/mes</span></p>
            <ul className="text-xs text-cream-50/60 mt-3 mb-4 space-y-1">
              <li>✓ Notas ilimitadas</li>
              <li>✓ Todas las alertas CDSS</li>
              <li>✓ Evidencia PubMed/Cochrane</li>
              <li>✓ 10 solicitudes/minuto</li>
            </ul>
            <button
              onClick={() => handleUpgrade(PRO_PRICE_ID, 'pro')}
              disabled={!!isLoading || !PRO_PRICE_ID}
              className="w-full py-2 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {isLoading === 'pro' ? 'Redirigiendo...' : 'Actualizar a Pro'}
            </button>
          </div>

          <div className="bg-navy-800 rounded-xl border border-navy-600 p-5">
            <p className="text-sm font-semibold text-cream-50 mb-1">Clínica</p>
            <p className="text-2xl font-bold text-cream-50">€199<span className="text-sm font-normal text-cream-50/50">/mes</span></p>
            <ul className="text-xs text-cream-50/60 mt-3 mb-4 space-y-1">
              <li>✓ Multi-usuario (hasta 20)</li>
              <li>✓ 30 solicitudes/minuto</li>
              <li>✓ Soporte prioritario</li>
              <li>✓ DPA incluido</li>
            </ul>
            <button
              onClick={() => handleUpgrade(CLINIC_PRICE_ID, 'clinic')}
              disabled={!!isLoading || !CLINIC_PRICE_ID}
              className="w-full py-2 text-sm font-medium border border-navy-500 text-cream-50 rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
            >
              {isLoading === 'clinic' ? 'Redirigiendo...' : 'Actualizar a Clínica'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
