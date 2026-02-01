'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenziali non valide')
      } else {
        const from = searchParams.get('from') || '/dashboard'
        router.push(from)
        router.refresh()
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="text-rose-500 flex-shrink-0" size={20} />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="text-[#3d4a3c]/40" size={20} />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] placeholder-[#3d4a3c]/40 focus:outline-none focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent transition-all duration-300"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="text-[#3d4a3c]/40" size={20} />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] placeholder-[#3d4a3c]/40 focus:outline-none focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent transition-all duration-300"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#3d4a3c] text-white font-semibold rounded-2xl transition-all duration-500 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            <span>Accedi</span>
          </>
        )}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-[#e8e4d9] to-[#d4cdb0]/30 px-4 py-12">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#d4cdb0]/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#3d4a3c]/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] p-8 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4cdb0]/10 rounded-full -translate-y-24 translate-x-24 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4cdb0]/5 rounded-full translate-y-16 -translate-x-16 blur-xl"></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#d4cdb0] rounded-2xl shadow-lg mb-4">
                <Image src="/logo-palermo.svg" alt="BookYourStayPalermo" width={56} height={56} className="object-contain" />
              </div>

              <h1 className="text-2xl font-bold text-white mb-1">
                BookYourStayPalermo
              </h1>
              <p className="text-[#d4cdb0]/80 text-sm font-medium tracking-wider uppercase">
                CRM
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#3d4a3c]">Benvenuto</h2>
              <p className="text-[#3d4a3c]/60 text-sm mt-1">Accedi al tuo account per continuare</p>
            </div>

            <Suspense fallback={
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-[#d4cdb0] border-t-[#3d4a3c] rounded-full animate-spin"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#3d4a3c]/50 text-sm mt-6">
          Your holiday in Palermo
        </p>
      </div>
    </div>
  )
}
