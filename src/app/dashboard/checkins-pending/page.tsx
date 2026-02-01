'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  X,
  Eye,
  AlertCircle,
  ArrowLeft,
  Copy,
  Mail,
  Phone,
  CreditCard,
  Home,
  FileText,
  Users,
} from 'lucide-react'

interface PendingCheckIn {
  id: string
  email: string | null
  phone: string | null
  firstName: string
  lastName: string
  fiscalCode: string
  dateOfBirth: string
  birthCity: string
  birthProvince: string
  residenceStreet: string
  residencePostalCode: string
  residenceCity: string
  residenceProvince: string
  documentType: string
  documentNumber: string
  documentIssueDate: string
  documentExpiryDate: string
  documentFrontUrl: string | null
  documentBackUrl: string | null
  isExempt: boolean
  exemptionReason: string | null
  touristTaxPaymentProof: string | null
  selectedCheckIn: string
  selectedCheckOut: string
  submittedAt: string
  selectedRoom: {
    id: string
    name: string
    property: {
      name: string
      city: string
    }
  } | null
}

interface BookingSuggestion {
  id: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  status: string
  property: { name: string }
  room: { name: string } | null
  matchType: 'exact' | 'name' | 'property'
  matchScore: number
  matchReason: string
}

interface SuggestionResponse {
  checkIn: {
    id: string
    firstName: string
    lastName: string
    selectedCheckIn: string
    selectedCheckOut: string
    selectedRoom: {
      name: string
      property: { name: string }
    } | null
  }
  suggestions: BookingSuggestion[]
}

export default function PendingCheckInsPage() {
  const router = useRouter()
  const [pendingCheckIns, setPendingCheckIns] = useState<PendingCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [selectedCheckIn, setSelectedCheckIn] = useState<PendingCheckIn | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingCheckIns()
  }, [])

  const fetchPendingCheckIns = async () => {
    try {
      const res = await fetch('/api/guest-checkins/pending')
      if (!res.ok) throw new Error('Errore nel caricamento')
      const data = await res.json()
      setPendingCheckIns(data)
    } catch (err) {
      setError('Errore nel caricamento dei check-in pending')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async (checkInId: string) => {
    setLoadingSuggestions(true)
    try {
      const res = await fetch(`/api/guest-checkins/${checkInId}/suggestions`)
      if (!res.ok) throw new Error('Errore nel caricamento suggerimenti')
      const data: SuggestionResponse = await res.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      console.error(err)
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const openDetailModal = (checkIn: PendingCheckIn) => {
    setSelectedCheckIn(checkIn)
    setShowDetailModal(true)
  }

  const openApproveModal = async (checkIn: PendingCheckIn) => {
    setSelectedCheckIn(checkIn)
    setSelectedBookingId(null)
    setShowApproveModal(true)
    await fetchSuggestions(checkIn.id)
  }

  const handleApprove = async () => {
    if (!selectedCheckIn || !selectedBookingId) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/guest-checkins/${selectedCheckIn.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBookingId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante l\'approvazione')
      }

      // Rimuovi dalla lista
      setPendingCheckIns(prev => prev.filter(c => c.id !== selectedCheckIn.id))
      setShowApproveModal(false)
      setSelectedCheckIn(null)
      setSelectedBookingId(null)
      window.dispatchEvent(new CustomEvent('checkInStatusUpdated'))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (checkIn: PendingCheckIn) => {
    if (!confirm(`Sei sicuro di voler rifiutare il check-in di ${checkIn.firstName} ${checkIn.lastName}?`)) {
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/guest-checkins/${checkIn.id}/reject`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante il rifiuto')
      }

      // Rimuovi dalla lista
      setPendingCheckIns(prev => prev.filter(c => c.id !== checkIn.id))
      window.dispatchEvent(new CustomEvent('checkInStatusUpdated'))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#d4cdb0] rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Clock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-[#3d4a3c]/70 font-medium animate-pulse">Caricamento check-in...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-white/80" size={20} />
                <span className="text-white/80 text-sm font-medium">Approvazioni</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Check-in in Attesa</h1>
              <p className="text-white/80 text-lg">
                Gestisci i check-in inviati dagli ospiti e collegali alle prenotazioni
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCheckIns.length}</p>
                    <p className="text-xs text-white/70">In Attesa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {pendingCheckIns.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-[#3d4a3c] mb-2">
            Nessun check-in in attesa
          </h3>
          <p className="text-[#3d4a3c]/60 mb-6">
            Tutti i check-in sono stati gestiti.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft size={18} />
            Torna alla Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingCheckIns.map((checkIn, index) => (
            <div
              key={checkIn.id}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Avatar & Main Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {checkIn.firstName.charAt(0)}{checkIn.lastName.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#3d4a3c] text-lg">
                          {checkIn.firstName} {checkIn.lastName}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          In Attesa
                        </span>
                      </div>
                      {checkIn.email && (
                        <p className="text-sm text-[#3d4a3c]/60 flex items-center gap-1 mt-1">
                          <Mail size={14} />
                          {checkIn.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  {checkIn.selectedRoom && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#3d4a3c]/5 rounded-2xl">
                      <Home size={18} className="text-[#3d4a3c]/60 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#3d4a3c] truncate">{checkIn.selectedRoom.property.name}</p>
                        <p className="text-xs text-[#3d4a3c]/60">{checkIn.selectedRoom.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Date Info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#d4cdb0]/20 rounded-2xl">
                    <Calendar size={18} className="text-[#3d4a3c] flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.selectedCheckIn)}</p>
                      <p className="text-xs text-[#3d4a3c]/60">→ {formatDate(checkIn.selectedCheckOut)}</p>
                    </div>
                  </div>

                  {/* Submitted At */}
                  <div className="hidden xl:block text-sm text-[#3d4a3c]/60">
                    <p className="font-medium">Inviato il</p>
                    <p>{formatDateTime(checkIn.submittedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDetailModal(checkIn)}
                      className="p-2.5 text-[#3d4a3c]/60 hover:text-[#3d4a3c] hover:bg-[#d4cdb0]/30 rounded-xl transition-all duration-200"
                      title="Visualizza dettagli"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => openApproveModal(checkIn)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200"
                    >
                      <CheckCircle2 size={18} />
                      <span className="hidden sm:inline">Approva</span>
                    </button>
                    <button
                      onClick={() => handleReject(checkIn)}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      <X size={18} />
                      <span className="hidden sm:inline">Rifiuta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dettagli */}
      {showDetailModal && selectedCheckIn && (
        <DetailModal
          checkIn={selectedCheckIn}
          onClose={() => setShowDetailModal(false)}
          onApprove={() => {
            setShowDetailModal(false)
            openApproveModal(selectedCheckIn)
          }}
          formatDate={formatDate}
        />
      )}

      {/* Modal Approvazione */}
      {showApproveModal && selectedCheckIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-5 text-white rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Approva Check-in</h2>
                    <p className="text-white/80 text-sm">
                      {selectedCheckIn.firstName} {selectedCheckIn.lastName} - {selectedCheckIn.selectedRoom?.property.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-[#3d4a3c] mb-2">
                  Seleziona la prenotazione da collegare
                </h3>
                <p className="text-sm text-[#3d4a3c]/60">
                  Date richieste: {formatDate(selectedCheckIn.selectedCheckIn)} → {formatDate(selectedCheckIn.selectedCheckOut)}
                </p>
              </div>

              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-[#d4cdb0] border-t-[#3d4a3c] rounded-full animate-spin"></div>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  Nessuna prenotazione corrispondente trovata. Verifica che esista una prenotazione per questo ospite.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((booking) => (
                    <label
                      key={booking.id}
                      className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                        selectedBookingId === booking.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-[#3d4a3c]/10 hover:border-[#3d4a3c]/20 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="booking"
                          value={booking.id}
                          checked={selectedBookingId === booking.id}
                          onChange={() => setSelectedBookingId(booking.id)}
                          className="mt-1 w-5 h-5 text-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#3d4a3c]">
                              {booking.guestName}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                booking.matchType === 'exact'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : booking.matchType === 'name'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {booking.matchScore}% match
                            </span>
                          </div>
                          <div className="text-sm text-[#3d4a3c]/70 mt-1">
                            {booking.property.name}
                            {booking.room && ` / ${booking.room.name}`}
                          </div>
                          <div className="text-sm text-[#3d4a3c]/60">
                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                          </div>
                          <div className="text-xs text-[#3d4a3c]/50 mt-1">
                            {booking.matchReason}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-[#3d4a3c]/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-5 py-2.5 border border-[#3d4a3c]/20 rounded-xl text-[#3d4a3c] hover:bg-[#3d4a3c]/5 font-medium transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!selectedBookingId || processing}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Approvazione...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Approva e Collega
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente Modal Dettagli Check-in Completo
function DetailModal({
  checkIn,
  onClose,
  onApprove,
  formatDate,
}: {
  checkIn: PendingCheckIn
  onClose: () => void
  onApprove: () => void
  formatDate: (date: string) => string
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text.toUpperCase())
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Errore nella copia:', err)
    }
  }

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, fieldName)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-xs font-medium ${
        copiedField === fieldName
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-white border-[#3d4a3c]/20 text-[#3d4a3c]/60 hover:bg-[#3d4a3c]/5'
      }`}
    >
      {copiedField === fieldName ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copiedField === fieldName ? 'Copiato!' : 'Copia'}
    </button>
  )

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CARTA_IDENTITA: "Carta d'Identità",
      PASSAPORTO: 'Passaporto',
      PATENTE: 'Patente',
    }
    return labels[type] || type
  }

  const getExemptionLabel = (reason: string | null) => {
    if (!reason) return '-'
    const labels: Record<string, string> = {
      MINORE_14: 'Minore di 14 anni',
      RESIDENTE: 'Residente nel Comune',
      ACCOMPAGNATORE_PAZIENTE: 'Accompagnatore paziente in cura',
      FORZE_ORDINE: "Forze dell'ordine in servizio",
      DISABILE: 'Persona con disabilità',
      AUTISTA_PULLMAN: 'Autista pullman turistico',
      ALTRO: 'Altro',
    }
    return labels[reason] || reason
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                {checkIn.firstName.charAt(0)}{checkIn.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{checkIn.firstName} {checkIn.lastName}</h2>
                <p className="text-[#d4cdb0]">Inviato il {formatDate(checkIn.submittedAt)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Soggiorno Selezionato */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <h3 className="font-semibold text-[#3d4a3c] mb-3 flex items-center gap-2">
                <Home size={18} className="text-blue-600" />
                Soggiorno Selezionato
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-1">Struttura</p>
                  <p className="font-medium text-[#3d4a3c]">
                    {checkIn.selectedRoom?.property.name || '-'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-1">Stanza</p>
                  <p className="font-medium text-[#3d4a3c]">
                    {checkIn.selectedRoom?.name || '-'}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-1">Check-in</p>
                  <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.selectedCheckIn)}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-1">Check-out</p>
                  <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.selectedCheckOut)}</p>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
              <h3 className="font-semibold text-[#3d4a3c] mb-4 flex items-center gap-2">
                <Mail size={18} className="text-violet-600" />
                Contatti
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div>
                    <p className="text-violet-600 text-xs mb-1">Email</p>
                    <p className="font-medium text-[#3d4a3c]">{checkIn.email || '-'}</p>
                  </div>
                  {checkIn.email && <CopyButton text={checkIn.email} fieldName="email" />}
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl p-3">
                  <div>
                    <p className="text-violet-600 text-xs mb-1">Telefono</p>
                    <p className="font-medium text-[#3d4a3c]">{checkIn.phone || '-'}</p>
                  </div>
                  {checkIn.phone && <CopyButton text={checkIn.phone} fieldName="phone" />}
                </div>
              </div>
            </div>

            {/* Dati Anagrafici */}
            <div className="bg-white rounded-2xl border border-[#3d4a3c]/10 overflow-hidden">
              <div className="bg-[#3d4a3c]/5 px-5 py-3 border-b border-[#3d4a3c]/10">
                <h3 className="font-semibold text-[#3d4a3c] flex items-center gap-2">
                  <User size={18} className="text-[#3d4a3c]" />
                  Dati Anagrafici
                </h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Nome</p>
                    <p className="font-medium text-[#3d4a3c]">{checkIn.firstName}</p>
                  </div>
                  <CopyButton text={checkIn.firstName} fieldName="firstName" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Cognome</p>
                    <p className="font-medium text-[#3d4a3c]">{checkIn.lastName}</p>
                  </div>
                  <CopyButton text={checkIn.lastName} fieldName="lastName" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Data di Nascita</p>
                    <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.dateOfBirth)}</p>
                  </div>
                  <CopyButton text={formatDate(checkIn.dateOfBirth)} fieldName="dateOfBirth" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Luogo di Nascita</p>
                    <p className="font-medium text-[#3d4a3c]">{checkIn.birthCity} ({checkIn.birthProvince})</p>
                  </div>
                  <CopyButton text={`${checkIn.birthCity} (${checkIn.birthProvince})`} fieldName="birthPlace" />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Codice Fiscale</p>
                    <p className="font-medium text-[#3d4a3c] font-mono">{checkIn.fiscalCode}</p>
                  </div>
                  <CopyButton text={checkIn.fiscalCode} fieldName="fiscalCode" />
                </div>
              </div>
            </div>

            {/* Documento */}
            <div className="bg-white rounded-2xl border border-[#3d4a3c]/10 overflow-hidden">
              <div className="bg-[#3d4a3c]/5 px-5 py-3 border-b border-[#3d4a3c]/10">
                <h3 className="font-semibold text-[#3d4a3c] flex items-center gap-2">
                  <CreditCard size={18} className="text-[#3d4a3c]" />
                  Documento di Identità
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#3d4a3c]/60 text-xs mb-1">Tipo</p>
                      <p className="font-medium text-[#3d4a3c]">{getDocumentTypeLabel(checkIn.documentType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#3d4a3c]/60 text-xs mb-1">Numero</p>
                      <p className="font-medium text-[#3d4a3c] font-mono">{checkIn.documentNumber}</p>
                    </div>
                    <CopyButton text={checkIn.documentNumber} fieldName="docNumber" />
                  </div>
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Data Rilascio</p>
                    <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.documentIssueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[#3d4a3c]/60 text-xs mb-1">Scadenza</p>
                    <p className="font-medium text-[#3d4a3c]">{formatDate(checkIn.documentExpiryDate)}</p>
                  </div>
                </div>

                {(checkIn.documentFrontUrl || checkIn.documentBackUrl) && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3d4a3c]/10">
                    {checkIn.documentFrontUrl && (
                      <div>
                        <p className="text-xs text-[#3d4a3c]/60 mb-2">Fronte</p>
                        <a href={checkIn.documentFrontUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={checkIn.documentFrontUrl}
                            alt="Fronte documento"
                            className="w-full rounded-xl border-2 border-[#3d4a3c]/10 hover:border-[#3d4a3c]/30 transition-colors cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                    {checkIn.documentBackUrl && (
                      <div>
                        <p className="text-xs text-[#3d4a3c]/60 mb-2">Retro</p>
                        <a href={checkIn.documentBackUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={checkIn.documentBackUrl}
                            alt="Retro documento"
                            className="w-full rounded-xl border-2 border-[#3d4a3c]/10 hover:border-[#3d4a3c]/30 transition-colors cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tassa di Soggiorno */}
            <div className={`rounded-2xl p-5 border ${checkIn.isExempt ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${checkIn.isExempt ? 'text-emerald-700' : 'text-amber-700'}`}>
                <FileText size={18} />
                Tassa di Soggiorno
              </h3>

              {checkIn.isExempt ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-700">ESENTE</p>
                    <p className="text-sm text-emerald-600">{getExemptionLabel(checkIn.exemptionReason)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-bold">
                      Soggetto alla tassa
                    </span>
                  </div>

                  {checkIn.touristTaxPaymentProof ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Screenshot pagamento caricato
                      </p>
                      <a href={checkIn.touristTaxPaymentProof} target="_blank" rel="noopener noreferrer">
                        <img
                          src={checkIn.touristTaxPaymentProof}
                          alt="Prova pagamento tassa"
                          className="max-w-xs rounded-xl border-2 border-emerald-300 hover:border-emerald-500 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Nessuna prova di pagamento caricata
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#3d4a3c]/5 px-6 py-4 border-t border-[#3d4a3c]/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-[#3d4a3c]/20 rounded-xl text-[#3d4a3c] hover:bg-white font-medium transition-colors"
          >
            Chiudi
          </button>
          <button
            onClick={onApprove}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Approva Check-in
          </button>
        </div>
      </div>
    </div>
  )
}
