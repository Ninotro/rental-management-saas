'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Home,
  MapPin,
  Users,
  Bed,
  Bath,
  Plus,
  ArrowRight,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Sparkles,
  Building2,
  TrendingUp,
  X,
} from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

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

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && p.active) ||
      (filterActive === 'inactive' && !p.active)
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: properties.length,
    active: properties.filter(p => p.active).length,
    totalBookings: properties.reduce((sum, p) => sum + p._count.bookings, 0),
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#d4cdb0] rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Building2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-[#3d4a3c]/70 font-medium animate-pulse">Caricamento strutture...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4cdb0]/10 rounded-full -translate-y-40 translate-x-40 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#d4cdb0]/5 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="text-[#d4cdb0]" size={20} />
                <span className="text-[#d4cdb0] text-sm font-medium">Gestione Proprietà</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Le Tue Strutture</h1>
              <p className="text-white/70 text-lg">
                Gestisci appartamenti, camere e proprietà
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Home size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-white/70">Totale</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-400/30 rounded-xl">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-white/70">Attive</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/30 rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-xs text-white/70">Prenotazioni</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#3d4a3c]/40" size={20} />
          <input
            type="text"
            placeholder="Cerca struttura o città..."
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-[#3d4a3c]/10 rounded-2xl text-[#3d4a3c] placeholder:text-[#3d4a3c]/40 focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent shadow-sm transition-all duration-300 hover:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-[#3d4a3c]/10 shadow-sm">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filterActive === status
                    ? 'bg-[#3d4a3c] text-white shadow-lg'
                    : 'text-[#3d4a3c]/70 hover:text-[#3d4a3c]'
                }`}
              >
                {status === 'all' ? 'Tutte' : status === 'active' ? 'Attive' : 'Inattive'}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-[#3d4a3c]/10 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-[#3d4a3c] text-white'
                  : 'text-[#3d4a3c]/60 hover:text-[#3d4a3c]'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-[#3d4a3c] text-white'
                  : 'text-[#3d4a3c]/60 hover:text-[#3d4a3c]'
              }`}
            >
              <List size={18} />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#3d4a3c] text-white px-5 py-3 rounded-2xl font-medium shadow-lg shadow-[#3d4a3c]/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>Nuova Struttura</span>
          </button>
        </div>
      </div>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-16 text-center">
          <div className="w-24 h-24 bg-[#3d4a3c]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="text-[#3d4a3c]/40" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-[#3d4a3c] mb-2">
            {searchTerm ? 'Nessun risultato' : 'Nessuna struttura'}
          </h3>
          <p className="text-[#3d4a3c]/60 mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Prova a modificare i filtri di ricerca'
              : 'Inizia aggiungendo la tua prima proprietà per gestire le prenotazioni'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={18} />
              <span>Aggiungi Struttura</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property, index) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/50 hover:-translate-y-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <div className="h-52 relative overflow-hidden">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0].url}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home size={64} className="text-white/20" />
                    </div>
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg ${
                      property.active
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}
                  >
                    {property.active ? 'Attiva' : 'Inattiva'}
                  </span>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <ArrowRight className="text-[#3d4a3c]" size={18} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#3d4a3c] mb-2 group-hover:text-[#4a5a49] transition-colors">
                  {property.name}
                </h3>
                <div className="flex items-center text-[#3d4a3c]/60 text-sm mb-4">
                  <MapPin size={14} className="mr-1.5" />
                  <span>{property.city}, {property.country}</span>
                </div>

                <p className="text-[#3d4a3c]/60 text-sm mb-5 line-clamp-2">
                  {property.description || 'Nessuna descrizione disponibile'}
                </p>

                {/* Features */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70 bg-[#3d4a3c]/5 px-3 py-1.5 rounded-xl">
                    <Users size={14} />
                    <span>{property.maxGuests}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70 bg-[#3d4a3c]/5 px-3 py-1.5 rounded-xl">
                    <Bed size={14} />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70 bg-[#3d4a3c]/5 px-3 py-1.5 rounded-xl">
                    <Bath size={14} />
                    <span>{property.bathrooms}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-r from-[#d4cdb0]/20 to-[#d4cdb0]/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#3d4a3c]/70 font-medium">Prenotazioni totali</span>
                    <span className="text-2xl font-bold text-[#3d4a3c]">
                      {property._count.bookings}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property, index) => (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="group flex flex-col md:flex-row gap-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/50 hover:-translate-y-1 p-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <div className="w-full md:w-48 h-40 md:h-32 relative overflow-hidden rounded-2xl flex-shrink-0">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0].url}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49] flex items-center justify-center">
                    <Home size={32} className="text-white/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-[#3d4a3c] group-hover:text-[#4a5a49] transition-colors">
                        {property.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          property.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {property.active ? 'Attiva' : 'Inattiva'}
                      </span>
                    </div>
                    <div className="flex items-center text-[#3d4a3c]/60 text-sm mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span>{property.city}, {property.country}</span>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-2xl font-bold text-[#3d4a3c]">{property._count.bookings}</p>
                    <p className="text-xs text-[#3d4a3c]/60">prenotazioni</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70">
                    <Users size={14} />
                    <span>{property.maxGuests} ospiti</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70">
                    <Bed size={14} />
                    <span>{property.bedrooms} camere</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-[#3d4a3c]/70">
                    <Bath size={14} />
                    <span>{property.bathrooms} bagni</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#3d4a3c]/5 group-hover:bg-[#3d4a3c] rounded-full flex items-center justify-center transition-all duration-300">
                  <ArrowRight className="text-[#3d4a3c]/40 group-hover:text-white transition-colors" size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Result Count */}
      {filteredProperties.length > 0 && (
        <div className="text-center text-sm text-[#3d4a3c]/60">
          Visualizzate <span className="font-semibold text-[#3d4a3c]">{filteredProperties.length}</span> di <span className="font-semibold text-[#3d4a3c]">{properties.length}</span> strutture
        </div>
      )}

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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Home size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Nuova Struttura</h2>
                <p className="text-white/70 text-sm">Aggiungi una nuova proprietà</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm font-medium border border-rose-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Nome Struttura *
              </label>
              <input
                type="text"
                required
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es. Villa Bella Vista"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                required
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Es. Via Roma 123"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Città *
              </label>
              <input
                type="text"
                required
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Es. Roma"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Paese *
              </label>
              <input
                type="text"
                required
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Descrizione
              </label>
              <textarea
                rows={3}
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrivi la tua struttura..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Ospiti Max *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.maxGuests}
                onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Camere *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#3d4a3c] mb-2">
                Bagni *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-[#3d4a3c]/20 rounded-xl px-4 py-3 text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/20 focus:border-transparent transition-all"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#3d4a3c]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-[#3d4a3c]/20 rounded-xl text-[#3d4a3c] hover:bg-[#3d4a3c]/5 font-medium transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creazione...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Crea Struttura</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
