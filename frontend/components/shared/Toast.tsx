'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-teal-400/10 border-teal-400/30 text-teal-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm
                  transition-all duration-300 shadow-lg backdrop-blur-sm
                  ${COLORS[toast.type]}
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="font-bold text-base leading-none">{ICONS[toast.type]}</span>
      <span className="text-cream-50/90 flex-1">{toast.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300) }}
        className="opacity-50 hover:opacity-100 transition-opacity ml-1"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const add = useCallback((message: string, type: ToastType) => {
    const id = `toast-${++counterRef.current}`
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
  }, [])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    success: (msg) => add(msg, 'success'),
    error: (msg) => add(msg, 'error'),
    info: (msg) => add(msg, 'info'),
    warning: (msg) => add(msg, 'warning'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
