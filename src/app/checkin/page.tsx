'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, Upload, Plus, Trash2, ChevronRight, Home, Bed, DollarSign, CreditCard, Building2 } from 'lucide-react'
import { translations, Language } from '@/lib/translations'

interface Property {
  id: string
  name: string
  city: string
  touristTaxRate: number | null
  touristTaxMaxNights: number | null
  touristTaxExemptAge: number | null
  paypalEmail: string | null
  revolutTag: string | null
  bankAccountIBAN: string | null
  bankAccountHolder: string | null
  rooms: Room[]
}

interface Room {
  id: string
  name: string
  type: string
  maxGuests: number
}

interface GuestFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  birthCity: string
  birthProvince: string
  residenceStreet: string
  residencePostalCode: string
  residenceCity: string
  residenceProvince: string
  fiscalCode: string
  documentType: string
  documentNumber: string
  documentIssueDate: string
  documentExpiryDate: string
  documentFrontFile: File | null
  documentBackFile: File | null
  documentFrontUrl: string | null
  documentBackUrl: string | null
  uploadingFront: boolean
  uploadingBack: boolean
  isExempt: boolean
  exemptionReason: string
}

export default function PublicCheckInPage() {
  const [language, setLanguage] = useState<Language>('it')
  const t = translations[language]

  // Step management
  const [step, setStep] = useState<'selection' | 'form'>('selection')

  // Selection state
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [numGuests, setNumGuests] = useState(1)

  // Form state
  const [guests, setGuests] = useState<GuestFormData[]>([createEmptyGuest()])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Payment proof state
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function createEmptyGuest(): GuestFormData {
    return {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      birthCity: '',
      birthProvince: '',
      residenceStreet: '',
      residencePostalCode: '',
      residenceCity: '',
      residenceProvince: '',
      fiscalCode: '',
      documentType: 'CARTA_IDENTITA',
      documentNumber: '',
      documentIssueDate: '',
      documentExpiryDate: '',
      documentFrontFile: null,
      documentBackFile: null,
      documentFrontUrl: null,
      documentBackUrl: null,
      uploadingFront: false,
      uploadingBack: false,
      isExempt: false,
      exemptionReason: '',
    }
  }

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

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedRoom = selectedProperty?.rooms.find(r => r.id === selectedRoomId)

  const canProceedToForm = selectedPropertyId && selectedRoomId && checkInDate && checkOutDate && numGuests > 0

  const handleProceedToForm = () => {
    if (canProceedToForm) {
      const guestsArray = Array(numGuests).fill(null).map(() => createEmptyGuest())
      setGuests(guestsArray)
      setStep('form')
    }
  }

  const handlePaymentProofUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadingProof(true)
      const response = await fetch('/api/public/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentProofUrl(data.url)
        setPaymentProofFile(file)
      } else {
        setError(t.uploadError)
      }
    } catch (err) {
      setError(t.uploadError)
    } finally {
      setUploadingProof(false)
    }
  }

  const handleFileUpload = async (file: File, guestIndex: number, type: 'front' | 'back') => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const newGuests = [...guests]
      if (type === 'front') newGuests[guestIndex].uploadingFront = true
      else newGuests[guestIndex].uploadingBack = true
      setGuests(newGuests)

      const response = await fetch('/api/public/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const updatedGuests = [...guests]
        if (type === 'front') {
          updatedGuests[guestIndex].documentFrontUrl = data.url
          updatedGuests[guestIndex].documentFrontFile = file
        } else {
          updatedGuests[guestIndex].documentBackUrl = data.url
          updatedGuests[guestIndex].documentBackFile = file
        }
        setGuests(updatedGuests)
      } else {
        setError(t.uploadError)
      }
    } catch (err) {
      setError(t.uploadError)
    } finally {
      const newGuests = [...guests]
      if (type === 'front') newGuests[guestIndex].uploadingFront = false
      else newGuests[guestIndex].uploadingBack = false
      setGuests(newGuests)
    }
  }

  const addGuest = () => {
    setGuests([...guests, createEmptyGuest()])
  }

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index))
    }
  }

  const updateGuest = (index: number, field: keyof GuestFormData, value: any) => {
    const newGuests = [...guests]
    newGuests[index] = { ...newGuests[index], [field]: value }
    setGuests(newGuests)
  }

  const validateGuest = (guest: GuestFormData, index: number): string | null => {
    const guestNum = index + 1
    const fieldLabels: Record<string, string> = language === 'it' ? {
      firstName: 'Nome',
      lastName: 'Cognome',
      dateOfBirth: 'Data di nascita',
      birthCity: 'Città di nascita',
      birthProvince: 'Provincia di nascita',
      residenceStreet: 'Indirizzo',
      residencePostalCode: 'CAP',
      residenceCity: 'Città di residenza',
      residenceProvince: 'Provincia di residenza',
      fiscalCode: 'Codice fiscale',
      documentNumber: 'Numero documento',
      documentIssueDate: 'Data rilascio documento',
      documentExpiryDate: 'Data scadenza documento',
    } : {
      firstName: 'First name',
      lastName: 'Last name',
      dateOfBirth: 'Date of birth',
      birthCity: 'Birth city',
      birthProvince: 'Birth province',
      residenceStreet: 'Address',
      residencePostalCode: 'Postal code',
      residenceCity: 'Residence city',
      residenceProvince: 'Residence province',
      fiscalCode: 'Fiscal code',
      documentNumber: 'Document number',
      documentIssueDate: 'Document issue date',
      documentExpiryDate: 'Document expiry date',
    }

    const requiredFields: (keyof GuestFormData)[] = [
      'firstName', 'lastName', 'dateOfBirth', 'birthCity', 'birthProvince',
      'residenceStreet', 'residencePostalCode', 'residenceCity', 'residenceProvince',
      'fiscalCode', 'documentNumber', 'documentIssueDate', 'documentExpiryDate'
    ]

    for (const field of requiredFields) {
      if (!guest[field] || (typeof guest[field] === 'string' && guest[field].toString().trim() === '')) {
        const label = fieldLabels[field] || field
        return language === 'it'
          ? `Ospite ${guestNum}: il campo "${label}" è obbligatorio`
          : `Guest ${guestNum}: field "${label}" is required`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validate contact info
    if (!email || email.trim() === '') {
      setError(language === 'it' ? 'Il campo "Email" è obbligatorio' : 'Field "Email" is required')
      setSubmitting(false)
      return
    }
    if (!phone || phone.trim() === '') {
      setError(language === 'it' ? 'Il campo "Telefono" è obbligatorio' : 'Field "Phone" is required')
      setSubmitting(false)
      return
    }

    // Validate each guest
    for (let i = 0; i < guests.length; i++) {
      const validationError = validateGuest(guests[i], i)
      if (validationError) {
        setError(validationError)
        setSubmitting(false)
        return
      }
    }

    try {
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i]
        const response = await fetch('/api/public/checkin/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoomId,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            firstName: guest.firstName,
            lastName: guest.lastName,
            dateOfBirth: guest.dateOfBirth,
            birthCity: guest.birthCity,
            birthProvince: guest.birthProvince,
            residenceStreet: guest.residenceStreet,
            residencePostalCode: guest.residencePostalCode,
            residenceCity: guest.residenceCity,
            residenceProvince: guest.residenceProvince,
            fiscalCode: guest.fiscalCode,
            documentType: guest.documentType,
            documentNumber: guest.documentNumber,
            documentIssueDate: guest.documentIssueDate,
            documentExpiryDate: guest.documentExpiryDate,
            documentFrontUrl: guest.documentFrontUrl,
            documentBackUrl: guest.documentBackUrl,
            isExempt: guest.isExempt,
            exemptionReason: guest.exemptionReason,
            // Solo il primo ospite ha la prova di pagamento
            touristTaxPaymentProof: i === 0 ? paymentProofUrl : null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || t.allFieldsRequired)
          setSubmitting(false)
          return
        }
      }
      setSuccess(true)
    } catch (err) {
      setError(t.allFieldsRequired)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.successTitle}</h1>
          <p className="text-slate-600 mb-6">{t.successMessage}</p>
          <p className="text-sm text-slate-500">{t.confirmationEmail}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <div className="bg-white rounded-full shadow-lg p-2 flex space-x-2">
            <button
              onClick={() => setLanguage('it')}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${language === 'it' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="text-xl">🇮🇹</span>
              <span className="font-medium">IT</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className="font-medium">EN</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{t.title}</h1>
          <p className="text-slate-600">{t.subtitle}</p>
        </div>

        {/* Step 1: Selection */}
        {step === 'selection' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={24} />
              {language === 'it' ? 'Seleziona il tuo soggiorno' : 'Select your stay'}
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Home size={16} className="inline mr-2" />
                  {t.structure} *
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => { setSelectedPropertyId(e.target.value); setSelectedRoomId('') }}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'it' ? 'Seleziona struttura...' : 'Select property...'}</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.city}</option>
                  ))}
                </select>
              </div>

              {selectedProperty && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Bed size={16} className="inline mr-2" />
                    {language === 'it' ? 'Stanza' : 'Room'} *
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'it' ? 'Seleziona stanza...' : 'Select room...'}</option>
                    {selectedProperty.rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRoom && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Check-in *</label>
                    <input
                      type="date"
                      value={checkInDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Check-out *</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {checkInDate && checkOutDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Users size={16} className="inline mr-2" />
                    {language === 'it' ? 'Numero ospiti' : 'Number of guests'} *
                  </label>
                  <select
                    value={numGuests}
                    onChange={(e) => setNumGuests(parseInt(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? t.guest : t.guests}</option>
                    ))}
                  </select>
                </div>
              )}

              {canProceedToForm && (
                <button
                  onClick={handleProceedToForm}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>{language === 'it' ? 'Continua con i dati ospiti' : 'Continue with guest data'}</span>
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <>
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{t.bookingSummary}</h2>
                <button onClick={() => setStep('selection')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {language === 'it' ? 'Modifica' : 'Edit'}
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-slate-600">{t.structure}</p>
                    <p className="font-semibold text-slate-900">{selectedProperty?.name}</p>
                    <p className="text-sm text-slate-600">{selectedRoom?.name}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-slate-600">{t.stayDates}</p>
                    <p className="font-semibold text-slate-900">{formatDate(checkInDate)} - {formatDate(checkOutDate)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-slate-600">{t.guests}</p>
                    <p className="font-semibold text-slate-900">{numGuests} {numGuests === 1 ? t.guest : t.guests}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">{language === 'it' ? 'Contatti' : 'Contact'}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'it' ? 'Telefono' : 'Phone'} *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center shadow-lg">
                <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Guest Forms */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {guests.map((guest, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{t.guestNumber} {index + 1} {t.requiredByLaw}</h2>
                    {guests.length > 1 && (
                      <button type="button" onClick={() => removeGuest(index)} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>

                  {/* Personal Data */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">{t.personalData}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.firstName} *</label>
                        <input type="text" required value={guest.firstName} onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.lastName} *</label>
                        <input type="text" required value={guest.lastName} onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.dateOfBirth} *</label>
                        <input type="date" required value={guest.dateOfBirth} onChange={(e) => updateGuest(index, 'dateOfBirth', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.fiscalCode} *</label>
                        <input type="text" required maxLength={16} value={guest.fiscalCode} onChange={(e) => updateGuest(index, 'fiscalCode', e.target.value.toUpperCase())}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.birthCity} *</label>
                        <input type="text" required value={guest.birthCity} onChange={(e) => updateGuest(index, 'birthCity', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.birthProvince} *</label>
                        <input type="text" required maxLength={2} value={guest.birthProvince} onChange={(e) => updateGuest(index, 'birthProvince', e.target.value.toUpperCase())}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.residenceStreet} *</label>
                        <input type="text" required value={guest.residenceStreet} onChange={(e) => updateGuest(index, 'residenceStreet', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.postalCode} *</label>
                        <input type="text" required value={guest.residencePostalCode} onChange={(e) => updateGuest(index, 'residencePostalCode', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.residenceCity} *</label>
                        <input type="text" required value={guest.residenceCity} onChange={(e) => updateGuest(index, 'residenceCity', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.residenceProvince} *</label>
                        <input type="text" required maxLength={2} value={guest.residenceProvince} onChange={(e) => updateGuest(index, 'residenceProvince', e.target.value.toUpperCase())}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Document */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">{t.identityDocument}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.documentType} *</label>
                        <select required value={guest.documentType} onChange={(e) => updateGuest(index, 'documentType', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500">
                          <option value="CARTA_IDENTITA">{t.idCard}</option>
                          <option value="PASSAPORTO">{t.passport}</option>
                          <option value="PATENTE">{t.drivingLicense}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.documentNumber} *</label>
                        <input type="text" required value={guest.documentNumber} onChange={(e) => updateGuest(index, 'documentNumber', e.target.value.toUpperCase())}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.issueDate} *</label>
                        <input type="date" required value={guest.documentIssueDate} onChange={(e) => updateGuest(index, 'documentIssueDate', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.expiryDate} *</label>
                        <input type="date" required value={guest.documentExpiryDate} onChange={(e) => updateGuest(index, 'documentExpiryDate', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-slate-900 mb-2">{t.uploadDocument}</h3>
                    <p className="text-sm text-slate-600 mb-4">{t.uploadDocumentDesc}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.documentFront}</label>
                        <input type="file" id={`front-${index}`} accept="image/*,application/pdf" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, index, 'front') }} />
                        <label htmlFor={`front-${index}`}
                          className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 ${guest.documentFrontFile ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
                          {guest.uploadingFront ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                              <p className="text-sm text-slate-600">{t.uploadingFile}</p>
                            </div>
                          ) : guest.documentFrontFile ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="text-green-600 mb-2" size={32} />
                              <p className="text-sm text-green-700 font-medium">{guest.documentFrontFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="text-slate-400 mb-2" size={32} />
                              <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                            </div>
                          )}
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.documentBack}</label>
                        <input type="file" id={`back-${index}`} accept="image/*,application/pdf" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, index, 'back') }} />
                        <label htmlFor={`back-${index}`}
                          className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 ${guest.documentBackFile ? 'border-green-500 bg-green-50' : 'border-slate-300'}`}>
                          {guest.uploadingBack ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                              <p className="text-sm text-slate-600">{t.uploadingFile}</p>
                            </div>
                          ) : guest.documentBackFile ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="text-green-600 mb-2" size={32} />
                              <p className="text-sm text-green-700 font-medium">{guest.documentBackFile.name}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="text-slate-400 mb-2" size={32} />
                              <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addGuest}
                className="w-full bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 py-4 rounded-xl font-medium flex items-center justify-center space-x-2">
                <Plus size={20} /><span>{t.addGuest}</span>
              </button>

              {/* Tourist Tax Section */}
              {selectedProperty?.touristTaxRate && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <DollarSign className="text-amber-600 mt-1" size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{t.touristTaxTitle}</h2>
                      <p className="text-sm text-slate-600">{t.touristTaxDesc}</p>
                    </div>
                  </div>

                  {(() => {
                    const checkIn = new Date(checkInDate)
                    const checkOut = new Date(checkOutDate)
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                    const taxNights = Math.min(nights, selectedProperty.touristTaxMaxNights || 4)
                    const exemptCount = guests.filter(g => g.isExempt).length
                    const nonExemptCount = guests.length - exemptCount
                    const totalTax = nonExemptCount * (selectedProperty.touristTaxRate || 0) * taxNights

                    return (
                      <div className="space-y-4">
                        {/* Calcolo */}
                        <div className="bg-white rounded-xl p-4 border border-amber-200">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-slate-600">{language === 'it' ? 'Tariffa per persona/notte:' : 'Rate per person/night:'}</div>
                            <div className="font-bold text-slate-900">€{selectedProperty.touristTaxRate?.toFixed(2)}</div>
                            <div className="text-slate-600">{language === 'it' ? 'Notti tassabili:' : 'Taxable nights:'}</div>
                            <div className="font-bold text-slate-900">{taxNights} {language === 'it' ? `(max ${selectedProperty.touristTaxMaxNights || 4})` : `(max ${selectedProperty.touristTaxMaxNights || 4})`}</div>
                            <div className="text-slate-600">{language === 'it' ? 'Ospiti soggetti:' : 'Taxable guests:'}</div>
                            <div className="font-bold text-slate-900">{nonExemptCount} / {guests.length}</div>
                            <div className="col-span-2 border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-900">{language === 'it' ? 'Totale da pagare:' : 'Total to pay:'}</span>
                                <span className="text-2xl font-bold text-amber-600">€{totalTax.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {totalTax > 0 && (
                          <>
                            {/* Metodi di pagamento */}
                            <div className="bg-white rounded-xl p-4 border border-amber-200">
                              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                                <CreditCard className="mr-2 text-amber-600" size={18} />
                                {language === 'it' ? 'Metodi di pagamento' : 'Payment methods'}
                              </h3>
                              <div className="space-y-2">
                                {selectedProperty.paypalEmail && (
                                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium text-blue-800">PayPal</span>
                                    <span className="text-blue-600">{selectedProperty.paypalEmail}</span>
                                  </div>
                                )}
                                {selectedProperty.revolutTag && (
                                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <span className="font-medium text-purple-800">Revolut</span>
                                    <span className="text-purple-600">{selectedProperty.revolutTag}</span>
                                  </div>
                                )}
                                {selectedProperty.bankAccountIBAN && (
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center mb-1">
                                      <Building2 size={16} className="mr-2 text-green-600" />
                                      <span className="font-medium text-green-800">{language === 'it' ? 'Bonifico Bancario' : 'Bank Transfer'}</span>
                                    </div>
                                    <div className="text-sm text-green-700">
                                      <p><span className="text-green-600">IBAN:</span> {selectedProperty.bankAccountIBAN}</p>
                                      {selectedProperty.bankAccountHolder && (
                                        <p><span className="text-green-600">{language === 'it' ? 'Intestatario:' : 'Holder:'}</span> {selectedProperty.bankAccountHolder}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Upload prova pagamento */}
                            <div className="bg-white rounded-xl p-4 border border-amber-200">
                              <h3 className="font-semibold text-slate-900 mb-2">
                                {language === 'it' ? 'Carica screenshot del pagamento' : 'Upload payment screenshot'}
                              </h3>
                              <p className="text-sm text-slate-600 mb-3">
                                {language === 'it'
                                  ? 'Dopo aver effettuato il pagamento, carica uno screenshot come conferma'
                                  : 'After making the payment, upload a screenshot as confirmation'}
                              </p>
                              <input
                                type="file"
                                id="payment-proof"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handlePaymentProofUpload(file)
                                }}
                              />
                              <label
                                htmlFor="payment-proof"
                                className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-amber-500 transition-colors ${
                                  paymentProofFile ? 'border-green-500 bg-green-50' : 'border-amber-300'
                                }`}
                              >
                                {uploadingProof ? (
                                  <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
                                    <p className="text-sm text-slate-600">{t.uploadingFile}</p>
                                  </div>
                                ) : paymentProofFile ? (
                                  <div className="flex flex-col items-center">
                                    <CheckCircle className="text-green-600 mb-2" size={32} />
                                    <p className="text-sm text-green-700 font-medium">{paymentProofFile.name}</p>
                                    <p className="text-xs text-green-600 mt-1">
                                      {language === 'it' ? 'Screenshot caricato!' : 'Screenshot uploaded!'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <Upload className="text-amber-400 mb-2" size={32} />
                                    <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                                  </div>
                                )}
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600">{t.privacyNotice}</p>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold disabled:opacity-50 shadow-lg">
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
