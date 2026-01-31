'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canManageUsers, canViewFinancials } from '@/lib/permissions'
import {
  LayoutDashboard,
  Calendar,
  Home,
  DollarSign,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ClipboardCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pendingCheckIns, setPendingCheckIns] = useState(0)
  const [pendingApproval, setPendingApproval] = useState(0)

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/guest-checkins/pending-count')
        if (response.ok) {
          const data = await response.json()
          setPendingCheckIns(data.count)
          setPendingApproval(data.pendingApproval || 0)
        }
      } catch (error) {
        console.error('Errore nel recupero conteggio:', error)
      }
    }

    if (session) {
      fetchPendingCount()
      // Aggiorna ogni minuto per controlli più frequenti
      const interval = setInterval(fetchPendingCount, 60 * 1000)

      // Ascolta eventi personalizzati per aggiornare il badge immediatamente
      const handleCheckInUpdate = () => {
        fetchPendingCount()
      }
      window.addEventListener('checkInStatusUpdated', handleCheckInUpdate)

      return () => {
        clearInterval(interval)
        window.removeEventListener('checkInStatusUpdated', handleCheckInUpdate)
      }
    }
  }, [session])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Calendario Dipendenti', href: '/dashboard/staff-calendar', icon: CalendarDays },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Check-in Ospiti', href: '/dashboard/guest-checkins', icon: ClipboardCheck },
    { name: 'Check-in in Attesa', href: '/dashboard/checkins-pending', icon: Clock, badge: 'pending' },
    { name: 'Strutture', href: '/dashboard/properties', icon: Home },
    { name: 'Dipendenti', href: '/dashboard/staff', icon: UserCheck },
  ]

  if (session?.user && canViewFinancials(session.user.role)) {
    navigation.push({ name: 'Finanziario', href: '/dashboard/financials', icon: DollarSign })
  }

  if (session?.user && canManageUsers(session.user.role)) {
    navigation.push({ name: 'Utenti', href: '/dashboard/users', icon: Users })
    navigation.push({ name: 'Impostazioni', href: '/dashboard/settings', icon: Settings })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Home className="text-white" size={20} />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Rental Manager
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Settings size={20} className="text-slate-600" />
              </button>
              <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{session?.user?.name}</p>
                  <p className="text-xs text-slate-500">{session?.user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="hidden sm:flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <LogOut size={16} />
                <span>Esci</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Desktop */}
        <div
          className={`hidden lg:block ${sidebarCollapsed ? 'w-20' : 'w-64'} min-h-screen flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200/60 bg-white/30 backdrop-blur-sm`}
        >
          <nav className="sticky top-20 p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const showBadge = item.href === '/dashboard/guest-checkins' && pendingCheckIns > 0
                const showPendingBadge = (item as any).badge === 'pending' && pendingApproval > 0
                const badgeCount = showBadge ? pendingCheckIns : (showPendingBadge ? pendingApproval : 0)
                const hasBadge = showBadge || showPendingBadge
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={sidebarCollapsed ? item.name : ''}
                    className={`${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-700 hover:bg-white hover:shadow-md'
                      } group flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 text-sm font-medium rounded-xl transition-all duration-200 relative`}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={`${sidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-500'} flex-shrink-0`} size={20} />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {hasBadge && !sidebarCollapsed && (
                      <span className={`${showPendingBadge ? 'bg-amber-500' : 'bg-red-600'} text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse ml-2`}>
                        {badgeCount}
                      </span>
                    )}
                    {hasBadge && sidebarCollapsed && (
                      <span className={`absolute top-2 right-2 w-2 h-2 ${showPendingBadge ? 'bg-amber-500' : 'bg-red-600'} rounded-full animate-pulse`}></span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Sidebar Mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <nav className="p-4 mt-16">
                <div className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    const showBadge = item.href === '/dashboard/guest-checkins' && pendingCheckIns > 0
                    const showPendingBadge = (item as any).badge === 'pending' && pendingApproval > 0
                    const badgeCount = showBadge ? pendingCheckIns : (showPendingBadge ? pendingApproval : 0)
                    const hasBadge = showBadge || showPendingBadge
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`${isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-slate-100'
                          } group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all`}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} size={20} />
                          {item.name}
                        </div>
                        {hasBadge && (
                          <span className={`${showPendingBadge ? 'bg-amber-500' : 'bg-red-600'} text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse`}>
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center space-x-3 text-red-600 hover:bg-red-50 px-4 py-3 rounded-xl transition-all mt-4"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Esci</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
