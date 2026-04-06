import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 grain flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-teal-400/20 mb-2 select-none">404</div>
        <h1 className="text-2xl font-semibold text-cream-50 mb-3">
          Página no encontrada
        </h1>
        <p className="text-sm text-cream-50/50 mb-8">
          La página que buscas no existe o ha sido movida. Comprueba la URL o vuelve al editor.
        </p>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-400 text-navy-900
                     text-sm font-medium rounded-lg hover:bg-teal-500 transition-colors"
        >
          Volver al editor
        </Link>
      </div>
    </div>
  )
}
