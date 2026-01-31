'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Calendar, DollarSign, Home, TrendingUp, Users, ArrowUpRight } from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  totalProperties: number
  upcomingCheckIns: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalProperties: 0,
    upcomingCheckIns: 0,
  })

  useEffect(() => {
    setStats({
      totalBookings: 24,
      totalRevenue: 45000,
      totalProperties: 5,
      upcomingCheckIns: 3,
    })
  }, [])

  const statCards = [
    {
      name: 'Prenotazioni Totali',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: '+12%',
    },
    {
      name: 'Ricavi Totali',
      value: `€${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: '+23%',
    },
    {
      name: 'Strutture Attive',
      value: stats.totalProperties,
      icon: Home,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: '+2',
    },
    {
      name: 'Check-in Prossimi',
      value: stats.upcomingCheckIns,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: '3 oggi',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Benvenuto, {session?.user?.name}! 👋
        </h1>
        <p className="text-slate-600">Ecco una panoramica della tua attività oggi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={stat.iconColor} size={24} />
                  </div>
                  <span className="text-sm font-semibold text-green-600 flex items-center">
                    {stat.change}
                    <ArrowUpRight size={16} className="ml-1" />
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {stat.name}
                </h3>
                <p className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Prenotazioni Recenti</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Vedi tutte →
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    M{i}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Mario Rossi</p>
                    <p className="text-sm text-slate-500">Villa al Mare</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">€1,200</p>
                  <p className="text-xs text-slate-500">15-20 Gen</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Azioni Rapide</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all">
              <Calendar size={24} className="mb-2" />
              <p className="font-medium">Nuova Prenotazione</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:shadow-lg transition-all">
              <Home size={24} className="mb-2" />
              <p className="font-medium">Aggiungi Struttura</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white hover:shadow-lg transition-all">
              <DollarSign size={24} className="mb-2" />
              <p className="font-medium">Registra Incasso</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white hover:shadow-lg transition-all">
              <Users size={24} className="mb-2" />
              <p className="font-medium">Gestisci Team</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
