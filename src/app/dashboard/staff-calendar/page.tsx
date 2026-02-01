'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Users, Home, Bed, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
}

interface StaffAssignment {
  id: string
  date: string
  taskType: string
  status: string
  notes: string | null
  userId: string
  roomId: string | null
  propertyId: string | null
  user: {
    name: string
  }
  property?: {
    name: string
  }
  room?: {
    name: string
  }
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guestName: string
  roomId: string | null
  status: string
  room?: {
    name: string
  }
}

interface Room {
  id: string
  name: string
  propertyId: string
  property: {
    name: string
  }
}

interface Property {
  id: string
  name: string
  hasRooms: boolean
}

// Colori per ogni dipendente
const STAFF_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export default function StaffCalendarPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [assignments, setAssignments] = useState<StaffAssignment[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (properties.length > 0) {
      if (selectedProperty && selectedProperty !== 'all') {
        fetchRooms(selectedProperty)
      } else {
        fetchAllRooms()
      }
    }
  }, [selectedProperty, properties])

  const fetchData = async () => {
    try {
      const [staffRes, assignmentsRes, bookingsRes, propertiesRes] = await Promise.all([
        fetch('/api/users?role=STAFF'),
        fetch('/api/staff-assignments'),
        fetch('/api/bookings'),
        fetch('/api/properties'),
      ])

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(staffData)
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/rooms`)
      if (response.ok) {
        const data = await response.json()
        const property = properties.find(p => p.id === propertyId)
        // Aggiungi le informazioni della proprietà a ogni stanza
        const roomsWithProperty = data.map((room: Room) => ({
          ...room,
          property: property ? { name: property.name } : { name: 'N/A' }
        }))
        setRooms(roomsWithProperty)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchAllRooms = async () => {
    try {
      const allRooms: Room[] = []
      const propertiesWithRooms = properties.filter(p => p.hasRooms)
      
      await Promise.all(
        propertiesWithRooms.map(async (property) => {
          try {
            const response = await fetch(`/api/properties/${property.id}/rooms`)
            if (response.ok) {
              const data = await response.json()
              // Aggiungi le informazioni della proprietà a ogni stanza
              const roomsWithProperty = data.map((room: Room) => ({
                ...room,
                property: { name: property.name }
              }))
              allRooms.push(...roomsWithProperty)
            }
          } catch (error) {
            console.error(`Error fetching rooms for property ${property.id}:`, error)
          }
        })
      )
      
      setRooms(allRooms)
    } catch (error) {
      console.error('Error fetching all rooms:', error)
    }
  }

  const getStaffColor = (staffId: string) => {
    const index = staff.findIndex(s => s.id === staffId)
    return STAFF_COLORS[index % STAFF_COLORS.length]
  }

  const getTaskTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CLEANING: 'Pulizia',
      MAINTENANCE: 'Manutenzione',
      CHECK_IN: 'Check-in',
      CHECK_OUT: 'Check-out',
      LAUNDRY: 'Lavanderia',
      INSPECTION: 'Ispezione',
      OTHER: 'Altro',
    }
    return labels[type] || type
  }

  const getAssignmentsForRoomAndDate = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return assignments.filter(a => {
      const assignmentDate = new Date(a.date).toISOString().split('T')[0]
      return a.roomId === roomId && assignmentDate === dateStr
    })
  }

  const getBookingsForRoomAndDate = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => {
      if (b.roomId !== roomId || b.status === 'CANCELLED') return false
      const checkIn = new Date(b.checkIn).toISOString().split('T')[0]
      const checkOut = new Date(b.checkOut).toISOString().split('T')[0]
      return dateStr >= checkIn && dateStr <= checkOut
    })
  }

  const isCheckIn = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.some(b => {
      if (b.roomId !== roomId || b.status === 'CANCELLED') return false
      const checkIn = new Date(b.checkIn).toISOString().split('T')[0]
      return checkIn === dateStr
    })
  }

  const isCheckOut = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.some(b => {
      if (b.roomId !== roomId || b.status === 'CANCELLED') return false
      const checkOut = new Date(b.checkOut).toISOString().split('T')[0]
      return checkOut === dateStr
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  const filteredRooms = selectedProperty === 'all' 
    ? rooms 
    : rooms.filter(r => r.propertyId === selectedProperty)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento calendario...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Calendario Dipendenti</h1>
          <p className="text-[#d4cdb0] text-lg">Visualizza assegnazioni staff per stanza</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-[#d4cdb0]/30 rounded-lg">
            <Home size={16} className="text-[#3d4a3c]" />
          </div>
          Filtri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Struttura
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
            >
              <option value="all">Tutte le strutture</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Legend */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-[#d4cdb0]/30 rounded-lg">
            <Users size={16} className="text-[#3d4a3c]" />
          </div>
          Legenda Dipendenti
        </h2>
        <div className="flex flex-wrap gap-4">
          {staff.map((member, index) => (
            <div key={member.id} className="flex items-center bg-slate-50 rounded-xl px-3 py-2">
              <div
                className="w-5 h-5 rounded-lg mr-2"
                style={{ backgroundColor: STAFF_COLORS[index % STAFF_COLORS.length] }}
              ></div>
              <span className="text-sm font-medium text-slate-700">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 overflow-x-auto">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="p-3 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white rounded-xl transition-all shadow-md flex items-center space-x-2"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Precedente</span>
          </button>
          <h2 className="text-2xl font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-3 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white rounded-xl transition-all shadow-md flex items-center space-x-2"
          >
            <span className="font-medium">Successivo</span>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-300 p-3 bg-slate-50 text-left font-semibold text-slate-700 sticky left-0 z-10 min-w-[200px]">
                  Stanza
                </th>
                {getDaysInMonth().map((date, index) => (
                  <th
                    key={index}
                    className={`border border-slate-300 p-2 text-center text-xs font-semibold text-slate-700 min-w-[80px] ${
                      date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div>{dayNames[date.getDay()]}</div>
                    <div className="text-sm font-bold">{date.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => (
                <tr key={room.id}>
                  <td className="border border-slate-300 p-3 bg-slate-50 sticky left-0 z-10 font-medium text-slate-900">
                    <div className="font-semibold">{room.name}</div>
                    <div className="text-xs text-slate-600">{room.property.name}</div>
                  </td>
                  {getDaysInMonth().map((date, dayIndex) => {
                    const assignments = getAssignmentsForRoomAndDate(room.id, date)
                    const bookings = getBookingsForRoomAndDate(room.id, date)
                    const checkIn = isCheckIn(room.id, date)
                    const checkOut = isCheckOut(room.id, date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

                    return (
                      <td
                        key={dayIndex}
                        onClick={() => setSelectedDate(date)}
                        className={`border border-slate-200 p-2 cursor-pointer transition-colors relative min-h-[80px] ${
                          isToday ? 'ring-2 ring-[#3d4a3c]' : ''
                        } ${isSelected ? 'ring-2 ring-[#d4cdb0]' : ''} ${
                          date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-50' : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          {/* Staff Assignments */}
                          {assignments.map(assignment => (
                            <div
                              key={assignment.id}
                              className="text-xs p-1.5 rounded text-white font-medium leading-tight"
                              style={{ backgroundColor: getStaffColor(assignment.userId) }}
                              title={`${assignment.user.name} - ${getTaskTypeLabel(assignment.taskType)}`}
                            >
                              <div className="font-semibold truncate">{assignment.user.name}</div>
                              <div className="text-[10px] opacity-90 truncate mt-0.5">{getTaskTypeLabel(assignment.taskType)}</div>
                            </div>
                          ))}
                          
                          {/* Check-in/Check-out indicators */}
                          {checkIn && (
                            <div className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-lg text-center font-semibold">
                              Check-in
                            </div>
                          )}
                          {checkOut && (
                            <div className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-lg text-center font-semibold">
                              Check-out
                            </div>
                          )}

                          {/* Booking indicator */}
                          {bookings.length > 0 && assignments.length === 0 && (
                            <div className="text-xs bg-[#d4cdb0]/30 text-[#3d4a3c] px-1.5 py-0.5 rounded-lg text-center font-medium">
                              Occupata
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-[#d4cdb0]/30 rounded-xl">
                <CalendarIcon size={20} className="text-[#3d4a3c]" />
              </div>
              {selectedDate.toLocaleDateString('it-IT', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <button
              onClick={() => setSelectedDate(undefined)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            {filteredRooms.map(room => {
              const assignments = getAssignmentsForRoomAndDate(room.id, selectedDate)
              const bookings = getBookingsForRoomAndDate(room.id, selectedDate)
              const checkIn = isCheckIn(room.id, selectedDate)
              const checkOut = isCheckOut(room.id, selectedDate)

              if (assignments.length === 0 && bookings.length === 0) return null

              return (
                <div key={room.id} className="border border-slate-200 rounded-2xl p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Bed size={16} className="text-[#3d4a3c]" />
                    {room.name} - {room.property.name}
                  </h3>

                  {assignments.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Dipendenti assegnati:</h4>
                      <div className="space-y-2">
                        {assignments.map(assignment => (
                            <div
                              key={assignment.id}
                              className="flex items-center space-x-2 text-sm bg-slate-50 rounded-xl px-3 py-2"
                            >
                              <div
                                className="w-4 h-4 rounded-lg"
                                style={{ backgroundColor: getStaffColor(assignment.userId) }}
                              ></div>
                              <span className="text-slate-900 font-medium">{assignment.user.name}</span>
                              <span className="text-slate-500">- {getTaskTypeLabel(assignment.taskType)}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Prenotazioni:</h4>
                      <div className="space-y-2">
                        {bookings.map(booking => (
                          <div key={booking.id} className="text-sm text-slate-600 flex items-center gap-2">
                            {booking.guestName}
                            {checkIn && <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">(Check-in)</span>}
                            {checkOut && <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg">(Check-out)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

