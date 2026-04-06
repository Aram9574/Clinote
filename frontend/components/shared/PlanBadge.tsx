type Plan = 'free' | 'pro' | 'clinic'

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  clinic: 'Clínica',
}

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-navy-700 text-cream-50/50',
  pro: 'bg-teal-400/10 text-teal-400 border border-teal-400/20',
  clinic: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[plan]}`}>
      {PLAN_LABELS[plan]}
    </span>
  )
}
