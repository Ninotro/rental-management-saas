'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

interface CalendarProps {
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  selectedDate?: Date
}

export default function Calendar({ events, onDateClick, onEventClick, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)

      return checkDate >= eventStart && checkDate <= eventEnd
    })
  }

  const getDateColor = (date: Date, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return 'bg-white hover:bg-slate-50'

    const hasBooking = dayEvents.some(e => e.type === 'booking' && e.status !== 'cancelled')
    const hasBlocked = dayEvents.some(e => e.type === 'blocked' || e.type === 'maintenance')

    if (hasBooking && hasBlocked) return 'bg-orange-100 hover:bg-orange-200'
    if (hasBooking) return 'bg-blue-100 hover:bg-blue-200'
    if (hasBlocked) return 'bg-red-100 hover:bg-red-200'

    return 'bg-white hover:bg-slate-50'
  }

  const isCheckIn = (date: Date, dayEvents: CalendarEvent[]) => {
    return dayEvents.some(e => {
      const start = new Date(e.startDate)
      start.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return start.getTime() === checkDate.getTime() && e.type === 'booking'
    })
  }

  const isCheckOut = (date: Date, dayEvents: CalendarEvent[]) => {
    return dayEvents.some(e => {
      const end = new Date(e.endDate)
      end.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return end.getTime() === checkDate.getTime() && e.type === 'booking'
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const renderDays = () => {
    const days = []

    // Empty cells for days before the month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2 bg-slate-50"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const dateColor = getDateColor(date, dayEvents)
      const checkIn = isCheckIn(date, dayEvents)
      const checkOut = isCheckOut(date, dayEvents)
      const today = isToday(date)
      const selected = isSelected(date)

      // Get unique rooms occupied for this day (with property name)
      const occupiedRooms = dayEvents
        .filter(e => e.type === 'booking' && e.status !== 'cancelled' && e.roomName)
        .map(e => `${e.roomName}${e.propertyName ? ` (${e.propertyName})` : ''}`)
        .filter((value, index, self) => self.indexOf(value) === index)

      days.push(
        <div
          key={day}
          onClick={() => onDateClick?.(date)}
          className={`min-h-[100px] p-2 border border-slate-200 ${dateColor} cursor-pointer transition-colors relative ${
            today ? 'ring-2 ring-blue-500' : ''
          } ${selected ? 'ring-2 ring-purple-500' : ''}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${today ? 'text-blue-600' : 'text-slate-900'}`}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                  {dayEvents.length}
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
              {checkIn && (
                <div className="text-[10px] bg-green-500 text-white px-1 rounded truncate text-center">
                  Check-in
                </div>
              )}
              {checkOut && (
                <div className="text-[10px] bg-orange-500 text-white px-1 rounded truncate text-center">
                  Check-out
                </div>
              )}
              {/* Show occupied rooms */}
              {occupiedRooms.slice(0, 3).map((roomName, idx) => (
                <div
                  key={idx}
                  className="text-[10px] bg-blue-600 text-white px-1 rounded truncate"
                  title={roomName}
                >
                  {roomName}
                </div>
              ))}
              {occupiedRooms.length > 3 && (
                <div className="text-[10px] text-slate-500">
                  +{occupiedRooms.length - 3} altre
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={previousMonth}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md flex items-center space-x-2"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Precedente</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md flex items-center space-x-2"
        >
          <span className="font-medium">Successivo</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border border-slate-300 rounded mr-2"></div>
          <span className="text-slate-600">Libero</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
          <span className="text-slate-600">Prenotato</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
          <span className="text-slate-600">Bloccato</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
          <span className="text-slate-600">Misto</span>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-slate-600 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 border-t border-l border-slate-200">
        {renderDays()}
      </div>
    </div>
  )
}
