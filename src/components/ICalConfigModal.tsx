'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Download, Upload, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react'

interface ICalConfigModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  roomName: string
  onSyncComplete?: () => void
}

export default function ICalConfigModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  onSyncComplete,
}: ICalConfigModalProps) {
  const [airbnbUrl, setAirbnbUrl] = useState('')
  const [bookingComUrl, setBookingComUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [exportUrlCopied, setExportUrlCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // URL per esportare le prenotazioni
  const exportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/rooms/${roomId}/ical-export`
    : ''

  useEffect(() => {
    if (isOpen) {
      fetchRoomData()
    }
  }, [isOpen, roomId])

  const fetchRoomData = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        setAirbnbUrl(data.airbnbIcalUrl || '')
        setBookingComUrl(data.bookingComIcalUrl || '')
        setLastSyncedAt(data.lastSyncedAt)
      }
    } catch (error) {
      console.error('Errore nel caricamento dati stanza:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airbnbIcalUrl: airbnbUrl || null,
          bookingComIcalUrl: bookingComUrl || null,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Link iCal salvati con successo!' })
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: 'Errore nel salvataggio' })
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setMessage({ type: 'error', text: 'Errore nel salvataggio' })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/rooms/${roomId}/ical-sync`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({
          type: 'success',
          text: `Sincronizzazione completata! ${data.totalImported} prenotazioni importate.`
        })
        setLastSyncedAt(new Date().toISOString())
        if (onSyncComplete) {
          onSyncComplete()
        }
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Errore nella sincronizzazione' })
      }
    } catch (error) {
      console.error('Errore nella sincronizzazione:', error)
      setMessage({ type: 'error', text: 'Errore nella sincronizzazione' })
    } finally {
      setSyncing(false)
    }
  }

  const copyExportUrl = () => {
    navigator.clipboard.writeText(exportUrl)
    setExportUrlCopied(true)
    setTimeout(() => setExportUrlCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Sincronizzazione Calendari - {roomName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Messaggio */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Sezione Import */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                1. Importa da Airbnb/Booking.com
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Inserisci i link iCal forniti da Airbnb e Booking.com per importare automaticamente le loro prenotazioni.
            </p>

            {/* Airbnb URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link iCal Airbnb
              </label>
              <input
                type="url"
                value={airbnbUrl}
                onChange={(e) => setAirbnbUrl(e.target.value)}
                placeholder="https://www.airbnb.com/calendar/ical/..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
              <a
                href="https://www.airbnb.com/help/article/99"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Come ottenere il link da Airbnb
              </a>
            </div>

            {/* Booking.com URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link iCal Booking.com
              </label>
              <input
                type="url"
                value={bookingComUrl}
                onChange={(e) => setBookingComUrl(e.target.value)}
                placeholder="https://admin.booking.com/hotel/hoteladmin/ical/..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
              <a
                href="https://partner.booking.com/en-gb/help/connectivity/how-do-i-synchronise-my-calendar-external-channels"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Come ottenere il link da Booking.com
              </a>
            </div>

            {/* Pulsanti Salva e Sincronizza */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Salvataggio...' : 'Salva Link'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing || (!airbnbUrl && !bookingComUrl)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
              </button>
            </div>

            {lastSyncedAt && (
              <p className="text-xs text-slate-500">
                Ultima sincronizzazione: {new Date(lastSyncedAt).toLocaleString('it-IT')}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Sezione Export */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                2. Esporta verso Airbnb/Booking.com
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Copia questo link e inseriscilo nelle impostazioni calendario di Airbnb e Booking.com per esportare le tue prenotazioni.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL Feed iCal
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exportUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm"
                />
                <button
                  onClick={copyExportUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {exportUrlCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copia
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Come usare questo link:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Copia il link sopra</li>
                <li>Vai nelle impostazioni calendario di Airbnb o Booking.com</li>
                <li>Trova la sezione "Importa calendario" o "Sincronizza calendario"</li>
                <li>Incolla il link copiato</li>
                <li>Le tue prenotazioni si sincronizzeranno automaticamente ogni 2-3 ore</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
