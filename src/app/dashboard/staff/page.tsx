'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Home,
  X,
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
}

interface StaffAssignment {
  id: string
  date: string
  taskType: string
  status: string
  notes: string | null
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

interface Property {
  id: string
  name: string
  hasRooms: boolean
}

interface Room {
  id: string
  name: string
  type: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [assignments, setAssignments] = useState<StaffAssignment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [staffRes, assignmentsRes] = await Promise.all([
        fetch('/api/users?role=STAFF'),
        fetch('/api/staff-assignments'),
      ])

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(staffData)
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completato'
      case 'IN_PROGRESS':
        return 'In Corso'
      case 'PENDING':
        return 'In Attesa'
      case 'CANCELLED':
        return 'Annullato'
      default:
        return status
    }
  }

  // Stats
  const stats = {
    totalStaff: staff.length,
    pendingTasks: assignments.filter(a => a.status === 'PENDING').length,
    inProgressTasks: assignments.filter(a => a.status === 'IN_PROGRESS').length,
    completedToday: assignments.filter(a => {
      const today = new Date()
      const assignDate = new Date(a.date)
      return a.status === 'COMPLETED' &&
        assignDate.getDate() === today.getDate() &&
        assignDate.getMonth() === today.getMonth() &&
        assignDate.getFullYear() === today.getFullYear()
    }).length,
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento dipendenti...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dipendenti</h1>
            <p className="text-[#d4cdb0] text-lg">Gestisci il tuo team e assegna i task</p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white px-5 py-3 rounded-2xl font-medium border border-white/20 transition-all duration-200"
          >
            <Plus size={20} />
            <span>Assegna Task</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#d4cdb0]/30 rounded-xl">
              <Users size={24} className="text-[#3d4a3c]" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Totale Dipendenti</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalStaff}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Task In Attesa</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <AlertCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">In Corso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completati Oggi</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-[#d4cdb0]/30 rounded-lg">
                <Users size={16} className="text-[#3d4a3c]" />
              </div>
              Team
            </h2>
            <div className="space-y-3">
              {staff.map(member => (
                <div
                  key={member.id}
                  className="p-4 border border-slate-200 rounded-2xl hover:border-[#3d4a3c]/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] rounded-xl flex items-center justify-center text-white font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{member.name}</h3>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-1.5 inline-block">
                    {assignments.filter(a => a.user.name === member.name && a.status === 'PENDING').length} task in attesa
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="text-slate-400" size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Nessun dipendente trovato</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-[#d4cdb0]/30 rounded-lg">
                <Calendar size={16} className="text-[#3d4a3c]" />
              </div>
              Task Assegnati
            </h2>
            <div className="space-y-3">
              {assignments.slice(0, 10).map(assignment => (
                <div
                  key={assignment.id}
                  className="p-4 border border-slate-200 rounded-2xl hover:border-[#3d4a3c]/30 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {getTaskTypeLabel(assignment.taskType)}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {assignment.user.name}
                        {assignment.property && ` - ${assignment.property.name}`}
                        {assignment.room && ` - ${assignment.room.name}`}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      {getStatusLabel(assignment.status)}
                    </span>
                  </div>
                  {assignment.notes && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl px-3 py-2">{assignment.notes}</p>
                  )}
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(assignment.date).toLocaleDateString('it-IT')}
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="text-slate-400" size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Nessun task assegnato</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignTaskModal
          staff={staff}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            fetchData()
            setShowAssignModal(false)
          }}
        />
      )}
    </div>
  )
}

// Assign Task Modal Component
function AssignTaskModal({
  staff,
  onClose,
  onSuccess,
}: {
  staff: StaffMember[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    userId: '',
    propertyId: '',
    roomId: '',
    date: new Date().toISOString().split('T')[0],
    taskType: 'CLEANING',
    notes: '',
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (formData.propertyId) {
      fetchRooms(formData.propertyId)
    }
  }, [formData.propertyId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.userId || !formData.date || !formData.taskType) {
        setError('Compila tutti i campi obbligatori')
        setLoading(false)
        return
      }

      const response = await fetch('/api/staff-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null,
          roomId: formData.roomId || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'assegnazione del task')
      }
    } catch (err) {
      setError('Errore nell\'assegnazione del task')
    } finally {
      setLoading(false)
    }
  }

  const selectedProperty = properties.find(p => p.id === formData.propertyId)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Plus size={20} />
              </div>
              <h2 className="text-xl font-bold">Assegna Task</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dipendente e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dipendente *
              </label>
              <select
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              >
                <option value="">Seleziona dipendente</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo di Task *
            </label>
            <select
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
            >
              <option value="CLEANING">Pulizia</option>
              <option value="MAINTENANCE">Manutenzione</option>
              <option value="CHECK_IN">Check-in</option>
              <option value="CHECK_OUT">Check-out</option>
              <option value="LAUNDRY">Lavanderia</option>
              <option value="INSPECTION">Ispezione</option>
              <option value="OTHER">Altro</option>
            </select>
          </div>

          {/* Struttura e Stanza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Struttura (Opzionale)
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
              >
                <option value="">Nessuna struttura</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.propertyId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stanza (Opzionale)
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                >
                  <option value="">Nessuna stanza specifica</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note e Dettagli
            </label>
            <textarea
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Descrivi cosa deve fare il dipendente..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg shadow-[#3d4a3c]/25"
            >
              {loading ? 'Assegnazione...' : 'Assegna Task'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
