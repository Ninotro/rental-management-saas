'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  DollarSign,
  Home,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardCheck,
  AlertCircle,
  Users,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  Activity,
  BarChart3,
} from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  bookingsChange: number
  totalRevenue: number
  revenueChange: number
  totalProperties: number
  upcomingCheckIns: number
  checkInsToday: number
  recentBookings: RecentBooking[]
}

interface RecentBooking {
  id: string
  guestName: string
  propertyName: string
  roomName: string | null
  totalPrice: number
  checkIn: string
  checkOut: string
  status: string
}

interface PendingCheckIn {
  id: string
  firstName: string
  lastName: string
  submittedAt: string
  selectedRoom: {
    name: string
    property: { name: string }
  } | null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    bookingsChange: 0,
    totalRevenue: 0,
    revenueChange: 0,
    totalProperties: 0,
    upcomingCheckIns: 0,
    checkInsToday: 0,
    recentBookings: [],
  })
  const [pendingCheckIns, setPendingCheckIns] = useState<PendingCheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/guest-checkins/pending')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingCheckIns(data)
        }
      })
      .catch(console.error)
  }, [])

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}%`
    if (change < 0) return `${change}%`
    return '0%'
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buongiorno'
    if (hour < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  const statCards = [
    {
      name: 'Prenotazioni',
      subtitle: 'Questo mese',
      value: stats.totalBookings,
      icon: Calendar,
      gradient: 'from-[#3d4a3c] to-[#4a5a49]',
      iconBg: 'bg-[#d4cdb0]',
      iconColor: 'text-[#3d4a3c]',
      change: formatChange(stats.bookingsChange),
      isPositive: stats.bookingsChange >= 0,
    },
    {
      name: 'Ricavi',
      subtitle: 'Questo mese',
      value: `€${stats.totalRevenue.toLocaleString('it-IT')}`,
      icon: DollarSign,
      gradient: 'from-emerald-600 to-teal-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      change: formatChange(stats.revenueChange),
      isPositive: stats.revenueChange >= 0,
    },
    {
      name: 'Strutture',
      subtitle: 'Attive',
      value: stats.totalProperties,
      icon: Home,
      gradient: 'from-violet-600 to-purple-600',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      change: '',
      isPositive: true,
    },
    {
      name: 'Check-in',
      subtitle: 'Prossimi 7 giorni',
      value: stats.upcomingCheckIns,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      change: stats.checkInsToday > 0 ? `${stats.checkInsToday} oggi` : '',
      isPositive: true,
    },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4cdb0]/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4cdb0]/5 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-[#d4cdb0]" size={20} />
              <span className="text-[#d4cdb0] text-sm font-medium">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {getGreeting()}, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-white/70 text-lg">
              Ecco una panoramica della tua attività
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/dashboard/bookings')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-3 rounded-2xl font-medium transition-all duration-300 border border-white/10 hover:border-white/20 group"
            >
              <Calendar size={18} />
              <span>Nuova Prenotazione</span>
              <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
            <button
              onClick={() => router.push('/dashboard/properties')}
              className="flex items-center gap-2 bg-[#d4cdb0] hover:bg-[#c4b896] text-[#3d4a3c] px-5 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <Home size={18} />
              <span>Gestisci Strutture</span>
              <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/50 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.iconBg} p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={stat.iconColor} size={24} />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-semibold flex items-center px-2.5 py-1 rounded-full ${
                      stat.isPositive
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-rose-700 bg-rose-50'
                    }`}>
                      {stat.change}
                      {stat.isPositive ? (
                        <ArrowUpRight size={14} className="ml-0.5" />
                      ) : (
                        <ArrowDownRight size={14} className="ml-0.5" />
                      )}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#3d4a3c]/60 font-medium mb-1">{stat.subtitle}</p>
                  <h3 className="text-sm font-semibold text-[#3d4a3c]/80 mb-1">
                    {stat.name}
                  </h3>
                  <p className="text-3xl font-bold text-[#3d4a3c]">
                    {loading ? (
                      <span className="inline-block w-16 h-8 bg-[#3d4a3c]/10 rounded-lg animate-pulse"></span>
                    ) : stat.value}
                  </p>
                </div>
              </div>
              <div className={`h-1.5 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-[#3d4a3c]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3d4a3c]/5 rounded-xl">
                  <Activity className="text-[#3d4a3c]" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#3d4a3c]">Prenotazioni Recenti</h2>
                  <p className="text-sm text-[#3d4a3c]/60">Ultime attività</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/bookings')}
                className="flex items-center gap-1 text-sm text-[#3d4a3c] hover:text-[#3d4a3c]/70 font-medium group"
              >
                Vedi tutte
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-[#d4cdb0] rounded-full animate-spin border-t-[#3d4a3c]"></div>
                </div>
              </div>
            ) : stats.recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#3d4a3c]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-[#3d4a3c]/40" size={28} />
                </div>
                <p className="text-[#3d4a3c]/60 font-medium">Nessuna prenotazione recente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    onClick={() => router.push('/dashboard/bookings')}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[#3d4a3c]/[0.02] to-transparent hover:from-[#3d4a3c]/[0.05] rounded-2xl transition-all duration-300 cursor-pointer group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                        {booking.guestName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3d4a3c]">{booking.guestName || 'Ospite'}</p>
                        <div className="flex items-center gap-2 text-sm text-[#3d4a3c]/60">
                          <MapPin size={12} />
                          <span>{booking.propertyName}{booking.roomName && ` - ${booking.roomName}`}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#3d4a3c]">
                        €{booking.totalPrice?.toLocaleString('it-IT') || '0'}
                      </p>
                      <p className="text-xs text-[#3d4a3c]/60 flex items-center justify-end gap-1">
                        <Clock size={10} />
                        {new Date(booking.checkIn).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} - {new Date(booking.checkOut).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-[#3d4a3c]/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#d4cdb0]/30 rounded-xl">
                <BarChart3 className="text-[#3d4a3c]" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#3d4a3c]">Azioni Rapide</h2>
                <p className="text-sm text-[#3d4a3c]/60">Accesso veloce</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => router.push('/dashboard/bookings')}
              className="w-full p-4 bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-2xl text-white hover:shadow-xl transition-all duration-300 group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar size={22} />
                  <div>
                    <p className="font-semibold">Nuova Prenotazione</p>
                    <p className="text-xs text-white/60">Aggiungi booking</p>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/properties')}
              className="w-full p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white hover:shadow-xl transition-all duration-300 group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Home size={22} />
                  <div>
                    <p className="font-semibold">Gestisci Strutture</p>
                    <p className="text-xs text-white/60">Proprietà e stanze</p>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/financials')}
              className="w-full p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white hover:shadow-xl transition-all duration-300 group text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign size={22} />
                  <div>
                    <p className="font-semibold">Report Finanziari</p>
                    <p className="text-xs text-white/60">Ricavi e statistiche</p>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/checkins-pending')}
              className="w-full p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white hover:shadow-xl transition-all duration-300 group text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardCheck size={22} />
                  <div>
                    <p className="font-semibold">Check-in Pending</p>
                    <p className="text-xs text-white/60">Da approvare</p>
                  </div>
                </div>
                {pendingCheckIns.length > 0 && (
                  <span className="bg-white text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    {pendingCheckIns.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Check-ins Alert */}
      {pendingCheckIns.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/50 rounded-3xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#3d4a3c]">Check-in in Attesa</h2>
                  <p className="text-[#3d4a3c]/60">{pendingCheckIns.length} richieste da verificare</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/checkins-pending')}
                className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-semibold bg-amber-100 hover:bg-amber-200 px-4 py-2.5 rounded-xl transition-all duration-300"
              >
                Gestisci
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pendingCheckIns.slice(0, 3).map((checkIn, index) => (
                <div
                  key={checkIn.id}
                  onClick={() => router.push('/dashboard/checkins-pending')}
                  className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                    {checkIn.firstName.charAt(0)}{checkIn.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#3d4a3c] truncate">{checkIn.firstName} {checkIn.lastName}</p>
                    <p className="text-xs text-[#3d4a3c]/60 truncate">
                      {checkIn.selectedRoom?.property.name || 'Struttura'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {pendingCheckIns.length > 3 && (
              <p className="text-center text-sm text-[#3d4a3c]/60 mt-4 font-medium">
                + altri {pendingCheckIns.length - 3} check-in in attesa
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
