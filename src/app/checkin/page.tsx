'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Property {
  id: string
  name: string
  city: string
  rooms: Room[]
}

interface Room {
  id: string
  name: string
  roomNumber: string | null
  type: string
  maxGuests: number
}

type Step = 'selection' | 'personal' | 'document' | 'confirm' | 'success'

export default function PublicCheckInPage() {
  const [step, setStep] = useState<Step>('selection')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ matched: boolean; message: string } | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    // Selection
    propertyId: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    // Personal
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    birthCity: '',
    birthProvince: '',
    fiscalCode: '',
    // Residence
    residenceStreet: '',
    residencePostalCode: '',
    residenceCity: '',
    residenceProvince: '',
    // Document
    documentType: 'CARTA_IDENTITA',
    documentNumber: '',
    documentIssueDate: '',
    documentExpiryDate: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    // Tax exemption
    isExempt: false,
    exemptionReason: '',
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/public/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedProperty = properties.find(p => p.id === formData.propertyId)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/public/checkin/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ matched: data.matched, message: data.message })
        setStep('success')
      } else {
        setError(data.error || 'Errore durante l\'invio')
      }
    } catch (err) {
      setError('Errore di connessione. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check-in Online</h1>
          <p className="text-gray-600 mt-2">Compila i tuoi dati per il check-in</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['selection', 'personal', 'document', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-blue-600 text-white' :
                  ['selection', 'personal', 'document', 'confirm'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                {i < 3 && <div className="w-12 h-1 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Step 1: Selection */}
          {step === 'selection' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Seleziona struttura e date</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Struttura *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.propertyId}
                  onChange={(e) => {
                    updateForm('propertyId', e.target.value)
                    updateForm('roomId', '')
                  }}
                >
                  <option value="">Seleziona struttura...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.city}</option>
                  ))}
                </select>
              </div>

              {selectedProperty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stanza *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.roomId}
                    onChange={(e) => updateForm('roomId', e.target.value)}
                  >
                    <option value="">Seleziona stanza...</option>
                    {selectedProperty.rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.roomNumber && `(#${r.roomNumber})`} - Max {r.maxGuests} ospiti
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Check-in *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.checkInDate}
                    onChange={(e) => updateForm('checkInDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Check-out *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.checkOutDate}
                    onChange={(e) => updateForm('checkOutDate', e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={() => setStep('personal')}
                disabled={!formData.roomId || !formData.checkInDate || !formData.checkOutDate}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Continua
              </button>
            </div>
          )}

          {/* Step 2: Personal Data */}
          {step === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Dati personali</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.firstName}
                    onChange={(e) => updateForm('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cognome *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.lastName}
                    onChange={(e) => updateForm('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data di nascita *</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Luogo di nascita *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.birthCity}
                    onChange={(e) => updateForm('birthCity', e.target.value)}
                    placeholder="Città"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 uppercase"
                    value={formData.birthProvince}
                    onChange={(e) => updateForm('birthProvince', e.target.value.toUpperCase())}
                    placeholder="ES: RM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Codice Fiscale *</label>
                <input
                  type="text"
                  maxLength={16}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 uppercase"
                  value={formData.fiscalCode}
                  onChange={(e) => updateForm('fiscalCode', e.target.value.toUpperCase())}
                />
              </div>

              <h3 className="text-lg font-medium text-gray-900 pt-4">Residenza</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Indirizzo *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.residenceStreet}
                  onChange={(e) => updateForm('residenceStreet', e.target.value)}
                  placeholder="Via e numero civico"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CAP *</label>
                  <input
                    type="text"
                    maxLength={5}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.residencePostalCode}
                    onChange={(e) => updateForm('residencePostalCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Città *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.residenceCity}
                    onChange={(e) => updateForm('residenceCity', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prov. *</label>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 uppercase"
                    value={formData.residenceProvince}
                    onChange={(e) => updateForm('residenceProvince', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('selection')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Indietro
                </button>
                <button
                  onClick={() => setStep('document')}
                  disabled={!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.fiscalCode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Continua
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Document */}
          {step === 'document' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Documento d'identità</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo documento *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.documentType}
                  onChange={(e) => updateForm('documentType', e.target.value)}
                >
                  <option value="CARTA_IDENTITA">Carta d'identità</option>
                  <option value="PASSAPORTO">Passaporto</option>
                  <option value="PATENTE">Patente di guida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero documento *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={formData.documentNumber}
                  onChange={(e) => updateForm('documentNumber', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data rilascio *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.documentIssueDate}
                    onChange={(e) => updateForm('documentIssueDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data scadenza *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    value={formData.documentExpiryDate}
                    onChange={(e) => updateForm('documentExpiryDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-blue-600"
                    checked={formData.isExempt}
                    onChange={(e) => updateForm('isExempt', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Esente da tassa di soggiorno</span>
                </label>
                {formData.isExempt && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo esenzione</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                      value={formData.exemptionReason}
                      onChange={(e) => updateForm('exemptionReason', e.target.value)}
                      placeholder="Es: Minore di 14 anni"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('personal')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Indietro
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!formData.documentNumber || !formData.documentIssueDate || !formData.documentExpiryDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Continua
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Conferma dati</h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>

                  <span className="text-gray-600">Data nascita:</span>
                  <span className="font-medium">{formData.dateOfBirth}</span>

                  <span className="text-gray-600">Codice Fiscale:</span>
                  <span className="font-medium">{formData.fiscalCode}</span>

                  <span className="text-gray-600">Documento:</span>
                  <span className="font-medium">{formData.documentType} - {formData.documentNumber}</span>

                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">{formData.checkInDate}</span>

                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">{formData.checkOutDate}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Confermando, i tuoi dati verranno inviati alla struttura per il check-in.
                I dati verranno trattati secondo la normativa sulla privacy.
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('document')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Indietro
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Invio in corso...
                    </>
                  ) : (
                    'Conferma Check-in'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && result && (
            <div className="text-center py-8">
              <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${result.matched ? 'text-green-500' : 'text-yellow-500'}`} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.matched ? 'Check-in completato!' : 'Dati ricevuti!'}
              </h2>
              <p className="text-gray-600">{result.message}</p>
              {!result.matched && (
                <p className="text-sm text-gray-500 mt-4">
                  Riceverai conferma dalla struttura a breve.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
