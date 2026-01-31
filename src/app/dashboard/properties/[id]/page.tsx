'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  MapPin,
  Users,
  Bed,
  Bath,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Square,
  Upload,
  X,
  Utensils,
  AlertCircle,
  Key,
  ExternalLink,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import ImageLightbox from '@/components/ImageLightbox'
import ICalConfigModal from '@/components/ICalConfigModal'

interface Room {
  id: string
  name: string
  roomNumber: string | null
  type: string
  description: string | null
  maxGuests: number
  beds: number
  size: number | null
  hasPrivateBathroom: boolean
  hasBalcony: boolean
  hasKitchen: boolean
  floor: number | null
  basePrice: number
  active: boolean
  _count: {
    bookings: number
  }
  images?: PropertyImage[]
}

interface PropertyImage {
  id: string
  url: string
  isPrimary: boolean
}
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
  hasRooms: boolean
  active: boolean
  _count: {
    bookings: number
  }
  images?: PropertyImage[]
  accessCodes?: Record<string, string> | null
}
export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<{ type: 'property' | 'room', id: string } | null>(null)
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)
  const [lightboxImages, setLightboxImages] = useState<PropertyImage[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxType, setLightboxType] = useState<'property' | 'room'>('property')
  const [showAccessCodesModal, setShowAccessCodesModal] = useState(false)
  const [showICalConfigModal, setShowICalConfigModal] = useState(false)
  const [iCalConfigRoom, setICalConfigRoom] = useState<{ id: string, name: string } | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean, message: string } | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchProperty()
      fetchRooms()
    }
  }, [params.id])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data)
        fetchPropertyImages()
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPropertyImages = async () => {
    try {
      const response = await fetch(`/api/properties/${params.id}/images`)
      if (response.ok) {
        const images = await response.json()
        setProperty(prev => prev ? { ...prev, images } : null)
      }
    } catch (error) {
      console.error('Error fetching property images:', error)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/properties/${params.id}/rooms`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room)
    setShowEditRoomModal(true)
  }

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRooms()
        fetchProperty()
        setShowDeleteConfirm(false)
        setSelectedRoom(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione della stanza')
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Errore nell\'eliminazione della stanza')
    }
  }

  const handleUploadImage = (type: 'property' | 'room', id: string) => {
    setUploadTarget({ type, id })
    setShowUploadModal(true)
  }

  const handleSetPrimaryImage = async (type: 'property' | 'room', imageId: string) => {
    try {
      const endpoint = type === 'property'
        ? `/api/properties/${property?.id}/images/${imageId}/primary`
        : `/api/rooms/${uploadTarget?.id}/images/${imageId}/primary`

      const response = await fetch(endpoint, {
        method: 'PATCH',
      })

      if (response.ok) {
        if (type === 'property') {
          fetchPropertyImages()
        } else {
          fetchRooms()
        }
      } else {
        alert('Errore nell\'impostazione immagine principale')
      }
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('Errore nell\'impostazione immagine principale')
    }
  }

  const handleDeleteImage = async (type: 'property' | 'room', imageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return

    try {
      const endpoint = type === 'property'
        ? `/api/properties/${property?.id}/images?imageId=${imageId}`
        : `/api/rooms/${uploadTarget?.id}/images?imageId=${imageId}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (type === 'property') {
          fetchPropertyImages()
        } else {
          fetchRooms()
        }
        // Close lightbox if open and update images
        setLightboxImages(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore nell\'eliminazione immagine')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Errore nell\'eliminazione immagine')
    }
  }

  const handleOpenLightbox = (images: PropertyImage[], index: number, type: 'property' | 'room') => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxType(type)
  }

  const handleSyncAllCalendars = async () => {
    setSyncingAll(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/sync-all-ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId: params.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: `Sincronizzazione completata: ${data.imported || 0} nuove prenotazioni, ${data.updated || 0} aggiornate`,
        })
        fetchRooms()
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
      setSyncingAll(false)
      // Clear message after 5 seconds
      setTimeout(() => setSyncResult(null), 5000)
    }
  }

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SINGLE: 'Singola',
      DOUBLE: 'Doppia',
      TWIN: 'Twin',
      TRIPLE: 'Tripla',
      QUAD: 'Quadrupla',
      SUITE: 'Suite',
      STUDIO: 'Monolocale',
      APARTMENT: 'Appartamento',
      DORMITORY: 'Dormitorio',
    }
    return labels[type] || type
  }

  const primaryImage = property?.images?.find(img => img.isPrimary)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!property) {
    return <div>Proprietà non trovata</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Torna alle strutture
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              {property.name}
            </h1>
            <div className="flex items-center text-slate-600">
              <MapPin size={18} className="mr-2" />
              <span>{property.address}, {property.city}, {property.country}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAccessCodesModal(true)}
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Key size={18} />
              <span>Gestisci Codici Accesso</span>
            </button>
            <button
              onClick={() => setShowEditPropertyModal(true)}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Edit size={18} />
              <span>Modifica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Property Images Gallery */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Immagini Struttura</h2>
          <button
            onClick={() => handleUploadImage('property', property.id)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all"
          >
            <Upload size={18} />
            <span>Carica Immagine</span>
          </button>
        </div>

        {property.images && property.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {property.images.map((image, index) => (
              <div key={image.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={image.url}
                  alt={property.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleOpenLightbox(property.images!, index, 'property')}
                />
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10">
                    Principale
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {!image.isPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetPrimaryImage('property', image.id)
                      }}
                      className="bg-white text-slate-900 px-3 py-1 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      Imposta principale
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteImage('property', image.id)
                    }}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-3">
              <Home size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">Nessuna immagine caricata</p>
            <button
              onClick={() => handleUploadImage('property', property.id)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Upload size={18} />
              <span>Carica Prima Immagine</span>
            </button>
          </div>
        )}
      </div>

      {/* Property Info Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Ospiti Max</p>
              <p className="text-xl font-bold text-slate-900">{property.maxGuests}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Bed className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Camere</p>
              <p className="text-xl font-bold text-slate-900">{property.bedrooms}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Bath className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Bagni</p>
              <p className="text-xl font-bold text-slate-900">{property.bathrooms}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Home className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-600">Prenotazioni</p>
              <p className="text-xl font-bold text-slate-900">{property._count.bookings}</p>
            </div>
          </div>
        </div>

        {property.description && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Descrizione</h3>
            <p className="text-slate-600">{property.description}</p>
          </div>
        )}
      </div>

      {/* Rooms Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Stanze</h2>
            <p className="text-slate-600">Gestisci le stanze di questa struttura</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSyncAllCalendars}
              disabled={syncingAll}
              className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
              title="Sincronizza tutti i calendari iCal di questa proprietà"
            >
              <RefreshCw size={18} className={syncingAll ? 'animate-spin' : ''} />
              <span>{syncingAll ? 'Sincronizzazione...' : 'Sincronizza Calendari'}</span>
            </button>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all"
            >
              <Plus size={18} />
              <span>Aggiungi Stanza</span>
            </button>
          </div>
        </div>

        {/* Sync Result Message */}
        {syncResult && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            syncResult.success
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {syncResult.success ? (
              <RefreshCw size={18} className="mr-2" />
            ) : (
              <AlertCircle size={18} className="mr-2" />
            )}
            {syncResult.message}
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const roomPrimaryImage = room.images?.find(img => img.isPrimary)
            return (
              <div
                key={room.id}
                className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* Room Image */}
                <div className="relative h-40 bg-gradient-to-br from-purple-400 to-pink-400 group">
                  {roomPrimaryImage ? (
                    <Image
                      src={roomPrimaryImage.url}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bed size={40} className="text-white/30" />
                    </div>
                  )}
                  <button
                    onClick={() => handleUploadImage('room', room.id)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Upload size={16} />
                  </button>
                </div>

                {/* Room Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{room.name}</h3>
                      <span className="text-sm text-slate-600">
                        {getRoomTypeLabel(room.type)}
                        {room.roomNumber && ` - #${room.roomNumber}`}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${room.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {room.active ? 'Attiva' : 'Disattivata'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center">
                        <Users size={14} className="mr-1" />
                        Ospiti
                      </span>
                      <span className="font-semibold text-slate-900">{room.maxGuests}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center">
                        <Bed size={14} className="mr-1" />
                        Letti
                      </span>
                      <span className="font-semibold text-slate-900">{room.beds}</span>
                    </div>
                    {room.size && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center">
                          <Square size={14} className="mr-1" />
                          Dimensione
                        </span>
                        <span className="font-semibold text-slate-900">{room.size} m²</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center">
                        <DollarSign size={14} className="mr-1" />
                        Prezzo base
                      </span>
                      <span className="font-semibold text-slate-900">
                        €{Number(room.basePrice).toFixed(0)}/notte
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.hasPrivateBathroom && (
                      <span className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                        <Bath size={12} className="mr-1" />
                        Bagno privato
                      </span>
                    )}
                    {room.hasBalcony && (
                      <span className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                        <Home size={12} className="mr-1" />
                        Balcone
                      </span>
                    )}
                    {room.hasKitchen && (
                      <span className="flex items-center text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                        <Utensils size={12} className="mr-1" />
                        Cucina
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Edit size={14} />
                      <span>Modifica</span>
                    </button>
                    <button
                      onClick={() => {
                        setICalConfigRoom({ id: room.id, name: room.name })
                        setShowICalConfigModal(true)
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 text-sm bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg font-medium transition-colors"
                      title="Sincronizzazione calendari Airbnb/Booking.com"
                    >
                      <Calendar size={14} />
                      <span>Calendari</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoom(room)
                        setShowDeleteConfirm(true)
                      }}
                      className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Images Gallery Toggle */}
                  <button
                    onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-slate-100 transition-colors"
                  >
                    {expandedRoomId === room.id ? 'Nascondi immagini' : `Visualizza immagini (${room.images?.length || 0})`}
                  </button>

                  {/* Expanded Images Gallery */}
                  {expandedRoomId === room.id && (
                    <div className="pt-3 border-t border-slate-100 mt-2">
                      {room.images && room.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {room.images.map((image, index) => (
                            <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                              <img
                                src={image.url}
                                alt={room.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleOpenLightbox(room.images!, index, 'room')}
                              />
                              {image.isPrimary && (
                                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded z-10">
                                  Principale
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                                {!image.isPrimary && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSetPrimaryImage('room', image.id)
                                    }}
                                    className="bg-white text-slate-900 px-2 py-1 rounded text-xs font-medium hover:bg-slate-100 transition-colors"
                                  >
                                    Imposta
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteImage('room', image.id)
                                  }}
                                  className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-slate-600 mb-2">Nessuna immagine</p>
                          <button
                            onClick={() => handleUploadImage('room', room.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Carica immagine
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty State */}
          {rooms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Bed size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nessuna stanza
              </h3>
              <p className="text-slate-600 mb-4">
                Inizia aggiungendo la prima stanza di questa struttura
              </p>
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>Aggiungi Prima Stanza</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddRoomModal && (
        <RoomFormModal
          propertyId={property.id}
          onClose={() => setShowAddRoomModal(false)}
          onSuccess={() => {
            fetchRooms()
            fetchProperty()
          }}
        />
      )}

      {showEditRoomModal && selectedRoom && (
        <RoomFormModal
          propertyId={property.id}
          room={selectedRoom}
          onClose={() => {
            setShowEditRoomModal(false)
            setSelectedRoom(null)
          }}
          onSuccess={() => {
            fetchRooms()
            fetchProperty()
          }}
        />
      )}

      {showDeleteConfirm && selectedRoom && (
        <DeleteConfirmModal
          roomName={selectedRoom.name}
          onConfirm={handleDeleteRoom}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setSelectedRoom(null)
          }}
        />
      )}

      {showUploadModal && uploadTarget && (
        <UploadImageModal
          target={uploadTarget}
          onClose={() => {
            setShowUploadModal(false)
            setUploadTarget(null)
          }}
          onSuccess={() => {
            if (uploadTarget.type === 'property') {
              fetchPropertyImages()
            } else {
              fetchRooms()
            }
          }}
        />
      )}

      {showEditPropertyModal && property && (
        <PropertyEditModal
          property={property}
          onClose={() => setShowEditPropertyModal(false)}
          onSuccess={() => {
            fetchProperty()
            setShowEditPropertyModal(false)
          }}
        />
      )}

      {/* Image Lightbox */}
      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
          onDelete={(imageId) => handleDeleteImage(lightboxType, imageId)}
          onSetPrimary={(imageId) => handleSetPrimaryImage(lightboxType, imageId)}
          showActions={true}
        />
      )}

      {showAccessCodesModal && property && (
        <AccessCodesModal
          property={property}
          onClose={() => setShowAccessCodesModal(false)}
          onSuccess={fetchProperty}
        />
      )}

      {/* iCal Configuration Modal */}
      {showICalConfigModal && iCalConfigRoom && (
        <ICalConfigModal
          isOpen={showICalConfigModal}
          onClose={() => {
            setShowICalConfigModal(false)
            setICalConfigRoom(null)
          }}
          roomId={iCalConfigRoom.id}
          roomName={iCalConfigRoom.name}
          onSyncComplete={fetchRooms}
        />
      )}
    </div>
  )
}

// Modal componenti separati per pulizia del codice
function AccessCodesModal({
  property,
  onClose,
  onSuccess,
}: {
  property: Property
  onClose: () => void
  onSuccess: () => void
}) {
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>(property.accessCodes || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCodes }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nel salvataggio dei codici')
      }
    } catch (err) {
      setError('Errore nel salvataggio dei codici')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Key className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Gestione Codici Accesso</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {Array.from({ length: 16 }, (_, i) => {
            const key = `gruppo-${i + 1}`
            return (
              <div key={key}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gruppo {i + 1}</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="0000"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg"
                  value={accessCodes[key] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setAccessCodes({ ...accessCodes, [key]: val })
                  }}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? 'Salvataggio...' : 'Salva Codici'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PropertyEditModal({
  property,
  onClose,
  onSuccess,
}: {
  property: Property
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    city: property.city,
    country: property.country,
    description: property.description || '',
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    active: property.active,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nell\'aggiornamento proprietà')
      }
    } catch (err) {
      setError('Errore nell\'aggiornamento proprietà')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Modifica Struttura</h2>
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

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 border-slate-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm font-medium text-slate-700">Struttura attiva</span>
              </label>
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
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoomFormModal({
  propertyId,
  room,
  onClose,
  onSuccess,
}: {
  propertyId: string
  room?: Room
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!room
  const [formData, setFormData] = useState({
    name: room?.name || '',
    roomNumber: room?.roomNumber || '',
    type: room?.type || 'DOUBLE',
    description: room?.description || '',
    maxGuests: room?.maxGuests || 2,
    beds: room?.beds || 1,
    size: room?.size?.toString() || '',
    hasPrivateBathroom: room?.hasPrivateBathroom || false,
    hasBalcony: room?.hasBalcony || false,
    hasKitchen: room?.hasKitchen || false,
    floor: room?.floor?.toString() || '',
    basePrice: room?.basePrice || 50,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEdit
        ? `/api/rooms/${room.id}`
        : `/api/properties/${propertyId}/rooms`

      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
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
        setError(data.error || `Errore ${isEdit ? 'nell\'aggiornamento' : 'nella creazione'} stanza`)
      }
    } catch (err) {
      setError(`Errore ${isEdit ? 'nell\'aggiornamento' : 'nella creazione'} stanza`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">
          {isEdit ? 'Modifica Stanza' : 'Aggiungi Nuova Stanza'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Stanza *
              </label>
              <input
                type="text"
                required
                placeholder="Es: Camera 101, Stanza Blu"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Numero Stanza
              </label>
              <input
                type="text"
                placeholder="Es: 101, A1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo Stanza *
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="SINGLE">Singola</option>
                <option value="DOUBLE">Doppia</option>
                <option value="TWIN">Twin</option>
                <option value="TRIPLE">Tripla</option>
                <option value="QUAD">Quadrupla</option>
                <option value="SUITE">Suite</option>
                <option value="STUDIO">Monolocale</option>
                <option value="APARTMENT">Appartamento</option>
                <option value="DORMITORY">Dormitorio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prezzo Base (€/notte) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
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
                Numero Letti *
              </label>
              <input
                type="number"
                required
                min="1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dimensione (m²)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Es: 20"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Piano
              </label>
              <input
                type="number"
                placeholder="Es: 1, 2, 3"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrizione
              </label>
              <textarea
                rows={3}
                placeholder="Descrivi la stanza..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Caratteristiche
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPrivateBathroom}
                    onChange={(e) =>
                      setFormData({ ...formData, hasPrivateBathroom: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Bagno privato</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBalcony}
                    onChange={(e) =>
                      setFormData({ ...formData, hasBalcony: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Balcone</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasKitchen}
                    onChange={(e) =>
                      setFormData({ ...formData, hasKitchen: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Cucina</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {loading ? (isEdit ? 'Aggiornamento...' : 'Creazione...') : (isEdit ? 'Aggiorna Stanza' : 'Crea Stanza')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  roomName,
  onConfirm,
  onCancel,
}: {
  roomName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Elimina Stanza</h2>
        </div>
        <p className="text-slate-600 mb-6">
          Sei sicuro di voler eliminare la stanza <strong>{roomName}</strong>?
          Questa azione non può essere annullata.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}

function UploadImageModal({
  target,
  onClose,
  onSuccess,
}: {
  target: { type: 'property' | 'room', id: string }
  onClose: () => void
  onSuccess: () => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviews(newPreviews)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setLoading(true)
    setError('')
    setUploadedCount(0)

    try {
      const url = target.type === 'property'
        ? `/api/properties/${target.id}/images`
        : `/api/rooms/${target.id}/images`

      // Upload images sequentially
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('isPrimary', i === 0 ? 'true' : 'false')
        formData.append('order', i.toString())

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Errore durante l\'upload')
        }

        setUploadedCount(i + 1)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Carica Immagini</h2>
            <p className="text-sm text-slate-600">Puoi selezionare più immagini insieme</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {previews.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        Principale
                      </div>
                    )}
                    {!loading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Caricamento in corso...</span>
                    <span>{uploadedCount} / {files.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload size={48} className="text-slate-400 mb-2" />
              <span className="text-sm text-slate-600 mb-1">Clicca per selezionare immagini</span>
              <span className="text-xs text-slate-500">Puoi selezionare più file insieme</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <div className="flex space-x-3">
            {previews.length > 0 && !loading && (
              <label className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-center">
                Aggiungi Altre
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || [])
                    if (newFiles.length > 0) {
                      setFiles([...files, ...newFiles])
                      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
                      setPreviews([...previews, ...newPreviews])
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? `Caricamento ${uploadedCount}/${files.length}...` : `Carica ${files.length} ${files.length === 1 ? 'Immagine' : 'Immagini'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
