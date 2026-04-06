'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-navy-900 grain flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-cream-50 mb-3">
          Algo ha ido mal
        </h1>
        <p className="text-sm text-cream-50/50 mb-2">
          Se ha producido un error inesperado. Puedes intentarlo de nuevo o volver al editor.
        </p>
        {error.digest && (
          <p className="text-xs text-cream-50/25 font-mono mb-6">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-teal-400 text-navy-900 text-sm font-medium
                       rounded-lg hover:bg-teal-500 transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/editor"
            className="px-6 py-2.5 border border-navy-600 text-cream-50/70 text-sm
                       font-medium rounded-lg hover:text-cream-50 hover:border-navy-500 transition-colors"
          >
            Ir al editor
          </a>
        </div>
      </div>
    </div>
  )
}
