'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, MapPin, Users, Bed, Bath, Plus, Edit, Trash2, MoreVertical, ArrowRight } from 'lucide-react'

interface Property {
  id: string
  name: string
  address: string
  city: string
  country: string
  description: string | null
  maxGuests: number
  bedrooms: number
  bathrooms: number
  active: boolean
  _count: {
    bookings: number
  }
  images: Array<{
    id: string
    url: string
    isPrimary: boolean
  }>
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Strutture</h1>
          <p className="text-slate-600">Gestisci le tue proprietà e appartamenti</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          <span>Nuova Struttura</span>
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/dashboard/properties/${property.id}`}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
          >
            {/* Image */}
            <div className="h-48 relative overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0].url}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Home size={64} className="text-white/30" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    property.active
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {property.active ? 'Attiva' : 'Disattivata'}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {property.name}
              </h3>
              <div className="flex items-center text-slate-600 text-sm mb-4">
                <MapPin size={16} className="mr-1" />
                <span>{property.city}, {property.country}</span>
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                {property.description || 'Nessuna descrizione disponibile'}
              </p>

              {/* Features */}
              <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center">
                  <Users size={16} className="mr-1" />
                  <span>{property.maxGuests}</span>
                </div>
                <div className="flex items-center">
                  <Bed size={16} className="mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
                <div className="flex items-center">
                  <Bath size={16} className="mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Prenotazioni</span>
                  <span className="text-lg font-bold text-slate-900">
                    {property._count.bookings}
                  </span>
                </div>
              </div>

              {/* View Details */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-center text-blue-600 font-medium text-sm">
                  <span>Visualizza dettagli</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Empty State */}
        {properties.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Home size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nessuna struttura
            </h3>
            <p className="text-slate-600 mb-6">
              Inizia aggiungendo la tua prima proprietà
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={20} />
              <span>Aggiungi Struttura</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePropertyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchProperties}
        />
      )}
    </div>
  )
}

function CreatePropertyModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: 'Italia',
    description: '',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nella creazione proprietà')
      }
    } catch (err) {
      setError('Errore nella creazione proprietà')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Aggiungi Nuova Struttura</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Struttura *
              </label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Città *
              </label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paese *
              </label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrizione
              </label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ospiti Max *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.maxGuests}
                onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Camere *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bagni *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-all shadow-lg"
            >
              {loading ? 'Creazione...' : 'Crea Struttura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
