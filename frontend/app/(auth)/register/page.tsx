import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-navy-900 grain flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-cream-50 tracking-tight">
            CLINOTE
          </h1>
          <p className="text-sm text-cream-50/50 mt-1">
            Documentación clínica inteligente
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
