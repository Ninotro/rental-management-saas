'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PendingCheckIn {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  fiscalCode: string
  birthDate: string
  birthPlace: string
  nationality: string
  documentType: string
  documentNumber: string
  documentExpiry: string
  documentFrontUrl: string | null
  documentBackUrl: string | null
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Dettagli Check-in
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Dati Personali</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Nome Completo</dt>
                      <dd className="text-gray-900">{selectedCheckIn.firstName} {selectedCheckIn.lastName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="text-gray-900">{selectedCheckIn.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Telefono</dt>
                      <dd className="text-gray-900">{selectedCheckIn.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Codice Fiscale</dt>
                      <dd className="text-gray-900">{selectedCheckIn.fiscalCode}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Data di Nascita</dt>
                      <dd className="text-gray-900">{formatDate(selectedCheckIn.birthDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Luogo di Nascita</dt>
                      <dd className="text-gray-900">{selectedCheckIn.birthPlace}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Nazionalità</dt>
                      <dd className="text-gray-900">{selectedCheckIn.nationality}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Documento</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Tipo Documento</dt>
                      <dd className="text-gray-900">{selectedCheckIn.documentType}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Numero</dt>
                      <dd className="text-gray-900">{selectedCheckIn.documentNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Scadenza</dt>
                      <dd className="text-gray-900">{formatDate(selectedCheckIn.documentExpiry)}</dd>
                    </div>
                  </dl>

                  {(selectedCheckIn.documentFrontUrl || selectedCheckIn.documentBackUrl) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Immagini Documento</h4>
                      <div className="flex gap-2">
                        {selectedCheckIn.documentFrontUrl && (
                          <a
                            href={selectedCheckIn.documentFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Fronte
                          </a>
                        )}
                        {selectedCheckIn.documentBackUrl && (
                          <a
                            href={selectedCheckIn.documentBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Retro
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Soggiorno Selezionato</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Struttura</dt>
                    <dd className="text-gray-900">
                      {selectedCheckIn.selectedRoom?.property.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Stanza</dt>
                    <dd className="text-gray-900">
                      {selectedCheckIn.selectedRoom?.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Check-in</dt>
                    <dd className="text-gray-900">{formatDate(selectedCheckIn.selectedCheckIn)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Check-out</dt>
                    <dd className="text-gray-900">{formatDate(selectedCheckIn.selectedCheckOut)}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Chiudi
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    openApproveModal(selectedCheckIn)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approva
                </button>
              </div>
            </div>
          </div>
        </div>
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
