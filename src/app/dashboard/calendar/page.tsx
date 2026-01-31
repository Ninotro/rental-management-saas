'use client'

import { useEffect, useState } from 'react'
import Calendar from '@/components/Calendar'
import { Calendar as CalendarIcon, Home, Bed, Plus, X } from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

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
        <button
          onClick={() => setShowBlockModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all"
        >
          <Plus size={20} />
          <span>Blocca Date</span>
        </button>
      </div>

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
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Eventi per {selectedDate.toLocaleDateString('it-IT', {
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

          {events.filter(event => {
            const eventStart = new Date(event.startDate)
            const eventEnd = new Date(event.endDate)
            eventStart.setHours(0, 0, 0, 0)
            eventEnd.setHours(0, 0, 0, 0)
            const checkDate = new Date(selectedDate)
            checkDate.setHours(0, 0, 0, 0)

            return checkDate >= eventStart && checkDate <= eventEnd
          }).length > 0 ? (
            <div className="space-y-3">
              {events.filter(event => {
                const eventStart = new Date(event.startDate)
                const eventEnd = new Date(event.endDate)
                eventStart.setHours(0, 0, 0, 0)
                eventEnd.setHours(0, 0, 0, 0)
                const checkDate = new Date(selectedDate)
                checkDate.setHours(0, 0, 0, 0)

                return checkDate >= eventStart && checkDate <= eventEnd
              }).map(event => {
                // Determina il tipo e lo status dell'evento
                const isBooking = event.type === 'booking'
                const status = event.status?.toLowerCase()
                
                let statusLabel = ''
                let statusClass = ''
                
                if (isBooking) {
                  if (status === 'confirmed' || status === 'checked_in' || status === 'checked_out') {
                    statusLabel = status === 'checked_in' ? 'Check-in' : 
                                  status === 'checked_out' ? 'Check-out' : 'Confermata'
                    statusClass = 'bg-green-100 text-green-800'
                  } else if (status === 'pending') {
                    statusLabel = 'In Attesa'
                    statusClass = 'bg-yellow-100 text-yellow-800'
                  } else {
                    statusLabel = 'Cancellata'
                    statusClass = 'bg-red-100 text-red-800'
                  }
                } else if (event.type === 'maintenance') {
                  statusLabel = 'Manutenzione'
                  statusClass = 'bg-orange-100 text-orange-800'
                } else {
                  statusLabel = 'Bloccato'
                  statusClass = 'bg-red-100 text-red-800'
                }
                
                return (
                  <div
                    key={event.id}
                    className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900">{event.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {event.startDate.toLocaleDateString('it-IT')} - {event.endDate.toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              Nessun evento per questa data
            </div>
          )}
        </div>
      )}

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
