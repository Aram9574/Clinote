import Link from 'next/link'
import { ArrowRight, Zap, Shield, BookOpen } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="border-b border-navy-700 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-cream-50 tracking-wide">CLINOTE</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-cream-50/60 hover:text-cream-50 transition-colors">
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg hover:bg-teal-500 transition-colors"
          >
            Empezar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-400/10 border border-teal-400/20 rounded-full text-teal-400 text-xs mb-8">
          <Zap size={12} />
          <span>Para médicos hispanohablantes</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-cream-50 leading-tight mb-6">
          Transforma tus notas clínicas<br />
          en documentación estructurada
        </h1>
        <p className="text-lg text-cream-50/60 mb-10 max-w-2xl mx-auto">
          CLINOTE analiza tus notas en español y genera SOAP estructurado,
          detecta alertas críticas y busca evidencia científica actualizada.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-400 text-navy-900 font-medium rounded-lg hover:bg-teal-500 transition-colors"
        >
          Comenzar gratis <ArrowRight size={16} />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap size={20} className="text-teal-400" />,
              title: "Documentación estructurada",
              desc: "SOAP automático con entidades clínicas extraídas: diagnósticos, medicamentos, analítica y constantes."
            },
            {
              icon: <Shield size={20} className="text-red-400" />,
              title: "Alertas críticas",
              desc: "Detección de interacciones farmacológicas, valores críticos analíticos y desviaciones de guías clínicas."
            },
            {
              icon: <BookOpen size={20} className="text-amber-400" />,
              title: "Evidencia actualizada",
              desc: "Búsqueda automática en PubMed y Cochrane para los diagnósticos principales del caso."
            }
          ].map((f, i) => (
            <div key={i} className="bg-navy-800 rounded-xl border border-navy-600 p-6">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-cream-50 mb-2">{f.title}</h3>
              <p className="text-sm text-cream-50/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-cream-50 text-center mb-10">Precios</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Gratuito", price: "0", period: "/mes", features: ["10 notas/mes", "SOAP + entidades", "Alertas básicas"], highlight: false },
            { name: "Pro", price: "39", period: "€/mes", features: ["Notas ilimitadas", "Todas las alertas", "Evidencia PubMed"], highlight: true },
            { name: "Clínica", price: "199", period: "€/mes", features: ["Multi-usuario", "30 req/min", "Soporte prioritario"], highlight: false },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 ${
                tier.highlight
                  ? "bg-teal-400/5 border-teal-400/30"
                  : "bg-navy-800 border-navy-600"
              }`}
            >
              <p className="text-sm font-medium text-cream-50/70 mb-1">{tier.name}</p>
              <p className="text-3xl font-bold text-cream-50 mb-1">
                {tier.price === "0" ? "Gratis" : `€${tier.price}`}
                {tier.price !== "0" && <span className="text-sm font-normal text-cream-50/50">{tier.period}</span>}
              </p>
              <ul className="mt-4 space-y-2 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="text-sm text-cream-50/70 flex items-center gap-2">
                    <span className="text-teal-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`block text-center py-2 text-sm font-medium rounded-lg transition-colors ${
                  tier.highlight
                    ? "bg-teal-400 text-navy-900 hover:bg-teal-500"
                    : "border border-navy-500 text-cream-50 hover:bg-navy-700"
                }`}
              >
                {tier.price === "0" ? "Empezar gratis" : "Suscribirse"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700 px-6 py-8 text-center">
        <p className="text-xs text-cream-50/30 max-w-2xl mx-auto">
          CLINOTE es una herramienta de apoyo a la documentación clínica. No constituye un dispositivo médico
          certificado ni sustituye el criterio del médico. El profesional sanitario es el único responsable
          de las decisiones clínicas tomadas.
        </p>
        <p className="text-xs text-cream-50/20 mt-4">
          © 2026 CLINOTE. MIT License.
        </p>
      </footer>
    </div>
  )
}
