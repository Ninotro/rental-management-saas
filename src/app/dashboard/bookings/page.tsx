'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Search,
  Filter,
  Mail,
  Phone,
  DollarSign,
  X,
  AlertCircle,
  Home,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Trash2,
  Send,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Booking {
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
  property: {
    id: string
    name: string
    city: string
  }
  room?: {
    id: string
    name: string
  }
  bookingRooms?: {
    room: {
      id: string
      name: string
    }
  }[]
  sentMessages?: {
    id: string
    status: string
    channel: string
    sentAt: string | null
  }[]
  touristTaxTotal: number | null
  touristTaxPaid: boolean
}

// Helper per ottenere i nomi delle stanze di una prenotazione
function getRoomNames(booking: Booking): string {
  // Prima controlla bookingRooms (nuovo sistema multi-stanza)
  if (booking.bookingRooms && booking.bookingRooms.length > 0) {
    return booking.bookingRooms.map(br => br.room.name).join(', ')
  }
  // Fallback a room singola (legacy)
  if (booking.room) {
    return booking.room.name
  }
  return ''
}

interface Property {
  id: string
  name: string
  city: string
  hasRooms: boolean
  maxGuests: number
}

interface Room {
  id: string
  name: string
  type: string
  maxGuests: number
  basePrice: number
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterProperty, setFilterProperty] = useState('ALL')
  const [filterRoom, setFilterRoom] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    fetchBookings()
    fetchProperties()
  }, [])

  useEffect(() => {
    // Quando cambia la proprietà, carica le stanze di quella proprietà
    if (filterProperty !== 'ALL') {
      fetchRooms(filterProperty)
    } else {
      setRooms([])
      setFilterRoom('ALL')
    }
  }, [filterProperty])

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

  const handleDeleteBooking = async (booking: Booking) => {
    if (!confirm(`Sei sicuro di voler eliminare la prenotazione di ${booking.guestName}?\n\nQuesta azione non può essere annullata.`)) {
      return
    }

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBookings(bookings.filter(b => b.id !== booking.id))
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Errore durante l\'eliminazione della prenotazione')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confermata'
      case 'PENDING':
        return 'In Attesa'
      case 'CHECKED_IN':
        return 'Check-in'
      case 'CHECKED_OUT':
        return 'Check-out'
      case 'CANCELLED':
        return 'Annullata'
      default:
        return status
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'BOOKING_COM':
        return 'Booking.com'
      case 'AIRBNB':
        return 'Airbnb'
      case 'DIRECT':
        return 'Diretto'
      default:
        return channel
    }
  }

  // Calcola statistiche
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + Number(b.totalPrice), 0),
  }

  // Filtri con useMemo per garantire re-render corretto
  const filteredBookings = useMemo(() => {
    let result = [...bookings]

    // Filtro per stato
    if (filterStatus !== 'ALL') {
      result = result.filter(b => b.status === filterStatus)
    }

    // Filtro per proprietà
    if (filterProperty !== 'ALL') {
      result = result.filter(b => b.property?.id === filterProperty)
    }

    // Filtro per stanza
    if (filterRoom !== 'ALL') {
      result = result.filter(b => b.room?.id === filterRoom)
    }

    // Filtro per data da
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom)
      fromDate.setHours(0, 0, 0, 0)
      result = result.filter(b => {
        const checkIn = new Date(b.checkIn)
        checkIn.setHours(0, 0, 0, 0)
        return checkIn >= fromDate
      })
    }

    // Filtro per data a
    if (filterDateTo) {
      const toDate = new Date(filterDateTo)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(b => {
        const checkIn = new Date(b.checkIn)
        return checkIn <= toDate
      })
    }

    // Filtro per ricerca testuale
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(b => {
        const guestName = (b.guestName || '').toLowerCase()
        const guestEmail = (b.guestEmail || '').toLowerCase()
        const propertyName = (b.property?.name || '').toLowerCase()
        const roomName = (b.room?.name || '').toLowerCase()

        return guestName.includes(query) ||
               guestEmail.includes(query) ||
               propertyName.includes(query) ||
               roomName.includes(query)
      })
    }

    // Ordina per check-in crescente (prima le prenotazioni più vicine)
    result.sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

    return result
  }, [bookings, filterStatus, filterProperty, filterRoom, filterDateFrom, filterDateTo, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#d4cdb0] rounded-full animate-spin border-t-[#3d4a3c]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-[#3d4a3c] mb-1">Prenotazioni</h1>
          <p className="text-[#3d4a3c]/60">Gestisci le prenotazioni delle tue strutture</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#3d4a3c] text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus size={20} />
          <span>Nuova Prenotazione</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-[#d4cdb0]/20 rounded-xl">
              <Calendar size={22} className="text-[#d4cdb0]" />
            </div>
          </div>
          <h3 className="text-white/70 text-sm font-medium mb-1">Totale Prenotazioni</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle size={22} />
            </div>
          </div>
          <h3 className="text-white/70 text-sm font-medium mb-1">Confermate</h3>
          <p className="text-3xl font-bold">{stats.confirmed}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Clock size={22} />
            </div>
          </div>
          <h3 className="text-white/70 text-sm font-medium mb-1">In Attesa</h3>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign size={22} />
            </div>
          </div>
          <h3 className="text-white/70 text-sm font-medium mb-1">Ricavi Totali</h3>
          <p className="text-3xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3d4a3c]/40" size={20} />
            <input
              type="text"
              placeholder="Cerca per nome ospite, stanza o struttura..."
              className="w-full pl-12 pr-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] placeholder-[#3d4a3c]/40 focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent bg-white/80 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'CONFIRMED', 'PENDING', 'CHECKED_IN'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${filterStatus === status
                ? 'bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white shadow-lg'
                : 'bg-[#3d4a3c]/5 text-[#3d4a3c]/70 hover:bg-[#3d4a3c]/10'
                }`}
            >
              {status === 'ALL' ? 'Tutte' : getStatusLabel(status)}
            </button>
          ))}
        </div>
        </div>

        {/* Property and Room Filters */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent bg-white/80"
            >
              <option value="ALL">Tutte le strutture</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              disabled={filterProperty === 'ALL' || rooms.length === 0}
              className="w-full px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent bg-white/80 disabled:bg-[#3d4a3c]/5 disabled:cursor-not-allowed"
            >
              <option value="ALL">
                {filterProperty === 'ALL'
                  ? 'Seleziona prima una struttura'
                  : rooms.length === 0
                    ? 'Nessuna stanza disponibile'
                    : 'Tutte le stanze'}
              </option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#3d4a3c]/60 mb-1">Check-in dal</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent bg-white/80"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-[#3d4a3c]/60 mb-1">Check-in al</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] focus:ring-2 focus:ring-[#d4cdb0] focus:border-transparent bg-white/80"
            />
          </div>

          {(filterProperty !== 'ALL' || filterRoom !== 'ALL' || filterDateFrom || filterDateTo) && (
            <button
              onClick={() => {
                setFilterProperty('ALL')
                setFilterRoom('ALL')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-medium transition-colors flex items-center space-x-2 self-end"
            >
              <X size={18} />
              <span>Cancella Filtri</span>
            </button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Guest Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#d4cdb0] rounded-2xl flex items-center justify-center text-[#3d4a3c] font-bold text-lg shadow-lg">
                      {booking.guestName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {booking.guestName}
                      </h3>
                      <div className="flex items-center text-sm text-white/70">
                        <MapPin size={14} className="mr-1" />
                        {booking.property.name}
                        {getRoomNames(booking) && ` - ${getRoomNames(booking)}`}
                        {' - '}{booking.property.city}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-sm text-white/80">
                      <Mail size={14} className="mr-2 text-[#d4cdb0]" />
                      {booking.guestEmail}
                    </div>
                    {booking.guestPhone && (
                      <div className="flex items-center text-sm text-white/80">
                        <Phone size={14} className="mr-2 text-[#d4cdb0]" />
                        {booking.guestPhone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-white/80">
                      <Users size={14} className="mr-2 text-[#d4cdb0]" />
                      {booking.guests} {booking.guests === 1 ? 'ospite' : 'ospiti'}
                    </div>
                    <div className="flex items-center text-sm font-semibold text-[#d4cdb0]">
                      <DollarSign size={14} className="mr-2 text-emerald-400" />
                      €{booking.totalPrice.toLocaleString()}
                    </div>
                  </div>

                </div>

                {/* Dates & Status */}
                <div className="flex flex-col items-end space-y-3">
                  <div className="flex items-center space-x-4 bg-white/10 px-4 py-3 rounded-2xl">
                    <div className="text-center">
                      <div className="text-xs text-white/60 mb-1">Check-in</div>
                      <div className="font-bold text-white">
                        {format(new Date(booking.checkIn), 'd MMM', { locale: it })}
                      </div>
                    </div>
                    <div className="text-[#d4cdb0]">→</div>
                    <div className="text-center">
                      <div className="text-xs text-white/60 mb-1">Check-out</div>
                      <div className="font-bold text-white">
                        {format(new Date(booking.checkOut), 'd MMM', { locale: it })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                    <span className="px-3 py-1.5 bg-[#d4cdb0]/30 rounded-xl text-xs font-semibold text-white">
                      {getChannelLabel(booking.channel)}
                    </span>
                    {/* Indicatore messaggi inviati */}
                    {booking.sentMessages && booking.sentMessages.length > 0 ? (
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 ${
                          booking.sentMessages.some(m => m.status === 'SENT')
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : booking.sentMessages.some(m => m.status === 'FAILED')
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}
                        title={`${booking.sentMessages.filter(m => m.status === 'SENT').length} messaggi inviati`}
                      >
                        <Mail size={12} />
                        <span>{booking.sentMessages.filter(m => m.status === 'SENT').length}</span>
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 bg-slate-100 text-slate-500 border border-slate-200"
                        title="Nessun messaggio inviato"
                      >
                        <Mail size={12} />
                        <span>0</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowEditModal(true)
                      }}
                      className="flex items-center space-x-2 text-[#3d4a3c] hover:text-[#3d4a3c] font-medium text-sm bg-[#d4cdb0] hover:bg-[#c4b896] px-3 py-2 rounded-xl transition-all duration-300"
                    >
                      <Edit size={16} />
                      <span>Modifica</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking)}
                      className="flex items-center space-x-2 text-white font-medium text-sm bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition-all duration-300"
                      title="Elimina prenotazione"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50">
            <div className="w-20 h-20 bg-[#3d4a3c]/5 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={36} className="text-[#3d4a3c]/40" />
            </div>
            <h3 className="text-xl font-semibold text-[#3d4a3c] mb-2">
              Nessuna prenotazione
            </h3>
            <p className="text-[#3d4a3c]/60 mb-6">
              {filterStatus === 'ALL'
                ? 'Inizia aggiungendo la tua prima prenotazione'
                : `Nessuna prenotazione con stato ${getStatusLabel(filterStatus)}`}
            </p>
            {filterStatus === 'ALL' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus size={20} />
                <span>Aggiungi Prenotazione</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchBookings()
            setShowCreateModal(false)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBooking(null)
          }}
          onSuccess={() => {
            fetchBookings()
            setShowEditModal(false)
            setSelectedBooking(null)
          }}
        />
      )}
    </div>
  )
}

// Create Booking Modal Component
function CreateBookingModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    propertyId: '',
    roomIds: [] as string[],  // Array per selezione multipla stanze
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    totalPrice: '',
    status: 'PENDING',
    channel: 'DIRECT',
    notes: '',
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (formData.propertyId) {
      fetchRooms(formData.propertyId)
    }
  }, [formData.propertyId, properties])

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

  const handleSubmit = async (e: React.FormEvent, createAnother: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          totalPrice: parseFloat(formData.totalPrice),
          guests: parseInt(formData.guests.toString()),
        }),
      })

      if (response.ok) {
        if (createAnother) {
          // Mantieni i dati del cliente e la proprietà, resetta solo i campi della prenotazione
          setFormData(prev => ({
            ...prev,
            roomIds: [],
            checkIn: '',
            checkOut: '',
            totalPrice: '',
            notes: '',
          }))
          setError('')
          setSuccessMessage('Prenotazione creata! Puoi crearne un\'altra per lo stesso cliente.')
          setTimeout(() => setSuccessMessage(''), 4000)
        } else {
          onSuccess()
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nella creazione della prenotazione')
      }
    } catch (err) {
      setError('Errore nella creazione della prenotazione')
    } finally {
      setLoading(false)
    }
  }

  const selectedProperty = properties.find(p => p.id === formData.propertyId)
  const selectedRooms = rooms.filter(r => formData.roomIds.includes(r.id))

  // Funzione per toggle selezione stanza
  const toggleRoom = (roomId: string) => {
    setFormData(prev => ({
      ...prev,
      roomIds: prev.roomIds.includes(roomId)
        ? prev.roomIds.filter(id => id !== roomId)
        : [...prev.roomIds, roomId]
    }))
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full p-6 shadow-2xl my-8 border border-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#3d4a3c]">Nuova Prenotazione</h2>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-6 flex items-center border border-rose-200">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl mb-6 flex items-center border border-emerald-200">
            <CheckCircle size={20} className="mr-2" />
            {successMessage}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Proprietà e Stanza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Struttura
              </label>
              <select
                className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
              >
                <option value="">Seleziona struttura</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stanze {formData.roomIds.length > 0 && `(${formData.roomIds.length} selezionate)`}
              </label>
              {!formData.propertyId ? (
                <p className="text-sm text-slate-500 bg-slate-100 rounded-xl px-4 py-3">
                  Prima seleziona una struttura
                </p>
              ) : rooms.length === 0 ? (
                <p className="text-sm text-orange-600 bg-orange-50 rounded-xl px-4 py-3">
                  Questa struttura non ha stanze. Creane una prima di prenotare.
                </p>
              ) : (
                <div className="border border-[#3d4a3c]/10 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {rooms.map(room => (
                    <label
                      key={room.id}
                      className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                        formData.roomIds.includes(room.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.roomIds.includes(room.id)}
                        onChange={() => toggleRoom(room.id)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-slate-900">{room.name}</span>
                        <span className="text-sm text-slate-500 ml-2">
                          {room.type} - max {room.maxGuests} ospiti
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dati Ospite */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dati Ospite</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  placeholder="mario@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefono
                </label>
                <input
                  type="tel"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.guestPhone}
                  onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numero Ospiti
                  {selectedRooms.length > 0 && (
                    <span className="text-slate-500 text-xs ml-2">
                      (max {selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0)} per le stanze selezionate)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRooms.length > 0
                    ? selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0)
                    : (selectedProperty?.maxGuests || 10)}
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          {/* Date e Prezzo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dettagli Soggiorno</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check-in
                </label>
                <input
                  type="date"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check-out
                </label>
                <input
                  type="date"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prezzo Totale (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            </div>
          </div>

          {/* Status e Canale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stato
              </label>
              <select
                className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">In Attesa</option>
                <option value="CONFIRMED">Confermata</option>
                <option value="CHECKED_IN">Check-in</option>
                <option value="CHECKED_OUT">Check-out</option>
                <option value="CANCELLED">Annullata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Canale
              </label>
              <select
                className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="DIRECT">Diretto</option>
                <option value="BOOKING_COM">Booking.com</option>
                <option value="AIRBNB">Airbnb</option>
                <option value="OTHER">Altro</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note
            </label>
            <textarea
              rows={3}
              className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note aggiuntive sulla prenotazione..."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3 pt-4 border-t">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creazione...' : 'Crea Prenotazione'}
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as any, true)}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>{loading ? 'Creazione...' : 'Salva e crea un\'altra prenotazione'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RoomMessageTemplate {
  id: string
  name: string
  subject: string | null
  type: string
  channel: string
}

interface SentMessageRecord {
  id: string
  status: string
  sentAt: string | null
  channel: string
  message: { name: string }
}

// Edit Booking Modal Component
function EditBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Stato per messaggi
  const [availableMessages, setAvailableMessages] = useState<RoomMessageTemplate[]>([])
  const [sentMessages, setSentMessages] = useState<SentMessageRecord[]>([])
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null)
  const [messageSuccess, setMessageSuccess] = useState('')
  const [messageError, setMessageError] = useState('')

  // Carica i messaggi disponibili per questa prenotazione
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/bookings/${booking.id}/send-message`)
        if (response.ok) {
          const data = await response.json()
          setAvailableMessages(data.availableMessages || [])
          setSentMessages(data.sentMessages || [])
        }
      } catch (err) {
        console.error('Errore caricamento messaggi:', err)
      }
    }
    fetchMessages()
  }, [booking.id])

  // Funzione per inviare un messaggio
  const handleSendMessage = async (messageId: string) => {
    setSendingMessageId(messageId)
    setMessageError('')
    setMessageSuccess('')

    try {
      const response = await fetch(`/api/bookings/${booking.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessageSuccess(data.message || 'Messaggio inviato!')
        // Ricarica lo storico
        const refreshResponse = await fetch(`/api/bookings/${booking.id}/send-message`)
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          setSentMessages(refreshData.sentMessages || [])
        }
        setTimeout(() => setMessageSuccess(''), 4000)
      } else {
        setMessageError(data.error || 'Errore nell\'invio')
      }
    } catch (err) {
      setMessageError('Errore di connessione')
    } finally {
      setSendingMessageId(null)
    }
  }

  // Funzione per copiare testo in maiuscolo
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      const upperText = text.toUpperCase()
      await navigator.clipboard.writeText(upperText)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Errore nella copia:', err)
    }
  }
  const [formData, setFormData] = useState({
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone || '',
    checkIn: booking.checkIn.split('T')[0],
    checkOut: booking.checkOut.split('T')[0],
    guests: booking.guests,
    totalPrice: booking.totalPrice.toString(),
    status: booking.status,
    channel: booking.channel,
    touristTaxTotal: booking.touristTaxTotal?.toString() || '',
    touristTaxPaid: booking.touristTaxPaid,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          guests: parseInt(formData.guests.toString()),
          totalPrice: parseFloat(formData.totalPrice),
          status: formData.status,
          channel: formData.channel,
          touristTaxTotal: formData.touristTaxTotal ? parseFloat(formData.touristTaxTotal) : null,
          touristTaxPaid: formData.touristTaxPaid,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'aggiornamento della prenotazione')
      }
    } catch (err) {
      setError('Errore nell\'aggiornamento della prenotazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Modifica Prenotazione</h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Proprietà (read-only) */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Home size={20} className="text-slate-600" />
                <h3 className="font-semibold text-slate-900">Struttura</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-slate-700 flex-1">
                  {booking.property.name}
                  {getRoomNames(booking) && ` - ${getRoomNames(booking)}`}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${booking.property.name}${getRoomNames(booking) ? ` - ${getRoomNames(booking)}` : ''}`, 'property')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'property'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Copy size={14} />
                  <span>{copiedField === 'property' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-500 flex-1">{booking.property.city}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(booking.property.city, 'city')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'city'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Copy size={14} />
                  <span>{copiedField === 'city' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dati Ospite */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dati Ospite</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.guestName, 'guestName')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'guestName'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Copy size={14} />
                    <span>{copiedField === 'guestName' ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.guestEmail, 'guestEmail')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'guestEmail'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Copy size={14} />
                    <span>{copiedField === 'guestEmail' ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefono
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                  />
                  {formData.guestPhone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.guestPhone, 'guestPhone')}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'guestPhone'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      <Copy size={14} />
                      <span>{copiedField === 'guestPhone' ? 'Copiato!' : 'Copia'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numero Ospiti
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          {/* Date e Prezzo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dettagli Soggiorno</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check-in
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.checkIn, 'checkIn')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'checkIn'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Copy size={14} />
                    <span>{copiedField === 'checkIn' ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Check-out
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.checkOut, 'checkOut')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'checkOut'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Copy size={14} />
                    <span>{copiedField === 'checkOut' ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prezzo Totale (€)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex-1 border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.totalPrice, 'totalPrice')}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors text-xs font-medium ${copiedField === 'totalPrice'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Copy size={14} />
                    <span>{copiedField === 'totalPrice' ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status e Canale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Stato
              </label>
              <select
                className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">In Attesa</option>
                <option value="CONFIRMED">Confermata</option>
                <option value="CHECKED_IN">Check-in</option>
                <option value="CHECKED_OUT">Check-out</option>
                <option value="CANCELLED">Annullata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Canale
              </label>
              <select
                className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              >
                <option value="DIRECT">Diretto</option>
                <option value="BOOKING_COM">Booking.com</option>
                <option value="AIRBNB">Airbnb</option>
                <option value="OTHER">Altro</option>
              </select>
            </div>
          </div>

          {/* Gestione Tassa di Soggiorno */}
          <div className="border-t pt-6 bg-slate-50/50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <DollarSign size={20} className="text-blue-600" />
              <span>Gestione Tassa di Soggiorno</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Importo Calcolato (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-[#3d4a3c]/10 rounded-2xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.touristTaxTotal}
                  onChange={(e) => setFormData({ ...formData, touristTaxTotal: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    className="w-6 h-6 border-slate-300 rounded text-green-600 focus:ring-2 focus:ring-green-500"
                    checked={formData.touristTaxPaid}
                    onChange={(e) => setFormData({ ...formData, touristTaxPaid: e.target.checked })}
                  />
                  <span className="font-bold text-slate-700">Tassa pagata</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sezione Invio Messaggi */}
          <div className="border-t pt-6 bg-blue-50/50 p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <MessageSquare size={20} className="text-blue-600" />
              <span>Invia Messaggi</span>
            </h3>

            {messageSuccess && (
              <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 flex items-center border border-green-200">
                <CheckCircle size={18} className="mr-2" />
                {messageSuccess}
              </div>
            )}

            {messageError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 flex items-center border border-red-200">
                <AlertCircle size={18} className="mr-2" />
                {messageError}
              </div>
            )}

            {!booking.room ? (
              <p className="text-slate-500 text-sm">
                Nessuna stanza associata a questa prenotazione. I messaggi sono configurati per stanza.
              </p>
            ) : availableMessages.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500 text-sm">
                  Nessun messaggio configurato per questa stanza.
                </p>
                <a
                  href="/dashboard/room-messages"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  Configura messaggi
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {availableMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{msg.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          msg.channel === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
                          msg.channel === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {msg.channel === 'EMAIL' ? 'Email' : msg.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email + WhatsApp'}
                        </span>
                        {msg.subject && (
                          <span className="text-xs text-slate-500">
                            Oggetto: {msg.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(msg.id)}
                      disabled={sendingMessageId === msg.id || !formData.guestEmail}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingMessageId === msg.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Invio...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Invia</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}

                {!formData.guestEmail && (
                  <p className="text-amber-600 text-sm flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    Inserisci l'email dell'ospite per poter inviare messaggi
                  </p>
                )}
              </div>
            )}

            {/* Storico messaggi inviati */}
            {sentMessages.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Storico invii</h4>
                <div className="space-y-2">
                  {sentMessages.slice(0, 5).map((sent) => (
                    <div
                      key={sent.id}
                      className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg"
                    >
                      <span className="text-slate-700">{sent.message?.name || 'Messaggio'}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          sent.status === 'SENT' ? 'bg-green-100 text-green-700' :
                          sent.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sent.status === 'SENT' ? 'Inviato' : sent.status === 'FAILED' ? 'Fallito' : 'In attesa'}
                        </span>
                        {sent.sentAt && (
                          <span className="text-xs text-slate-500">
                            {new Date(sent.sentAt).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#3d4a3c]/10 rounded-2xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
