'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canManageUsers, canViewFinancials } from '@/lib/permissions'
import {
  LayoutDashboard,
  Calendar,
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
  Home,
  MessageSquare,
  MessagesSquare,
} from 'lucide-react'
import Image from 'next/image'
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
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

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

    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch('/api/whatsapp/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadMessages(data.count)
        }
      } catch (error) {
        console.error('Errore nel recupero messaggi non letti:', error)
      }
    }

    if (session) {
      fetchPendingCount()
      fetchUnreadMessages()
      const interval = setInterval(fetchPendingCount, 60 * 1000)
      const messageInterval = setInterval(fetchUnreadMessages, 30 * 1000)

      const handleCheckInUpdate = () => {
        fetchPendingCount()
      }
      window.addEventListener('checkInStatusUpdated', handleCheckInUpdate)

      return () => {
        clearInterval(interval)
        clearInterval(messageInterval)
        window.removeEventListener('checkInStatusUpdated', handleCheckInUpdate)
      }
    }
  }, [session])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendario', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Calendario Staff', href: '/dashboard/staff-calendar', icon: CalendarDays },
    { name: 'Prenotazioni', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Check-in Ospiti', href: '/dashboard/guest-checkins', icon: ClipboardCheck },
    { name: 'Check-in Pending', href: '/dashboard/checkins-pending', icon: Clock, badge: 'pending' },
    { name: 'Strutture', href: '/dashboard/properties', icon: Home },
    { name: 'Messaggi Stanze', href: '/dashboard/room-messages', icon: MessageSquare },
    { name: 'Chat WhatsApp', href: '/dashboard/chat', icon: MessagesSquare, badge: 'messages' },
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
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-[#e8e4d9] to-[#d4cdb0]/30">
      {/* Navbar */}
      <nav className="bg-[#3d4a3c]/95 backdrop-blur-xl shadow-2xl border-b border-[#3d4a3c] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300 text-white"
              >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#d4cdb0] to-[#c4b896] rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                  <div className="relative w-11 h-11 bg-[#d4cdb0] rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    <Image src="/logo-palermo.svg" alt="BookYourStayPalermo" width={36} height={36} className="object-contain" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    BookYourStayPalermo
                  </h1>
                  <p className="text-[10px] text-[#d4cdb0]/70 font-medium tracking-wider uppercase">CRM</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                <Bell size={20} className="text-[#d4cdb0] group-hover:text-white transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              </button>
              <Link href="/dashboard/settings" className="p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                <Settings size={20} className="text-[#d4cdb0] group-hover:text-white transition-colors" />
              </Link>
              <div className="hidden sm:flex items-center space-x-3 pl-4 ml-2 border-l border-white/20">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
                  <p className="text-xs text-[#d4cdb0]/70 capitalize">{session?.user?.role?.toLowerCase()}</p>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4cdb0] to-amber-400 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-[#d4cdb0] to-[#c4b896] rounded-full flex items-center justify-center text-[#3d4a3c] font-bold shadow-lg">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="hidden sm:flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border border-white/10 hover:border-white/20"
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
          className={`hidden lg:block ${sidebarCollapsed ? 'w-20' : 'w-72'} min-h-[calc(100vh-64px)] flex-shrink-0 transition-all duration-500 ease-out`}
        >
          <div className="sticky top-20 p-4">
            <div className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all duration-500 ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
              {/* Collapse Button */}
              <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-xl bg-[#3d4a3c]/5 hover:bg-[#3d4a3c]/10 text-[#3d4a3c] transition-all duration-300 group"
                >
                  {sidebarCollapsed ? (
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  ) : (
                    <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  const showBadge = item.href === '/dashboard/guest-checkins' && pendingCheckIns > 0
                  const showPendingBadge = (item as any).badge === 'pending' && pendingApproval > 0
                  const showMessagesBadge = (item as any).badge === 'messages' && unreadMessages > 0
                  const badgeCount = showBadge ? pendingCheckIns : (showPendingBadge ? pendingApproval : (showMessagesBadge ? unreadMessages : 0))
                  const hasBadge = showBadge || showPendingBadge || showMessagesBadge
                  const badgeColor = showMessagesBadge ? 'bg-green-500' : (showPendingBadge ? 'bg-amber-500' : 'bg-rose-500')

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={sidebarCollapsed ? item.name : ''}
                      className={`relative group flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white shadow-lg shadow-[#3d4a3c]/20'
                          : 'text-[#3d4a3c]/80 hover:bg-[#3d4a3c]/5 hover:text-[#3d4a3c]'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <Icon className={`${sidebarCollapsed ? '' : 'mr-3'} flex-shrink-0 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} size={20} />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </div>
                      {hasBadge && !sidebarCollapsed && (
                        <span className={`${badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse shadow-lg`}>
                          {badgeCount}
                        </span>
                      )}
                      {hasBadge && sidebarCollapsed && (
                        <span className={`absolute top-2 right-2 w-2.5 h-2.5 ${badgeColor} rounded-full animate-pulse ring-2 ring-white`}></span>
                      )}
                    </Link>
                  )
                })}
              </nav>

            </div>
          </div>
        </div>

        {/* Sidebar Mobile */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out">
              <div className="p-4 pt-20">
                <nav className="space-y-1.5">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    const showBadge = item.href === '/dashboard/guest-checkins' && pendingCheckIns > 0
                    const showPendingBadge = (item as any).badge === 'pending' && pendingApproval > 0
                    const showMessagesBadge = (item as any).badge === 'messages' && unreadMessages > 0
                    const badgeCount = showBadge ? pendingCheckIns : (showPendingBadge ? pendingApproval : (showMessagesBadge ? unreadMessages : 0))
                    const hasBadge = showBadge || showPendingBadge || showMessagesBadge
                    const badgeColor = showMessagesBadge ? 'bg-green-500' : (showPendingBadge ? 'bg-amber-500' : 'bg-rose-500')

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white shadow-lg'
                            : 'text-[#3d4a3c]/80 hover:bg-[#3d4a3c]/5'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`mr-3 ${isActive ? 'text-white' : 'text-[#3d4a3c]/60'}`} size={20} />
                          {item.name}
                        </div>
                        {hasBadge && (
                          <span className={`${badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse`}>
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
                <button
                  onClick={() => signOut()}
                  className="w-full mt-6 flex items-center justify-center space-x-2 text-rose-600 hover:bg-rose-50 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium"
                >
                  <LogOut size={20} />
                  <span>Esci</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-64px)]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
