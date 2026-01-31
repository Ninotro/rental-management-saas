'use client'

import { useEffect, useState } from 'react'
import Calendar from '@/components/Calendar'
import { Calendar as CalendarIcon, Home, Bed, Plus, X, RefreshCw, User, Mail, Phone, CreditCard, CheckCircle, Clock, AlertCircle, Eye, Copy, DollarSign } from 'lucide-react'

interface Property {
  id: string
  name: string
  hasRooms: boolean
}

interface Room {
  id: string
  name: string
  propertyId: string
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guestName: string
  propertyId: string
  roomId: string | null
  status: string
  property: {
    name: string
  }
  room?: {
    name: string
  } | null
}

interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  type: 'booking' | 'blocked' | 'maintenance'
  status?: 'confirmed' | 'pending' | 'cancelled' | 'checked_in' | 'checked_out'
  roomName?: string
  propertyName?: string
  guestName?: string
}

interface BlockedEvent {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  type: string
  title: string
  description: string | null
  property: {
    name: string
  }
}

export default function CalendarPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedEvents, setBlockedEvents] = useState<BlockedEvent[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showBookingDetail, setShowBookingDetail] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchProperties()
    fetchBookings()
    fetchBlockedEvents()
  }, [])

  useEffect(() => {
    if (selectedProperty && selectedProperty !== 'all') {
      fetchRooms(selectedProperty)
    }
  }, [selectedProperty])

  useEffect(() => {
    updateEvents()
  }, [bookings, blockedEvents, selectedProperty, selectedRoom])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const fetchRooms = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/rooms`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBlockedEvents = async () => {
    try {
      const response = await fetch('/api/calendar-events')
      if (response.ok) {
        const data = await response.json()
        setBlockedEvents(data)
      }
    } catch (error) {
      console.error('Error fetching blocked events:', error)
    }
  }

  const handleSyncAllCalendars = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/sync-all-ical', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: `Sincronizzazione completata: ${data.synced || 0} stanze sincronizzate, ${data.newBookings || 0} nuove prenotazioni importate`,
        })
        // Ricarica le prenotazioni dopo la sync
        fetchBookings()
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Errore durante la sincronizzazione',
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Errore di connessione durante la sincronizzazione',
      })
    } finally {
      setSyncing(false)
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => setSyncResult(null), 5000)
    }
  }

  const updateEvents = () => {
    let filteredBookings = bookings
    let filteredBlocked = blockedEvents

    if (selectedProperty !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.propertyId === selectedProperty)
      filteredBlocked = filteredBlocked.filter(e => e.propertyId === selectedProperty)
    }

    if (selectedRoom !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.roomId === selectedRoom)
    }

    const bookingEvents: CalendarEvent[] = filteredBookings.map(booking => ({
      id: booking.id,
      title: `${booking.guestName} - ${booking.property.name}`,
      startDate: new Date(booking.checkIn),
      endDate: new Date(booking.checkOut),
      type: 'booking' as const,
      status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled' | 'checked_in' | 'checked_out',
      roomName: booking.room?.name,
      propertyName: booking.property.name,
      guestName: booking.guestName,
    }))

    const blockedCalendarEvents: CalendarEvent[] = filteredBlocked.map(event => ({
      id: event.id,
      title: event.title,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      type: event.type === 'MAINTENANCE' ? 'maintenance' as const : 'blocked' as const,
    }))

    setEvents([...bookingEvents, ...blockedCalendarEvents])
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dayBookings = events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)

      return checkDate >= eventStart && checkDate <= eventEnd
    })

    if (dayBookings.length > 0) {
      // Show bookings for this date
      console.log('Bookings for', date, dayBookings)
    } else {
      // Allow to block this date
      setShowBlockModal(true)
    }
  }

  const selectedProp = properties.find(p => p.id === selectedProperty)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Calendario</h1>
          <p className="text-slate-600">Gestisci disponibilità e prenotazioni</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncAllCalendars}
            disabled={syncing}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizzazione...' : 'Sincronizza Calendari'}</span>
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <Plus size={20} />
            <span>Blocca Date</span>
          </button>
        </div>
      </div>

      {/* Sync Result Message */}
      {syncResult && (
        <div className={`p-4 rounded-xl ${syncResult.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {syncResult.message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Filtri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Home size={16} className="inline mr-2" />
              Struttura
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => {
                setSelectedProperty(e.target.value)
                setSelectedRoom('all')
              }}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutte le strutture</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProp?.hasRooms && rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Bed size={16} className="inline mr-2" />
                Stanza
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutte le stanze</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Prenotazioni Totali</span>
            <CalendarIcon size={24} className="text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{events.filter(e => e.type === 'booking').length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100">Confermate</span>
            <CalendarIcon size={24} className="text-green-200" />
          </div>
          <p className="text-3xl font-bold">{events.filter(e => e.status === 'confirmed').length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-100">In Attesa</span>
            <CalendarIcon size={24} className="text-yellow-200" />
          </div>
          <p className="text-3xl font-bold">{events.filter(e => e.status === 'pending').length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-100">Cancellate</span>
            <CalendarIcon size={24} className="text-red-200" />
          </div>
          <p className="text-3xl font-bold">{events.filter(e => e.status === 'cancelled').length}</p>
        </div>
      </div>

      {/* Calendar */}
      <Calendar
        events={events}
        onDateClick={handleDateClick}
        selectedDate={selectedDate}
      />

      {/* Selected Date Info */}
      {selectedDate && (() => {
        const checkDate = new Date(selectedDate)
        checkDate.setHours(0, 0, 0, 0)

        // Get check-ins for this date
        const checkInsToday = events.filter(event => {
          const eventStart = new Date(event.startDate)
          eventStart.setHours(0, 0, 0, 0)
          return eventStart.getTime() === checkDate.getTime() && event.type === 'booking' && event.status !== 'cancelled'
        })

        // Get check-outs for this date
        const checkOutsToday = events.filter(event => {
          const eventEnd = new Date(event.endDate)
          eventEnd.setHours(0, 0, 0, 0)
          return eventEnd.getTime() === checkDate.getTime() && event.type === 'booking' && event.status !== 'cancelled'
        })

        // Get other events (blocked, maintenance)
        const otherEvents = events.filter(event => {
          const eventStart = new Date(event.startDate)
          const eventEnd = new Date(event.endDate)
          eventStart.setHours(0, 0, 0, 0)
          eventEnd.setHours(0, 0, 0, 0)
          return checkDate >= eventStart && checkDate <= eventEnd && event.type !== 'booking'
        })

        const hasEvents = checkInsToday.length > 0 || checkOutsToday.length > 0 || otherEvents.length > 0

        return (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedDate.toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              <button
                onClick={() => setSelectedDate(undefined)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {hasEvents ? (
              <div className="space-y-6">
                {/* Check-ins Section */}
                {checkInsToday.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Check-in ({checkInsToday.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {checkInsToday.map(event => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedBookingId(event.id)
                            setShowBookingDetail(true)
                          }}
                          className="p-4 bg-green-50 border border-green-200 rounded-xl cursor-pointer hover:shadow-md hover:border-green-400 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{event.guestName}</p>
                              <p className="text-sm text-green-700 font-medium mt-1">
                                🏠 {event.propertyName}
                              </p>
                              {event.roomName && (
                                <p className="text-sm text-green-600">
                                  🛏️ {event.roomName}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                Check-out: {event.endDate.toLocaleDateString('it-IT')}
                              </p>
                            </div>
                            <Eye size={18} className="text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Check-outs Section */}
                {checkOutsToday.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      Check-out ({checkOutsToday.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {checkOutsToday.map(event => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedBookingId(event.id)
                            setShowBookingDetail(true)
                          }}
                          className="p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:shadow-md hover:border-orange-400 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{event.guestName}</p>
                              <p className="text-sm text-orange-700 font-medium mt-1">
                                🏠 {event.propertyName}
                              </p>
                              {event.roomName && (
                                <p className="text-sm text-orange-600">
                                  🛏️ {event.roomName}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                Check-in: {event.startDate.toLocaleDateString('it-IT')}
                              </p>
                            </div>
                            <Eye size={18} className="text-orange-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Events (Blocked/Maintenance) */}
                {otherEvents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      Blocchi ({otherEvents.length})
                    </h3>
                    <div className="space-y-2">
                      {otherEvents.map(event => (
                        <div
                          key={event.id}
                          className="p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <p className="font-medium text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">
                            {event.startDate.toLocaleDateString('it-IT')} - {event.endDate.toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                Nessun evento per questa data
              </div>
            )}
          </div>
        )
      })()}

      {/* Block Date Modal */}
      {showBlockModal && (
        <BlockDateModal
          properties={properties}
          selectedProperty={selectedProperty}
          selectedDate={selectedDate}
          onClose={() => {
            setShowBlockModal(false)
            setSelectedDate(undefined)
          }}
          onSuccess={() => {
            fetchBlockedEvents()
            setShowBlockModal(false)
            setSelectedDate(undefined)
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => {
            setShowBookingDetail(false)
            setSelectedBookingId(null)
          }}
          onUpdate={() => {
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}

// Booking Detail Modal Component
interface BookingDetail {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: string
  channel: string
  notes: string | null
  touristTaxTotal: number | null
  touristTaxPaid: boolean
  touristTaxPaymentProof: string | null
  property: {
    id: string
    name: string
    city: string
    address: string
  }
  room: {
    id: string
    name: string
    type: string
  } | null
  guestCheckIns: {
    id: string
    firstName: string
    lastName: string
    fiscalCode: string
    dateOfBirth: string
    documentType: string
    documentNumber: string
    status: string
    submittedAt: string
    submittedToPolice: boolean
  }[]
}

function BookingDetailModal({
  bookingId,
  onClose,
  onUpdate,
}: {
  bookingId: string
  onClose: () => void
  onUpdate: () => void
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    fetchBookingDetail()
  }, [bookingId])

  const fetchBookingDetail = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text.toUpperCase())
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  const updateTouristTax = async (paid: boolean) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ touristTaxPaid: paid }),
      })
      if (response.ok) {
        setBooking(prev => prev ? { ...prev, touristTaxPaid: paid } : null)
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        setBooking(prev => prev ? { ...prev, status } : null)
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating:', error)
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confermata'
      case 'PENDING': return 'In Attesa'
      case 'CHECKED_IN': return 'Check-in'
      case 'CHECKED_OUT': return 'Check-out'
      case 'CANCELLED': return 'Annullata'
      default: return status
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'BOOKING_COM': return 'Booking.com'
      case 'AIRBNB': return 'Airbnb'
      case 'DIRECT': return 'Diretto'
      default: return channel
    }
  }

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, fieldName)}
      className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-colors text-xs font-medium ${
        copiedField === fieldName
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Copy size={12} />
      <span>{copiedField === fieldName ? 'Copiato!' : 'Copia'}</span>
    </button>
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-red-600">Prenotazione non trovata</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Chiudi</button>
        </div>
      </div>
    )
  }

  const hasCheckIns = booking.guestCheckIns && booking.guestCheckIns.length > 0
  const allCheckInsComplete = hasCheckIns && booking.guestCheckIns.every(c => c.status === 'APPROVED')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dettaglio Prenotazione</h2>
            <p className="text-slate-600">{booking.property.name} {booking.room && `- ${booking.room.name}`}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
            <span className="px-3 py-1 bg-slate-200 rounded-full text-sm font-medium text-slate-700">
              {getChannelLabel(booking.channel)}
            </span>
          </div>
          <div className="flex gap-2">
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => updateStatus('CHECKED_IN')}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Registra Check-in
              </button>
            )}
            {booking.status === 'CHECKED_IN' && (
              <button
                onClick={() => updateStatus('CHECKED_OUT')}
                disabled={updating}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Registra Check-out
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Booking Info */}
          <div className="space-y-6">
            {/* Date e Prezzo */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <CalendarIcon className="mr-2 text-blue-600" size={20} />
                Soggiorno
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Check-in</p>
                  <p className="font-bold text-slate-900">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Check-out</p>
                  <p className="font-bold text-slate-900">{formatDate(booking.checkOut)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Ospiti</p>
                  <p className="font-bold text-slate-900">{booking.guests} {booking.guests === 1 ? 'persona' : 'persone'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Totale</p>
                  <p className="font-bold text-2xl text-green-600">€{Number(booking.totalPrice).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Dati Ospite */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <User className="mr-2 text-blue-600" size={20} />
                Dati Ospite
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User size={16} className="text-slate-400 mr-2" />
                    <span className="font-medium text-slate-900">{booking.guestName}</span>
                  </div>
                  <CopyButton text={booking.guestName} fieldName="guestName" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail size={16} className="text-slate-400 mr-2" />
                    <span className="text-slate-700">{booking.guestEmail}</span>
                  </div>
                  <CopyButton text={booking.guestEmail} fieldName="guestEmail" />
                </div>
                {booking.guestPhone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone size={16} className="text-slate-400 mr-2" />
                      <span className="text-slate-700">{booking.guestPhone}</span>
                    </div>
                    <CopyButton text={booking.guestPhone} fieldName="guestPhone" />
                  </div>
                )}
              </div>
            </div>

            {/* Tassa di Soggiorno */}
            <div className={`rounded-xl p-4 border ${booking.touristTaxPaid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <DollarSign className={`mr-2 ${booking.touristTaxPaid ? 'text-green-600' : 'text-yellow-600'}`} size={20} />
                Tassa di Soggiorno
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  {booking.touristTaxTotal ? (
                    <p className="text-lg font-bold text-slate-900">€{Number(booking.touristTaxTotal).toFixed(2)}</p>
                  ) : (
                    <p className="text-slate-600">Non calcolata</p>
                  )}
                  <p className={`text-sm font-medium ${booking.touristTaxPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.touristTaxPaid ? '✓ Pagata' : '⏳ Da pagare'}
                  </p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={booking.touristTaxPaid}
                    onChange={(e) => updateTouristTax(e.target.checked)}
                    disabled={updating}
                    className="w-6 h-6 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Segna come pagata</span>
                </label>
              </div>
              {booking.touristTaxPaymentProof && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600 mb-1">Screenshot pagamento:</p>
                  <img
                    src={booking.touristTaxPaymentProof}
                    alt="Prova pagamento"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Check-ins */}
          <div className="space-y-6">
            {/* Check-in Status */}
            <div className={`rounded-xl p-4 border ${hasCheckIns ? (allCheckInsComplete ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200') : 'bg-orange-50 border-orange-200'}`}>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                {hasCheckIns ? (
                  allCheckInsComplete ? (
                    <CheckCircle className="mr-2 text-green-600" size={20} />
                  ) : (
                    <Clock className="mr-2 text-blue-600" size={20} />
                  )
                ) : (
                  <AlertCircle className="mr-2 text-orange-600" size={20} />
                )}
                Stato Check-in Ospiti
              </h3>

              {hasCheckIns ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      {booking.guestCheckIns.length} ospite/i registrato/i
                    </span>
                    {allCheckInsComplete && (
                      <span className="text-sm font-bold text-green-600">✓ Tutti completati</span>
                    )}
                  </div>

                  {booking.guestCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {checkIn.firstName} {checkIn.lastName}
                          </p>
                          <p className="text-sm text-slate-600">{checkIn.fiscalCode}</p>
                          <p className="text-xs text-slate-500">
                            {checkIn.documentType.replace('_', ' ')} - {checkIn.documentNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            checkIn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            checkIn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {checkIn.status === 'APPROVED' ? 'Approvato' :
                             checkIn.status === 'PENDING' ? 'In attesa' : 'Rifiutato'}
                          </span>
                          {checkIn.submittedToPolice && (
                            <p className="text-xs text-green-600 mt-1">✓ Comunicato PS</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="mx-auto text-orange-400 mb-2" size={32} />
                  <p className="text-slate-700 font-medium">Nessun check-in registrato</p>
                  <p className="text-sm text-slate-500 mt-1">
                    L'ospite non ha ancora completato il check-in online
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            {booking.notes && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Note</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}

            {/* Struttura e Stanza */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Home className="mr-2 text-blue-600" size={20} />
                Struttura
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">{booking.property.name}</span>
                  <CopyButton text={booking.property.name} fieldName="propertyName" />
                </div>
                {booking.room && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Stanza: {booking.room.name}</span>
                    <CopyButton text={booking.room.name} fieldName="roomName" />
                  </div>
                )}
                <p className="text-sm text-slate-500">{booking.property.address}, {booking.property.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}

// Block Date Modal Component
function BlockDateModal({
  properties,
  selectedProperty,
  selectedDate,
  onClose,
  onSuccess,
}: {
  properties: Property[]
  selectedProperty: string
  selectedDate?: Date
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    propertyId: selectedProperty !== 'all' ? selectedProperty : '',
    startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    endDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    type: 'BLOCKED',
    title: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nella creazione evento')
      }
    } catch (err) {
      setError('Errore nella creazione evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Blocca Date</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Struttura *
            </label>
            <select
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
            >
              <option value="">Seleziona struttura</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo *
            </label>
            <select
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="BLOCKED">Bloccato</option>
              <option value="MAINTENANCE">Manutenzione</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Inizio *
            </label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Fine *
            </label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titolo
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={formData.type === 'BLOCKED' ? 'Periodo bloccato' : 'Manutenzione'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrizione
            </label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creazione...' : 'Blocca Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
