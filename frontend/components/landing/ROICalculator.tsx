'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calculator } from 'lucide-react'

export function ROICalculator() {
  const [consultasDay, setConsultasDay] = useState(20)
  const [minsPorNota, setMinsPorNota] = useState(6)

  const diasLaborables = 220
  const minAhorradosPorNota = Math.max(0, minsPorNota - 1.5) // CLINOTE → ~1.5 min
  const horasAhorradasAno = (minAhorradosPorNota * consultasDay * diasLaborables) / 60
  const horasAhorradasMes = horasAhorradasAno / 12
  const precioProMes = 39
  const valorHora = 60 // €/h conservador médico privado
  const ahorroDineroMes = Math.round(horasAhorradasMes * valorHora)
  const roi = Math.round(((ahorroDineroMes - precioProMes) / precioProMes) * 100)

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-navy-800 border border-teal-400/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-teal-400/10 rounded-lg flex items-center justify-center">
            <Calculator size={16} className="text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-cream-50">Calcula tu ahorro</h2>
        </div>
        <p className="text-sm text-cream-50/50 mb-8">
          Arrastra los controles para ver cuánto tiempo y dinero recuperas con CLINOTE.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-7">
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm text-cream-50/70">Consultas por día</label>
                <span className="text-2xl font-bold text-cream-50">{consultasDay}</span>
              </div>
              <input
                type="range" min={5} max={50} step={1}
                value={consultasDay}
                onChange={e => setConsultasDay(+e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-cream-50/30 mt-1">
                <span>5</span><span>50</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="text-sm text-cream-50/70">Minutos por nota (ahora)</label>
                <span className="text-2xl font-bold text-cream-50">{minsPorNota} min</span>
              </div>
              <input
                type="range" min={2} max={20} step={1}
                value={minsPorNota}
                onChange={e => setMinsPorNota(+e.target.value)}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-cream-50/30 mt-1">
                <span>2 min</span><span>20 min</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-navy-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-cream-50/50">Horas recuperadas/mes</p>
                <p className="text-2xl font-bold text-teal-400">{horasAhorradasMes.toFixed(1)}h</p>
              </div>
              <div className="text-3xl opacity-20">⏱</div>
            </div>

            <div className="bg-navy-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-cream-50/50">Valor económico ahorrado/mes</p>
                <p className="text-2xl font-bold text-cream-50">€{ahorroDineroMes}</p>
              </div>
              <div className="text-3xl opacity-20">💶</div>
            </div>

            <div className={`rounded-xl p-4 flex items-center justify-between ${
              roi > 0 ? 'bg-teal-400/10 border border-teal-400/20' : 'bg-navy-700'
            }`}>
              <div>
                <p className="text-xs text-cream-50/50">ROI vs precio Pro (€39/mes)</p>
                <p className={`text-2xl font-bold ${roi > 0 ? 'text-teal-400' : 'text-cream-50'}`}>
                  {roi > 0 ? `+${roi}%` : `${roi}%`}
                </p>
              </div>
              <div className="text-3xl opacity-20">📈</div>
            </div>

            <Link
              href="/register"
              className="block w-full text-center py-3 text-sm font-medium
                         bg-teal-400 text-navy-900 rounded-xl hover:bg-teal-500 transition-colors"
            >
              Empezar gratis — sin tarjeta
            </Link>
          </div>
        </div>

        <p className="text-xs text-cream-50/25 mt-6 text-center">
          Cálculo estimado basado en {consultasDay} consultas/día × {diasLaborables} días laborables/año.
          Valor hora médico: €{valorHora}/h. CLINOTE reduce el tiempo de nota a ~1,5 min.
        </p>
      </div>
    </section>
  )
}
