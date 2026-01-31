'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check-in in Attesa</h1>
          <p className="text-gray-600 mt-1">
            Gestisci i check-in inviati dagli ospiti e collegali alle prenotazioni
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Torna alla Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {pendingCheckIns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">✓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun check-in in attesa
          </h3>
          <p className="text-gray-600">
            Tutti i check-in sono stati gestiti.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ospite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Struttura / Stanza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inviato il
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingCheckIns.map((checkIn) => (
                <tr key={checkIn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {checkIn.firstName} {checkIn.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{checkIn.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {checkIn.selectedRoom ? (
                      <>
                        <div className="text-gray-900">
                          {checkIn.selectedRoom.property.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkIn.selectedRoom.name}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {formatDate(checkIn.selectedCheckIn)}
                    </div>
                    <div className="text-sm text-gray-500">
                      → {formatDate(checkIn.selectedCheckOut)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(checkIn.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openDetailModal(checkIn)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => openApproveModal(checkIn)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approva
                    </button>
                    <button
                      onClick={() => handleReject(checkIn)}
                      disabled={processing}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Rifiuta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Approva Check-in
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedCheckIn.firstName} {selectedCheckIn.lastName} - {' '}
                    {selectedCheckIn.selectedRoom?.property.name} / {selectedCheckIn.selectedRoom?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Seleziona la prenotazione da collegare
                </h3>
                <p className="text-sm text-gray-600">
                  Date richieste: {formatDate(selectedCheckIn.selectedCheckIn)} → {formatDate(selectedCheckIn.selectedCheckOut)}
                </p>
              </div>

              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  Nessuna prenotazione corrispondente trovata. Verifica che esista una prenotazione per questo ospite.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((booking) => (
                    <label
                      key={booking.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBookingId === booking.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="booking"
                          value={booking.id}
                          checked={selectedBookingId === booking.id}
                          onChange={() => setSelectedBookingId(booking.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {booking.guestName}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                booking.matchType === 'exact'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.matchType === 'name'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {booking.matchScore}% match
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {booking.property.name}
                            {booking.room && ` / ${booking.room.name}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {booking.matchReason}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!selectedBookingId || processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Approvazione...' : 'Approva e Collega'}
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
      className={`ml-2 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
        copiedField === fieldName
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {copiedField === fieldName ? '✓ Copiato' : 'Copia'}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dettagli Check-in</h2>
              <p className="text-gray-600 mt-1">
                {checkIn.firstName} {checkIn.lastName} - Inviato il {formatDate(checkIn.submittedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-400 hover:text-gray-600">✕</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Soggiorno Selezionato */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">🏨</span> Soggiorno Selezionato
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Struttura</p>
                  <p className="font-medium text-gray-900">
                    {checkIn.selectedRoom?.property.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Stanza</p>
                  <p className="font-medium text-gray-900">
                    {checkIn.selectedRoom?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Check-in</p>
                  <p className="font-medium text-gray-900">{formatDate(checkIn.selectedCheckIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 mb-1">Check-out</p>
                  <p className="font-medium text-gray-900">{formatDate(checkIn.selectedCheckOut)}</p>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center">
                <span className="mr-2">📧</span> Contatti
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-indigo-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.email || '-'}
                    {checkIn.email && <CopyButton text={checkIn.email} fieldName="email" />}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-600 mb-1">Telefono</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.phone || '-'}
                    {checkIn.phone && <CopyButton text={checkIn.phone} fieldName="phone" />}
                  </p>
                </div>
              </div>
            </div>

            {/* Dati Anagrafici */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👤</span> Dati Anagrafici
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Nome</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.firstName}
                    <CopyButton text={checkIn.firstName} fieldName="firstName" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Cognome</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.lastName}
                    <CopyButton text={checkIn.lastName} fieldName="lastName" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Data di Nascita</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {formatDate(checkIn.dateOfBirth)}
                    <CopyButton text={formatDate(checkIn.dateOfBirth)} fieldName="dateOfBirth" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Luogo di Nascita</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.birthCity} ({checkIn.birthProvince})
                    <CopyButton text={`${checkIn.birthCity} (${checkIn.birthProvince})`} fieldName="birthPlace" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Codice Fiscale</p>
                  <p className="font-medium text-gray-900 flex items-center font-mono">
                    {checkIn.fiscalCode}
                    <CopyButton text={checkIn.fiscalCode} fieldName="fiscalCode" />
                  </p>
                </div>
              </div>
            </div>

            {/* Residenza */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🏠</span> Indirizzo di Residenza
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Via</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.residenceStreet}
                    <CopyButton text={checkIn.residenceStreet} fieldName="street" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">CAP</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.residencePostalCode}
                    <CopyButton text={checkIn.residencePostalCode} fieldName="postalCode" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Città</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.residenceCity}
                    <CopyButton text={checkIn.residenceCity} fieldName="city" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Provincia</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {checkIn.residenceProvince}
                    <CopyButton text={checkIn.residenceProvince} fieldName="province" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Indirizzo Completo</p>
                  <p className="font-medium text-gray-900 flex items-center text-xs">
                    <CopyButton
                      text={`${checkIn.residenceStreet}, ${checkIn.residencePostalCode} ${checkIn.residenceCity} (${checkIn.residenceProvince})`}
                      fieldName="fullAddress"
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* Documento */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🪪</span> Documento di Identità
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Tipo</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {getDocumentTypeLabel(checkIn.documentType)}
                    <CopyButton text={getDocumentTypeLabel(checkIn.documentType)} fieldName="docType" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Numero</p>
                  <p className="font-medium text-gray-900 flex items-center font-mono">
                    {checkIn.documentNumber}
                    <CopyButton text={checkIn.documentNumber} fieldName="docNumber" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Data Rilascio</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {formatDate(checkIn.documentIssueDate)}
                    <CopyButton text={formatDate(checkIn.documentIssueDate)} fieldName="docIssue" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Scadenza</p>
                  <p className="font-medium text-gray-900 flex items-center">
                    {formatDate(checkIn.documentExpiryDate)}
                    <CopyButton text={formatDate(checkIn.documentExpiryDate)} fieldName="docExpiry" />
                  </p>
                </div>
              </div>

              {/* Immagini Documento */}
              {(checkIn.documentFrontUrl || checkIn.documentBackUrl) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Foto Documento</p>
                  <div className="grid grid-cols-2 gap-4">
                    {checkIn.documentFrontUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Fronte</p>
                        <a href={checkIn.documentFrontUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={checkIn.documentFrontUrl}
                            alt="Fronte documento"
                            className="w-full rounded-lg border border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                    {checkIn.documentBackUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Retro</p>
                        <a href={checkIn.documentBackUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={checkIn.documentBackUrl}
                            alt="Retro documento"
                            className="w-full rounded-lg border border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tassa di Soggiorno */}
            <div className={`rounded-xl p-4 ${checkIn.isExempt ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <h3 className={`font-semibold mb-3 flex items-center ${checkIn.isExempt ? 'text-green-900' : 'text-amber-900'}`}>
                <span className="mr-2">💰</span> Tassa di Soggiorno
              </h3>

              {checkIn.isExempt ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                      ✓ ESENTE
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Motivo:</span> {getExemptionLabel(checkIn.exemptionReason)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                      Soggetto alla tassa
                    </span>
                  </div>

                  {checkIn.touristTaxPaymentProof ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-green-700 mb-2">✓ Screenshot pagamento caricato</p>
                      <a href={checkIn.touristTaxPaymentProof} target="_blank" rel="noopener noreferrer">
                        <img
                          src={checkIn.touristTaxPaymentProof}
                          alt="Prova pagamento tassa"
                          className="max-w-xs rounded-lg border-2 border-green-300 hover:border-green-500 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">
                      ⚠ Nessuna prova di pagamento caricata
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Chiudi
            </button>
            <button
              onClick={onApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Approva Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
