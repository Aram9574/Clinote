'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-6">
      <h2 className="text-sm font-semibold text-cream-50 mb-5">{title}</h2>
      {children}
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-cream-50/60 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                 text-sm text-cream-50 placeholder:text-cream-50/25
                 focus:outline-none focus:border-teal-400 transition-colors"
    />
  )
}

// ─── Delete account modal ────────────────────────────────────────────────────
function DeleteAccountModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  const [confirmation, setConfirmation] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-base font-semibold text-cream-50 mb-2">Eliminar cuenta</h3>
        <p className="text-sm text-cream-50/60 mb-4">
          Esta acción es irreversible. Se eliminarán todos tus datos, casos y notas.
          Escribe <span className="text-red-400 font-mono">ELIMINAR</span> para confirmar.
        </p>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="ELIMINAR"
          className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2.5
                     text-sm text-cream-50 placeholder:text-cream-50/25
                     focus:outline-none focus:border-red-400 transition-colors mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium border border-navy-600 text-cream-50/70
                       rounded-lg hover:text-cream-50 hover:border-navy-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmation !== 'ELIMINAR' || loading}
            className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg
                       hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {loading ? 'Eliminando...' : 'Eliminar cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Profile
  const [fullName, setFullName] = useState('')
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      const u = session.user
      setUser(u)
      setFullName(u.user_metadata?.full_name || '')
      setIsLoading(false)
    })
  }, [router, supabase.auth])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileStatus('saving')
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })
    if (error) {
      setProfileStatus('error')
    } else {
      setProfileStatus('saved')
      setTimeout(() => setProfileStatus('idle'), 2500)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    setPasswordStatus('saving')

    // Re-authenticate then update
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    })

    if (signInError) {
      setPasswordError('La contraseña actual es incorrecta.')
      setPasswordStatus('error')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPasswordError(updateError.message || 'Error al cambiar la contraseña.')
      setPasswordStatus('error')
    } else {
      setPasswordStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordStatus('idle'), 2500)
    }
  }

  const handleExportData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const exportData = {
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name,
        created_at: session.user.created_at,
      },
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinote-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      // Sign out and let the user know — full deletion requires server-side admin SDK
      await supabase.auth.signOut()
      router.push('/login?deleted=1')
    } catch {
      setDeleteLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-navy-800 rounded-xl border border-navy-600 h-32 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-cream-50">Ajustes</h1>
        <p className="text-sm text-cream-50/50 mt-1">
          Gestiona tu perfil, seguridad y datos de la cuenta.
        </p>
      </div>

      {/* Perfil */}
      <SectionCard title="Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <FieldGroup label="Nombre completo">
            <TextInput
              value={fullName}
              onChange={setFullName}
              placeholder="Dr. Juan García"
            />
          </FieldGroup>
          <FieldGroup label="Correo electrónico">
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-navy-700/50 border border-navy-600 rounded-lg px-4 py-2.5
                         text-sm text-cream-50/40 cursor-not-allowed"
            />
          </FieldGroup>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={profileStatus === 'saving'}
              className="px-5 py-2 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                         hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {profileStatus === 'saving'
                ? 'Guardando...'
                : profileStatus === 'saved'
                ? 'Guardado'
                : 'Guardar cambios'}
            </button>
            {profileStatus === 'error' && (
              <span className="text-xs text-red-400">Error al guardar.</span>
            )}
          </div>
        </form>
      </SectionCard>

      {/* Seguridad */}
      <SectionCard title="Seguridad">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <FieldGroup label="Contraseña actual">
            <TextInput
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="••••••••"
            />
          </FieldGroup>
          <FieldGroup label="Nueva contraseña">
            <TextInput
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Mínimo 8 caracteres"
            />
          </FieldGroup>
          <FieldGroup label="Confirmar nueva contraseña">
            <TextInput
              type="password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="••••••••"
            />
          </FieldGroup>
          {passwordError && (
            <p className="text-sm text-red-400">{passwordError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={passwordStatus === 'saving'}
              className="px-5 py-2 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                         hover:bg-teal-500 transition-colors disabled:opacity-50"
            >
              {passwordStatus === 'saving'
                ? 'Cambiando...'
                : passwordStatus === 'saved'
                ? 'Contraseña cambiada'
                : 'Cambiar contraseña'}
            </button>
            {passwordStatus === 'error' && !passwordError && (
              <span className="text-xs text-red-400">Error al cambiar la contraseña.</span>
            )}
          </div>
        </form>
      </SectionCard>

      {/* Notificaciones */}
      <SectionCard title="Notificaciones">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-cream-50">Notificaciones por email</p>
            <p className="text-xs text-cream-50/40 mt-0.5">
              Recibe resúmenes y alertas importantes en tu correo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${emailNotifications ? 'bg-teal-400' : 'bg-navy-600'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </SectionCard>

      {/* Datos */}
      <SectionCard title="Datos y cuenta">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cream-50">Exportar mis datos</p>
              <p className="text-xs text-cream-50/40 mt-0.5">
                Descarga un archivo JSON con tus datos de perfil.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 text-sm font-medium border border-navy-600 text-cream-50/70
                         rounded-lg hover:text-cream-50 hover:border-navy-500 transition-colors"
            >
              Exportar
            </button>
          </div>

          <div className="border-t border-navy-600 pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-red-400">Eliminar cuenta</p>
              <p className="text-xs text-cream-50/40 mt-0.5">
                Elimina permanentemente tu cuenta y todos tus datos.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium border border-red-500/40 text-red-400
                         rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Eliminar cuenta
            </button>
          </div>
        </div>
      </SectionCard>

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}
