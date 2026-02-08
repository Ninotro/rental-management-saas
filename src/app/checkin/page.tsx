'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, Upload, Plus, Trash2, ChevronRight, Home, Bed, DollarSign, CreditCard, Building2 } from 'lucide-react'
import { translations, Language } from '@/lib/translations'

interface Property {
  id: string
  name: string
  city: string
  rooms: Room[]
}

interface GlobalSettings {
  touristTaxRate: number | null
  touristTaxMaxNights: number | null
  touristTaxExemptAge: number | null
  paypalEmail: string | null
  revolutTag: string | null
  bankAccountIBAN: string | null
  bankAccountHolder: string | null
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
  sex: string // "M" o "F"
  nationality: string
  dateOfBirth: string
  birthCity: string
  birthProvince: string
  fiscalCode: string // Opzionale, necessario se fattura
  documentType: string
  documentNumber: string
  documentIssuePlace: string // Luogo rilascio documento
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
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [numGuests, setNumGuests] = useState(1)

  // Form state
  const [guests, setGuests] = useState<GuestFormData[]>([createEmptyGuest()])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'email' | ''>('')

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
      sex: '',
      nationality: 'Italia',
      dateOfBirth: '',
      birthCity: '',
      birthProvince: '',
      fiscalCode: '',
      documentType: 'CARTA_IDENTITA',
      documentNumber: '',
      documentIssuePlace: '',
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

  // Genera un ID univoco per raggruppare gli ospiti dello stesso check-in
  function generateGroupId(): string {
    return `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/public/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
        setGlobalSettings(data.settings || null)
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
      // Form per tutti gli ospiti
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
      sex: 'Sesso',
      dateOfBirth: 'Data di nascita',
      birthCity: 'Città di nascita',
      birthProvince: 'Provincia di nascita',
      documentNumber: 'Numero documento',
      documentIssuePlace: 'Luogo rilascio documento',
    } : {
      firstName: 'First name',
      lastName: 'Last name',
      sex: 'Sex',
      dateOfBirth: 'Date of birth',
      birthCity: 'Birth city',
      birthProvince: 'Birth province',
      documentNumber: 'Document number',
      documentIssuePlace: 'Document issue place',
    }

    const requiredFields: (keyof GuestFormData)[] = [
      'firstName', 'lastName', 'sex', 'dateOfBirth', 'birthCity', 'birthProvince',
      'documentNumber', 'documentIssuePlace'
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

    // Validate contact preference
    if (contactPreference === 'whatsapp' && (!phone || phone.trim() === '')) {
      setError(language === 'it'
        ? 'Hai scelto WhatsApp: il campo "Telefono" è obbligatorio'
        : 'You chose WhatsApp: "Phone" field is required')
      setSubmitting(false)
      return
    }
    if (contactPreference === 'email' && (!email || email.trim() === '')) {
      setError(language === 'it'
        ? 'Hai scelto Email: il campo "Email" è obbligatorio'
        : 'You chose Email: "Email" field is required')
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
      // Ospite principale (primo)
      const mainGuest = guests[0]
      // Ospiti aggiuntivi (dal secondo in poi)
      const additionalGuests = guests.slice(1).map(g => ({
        firstName: g.firstName,
        lastName: g.lastName,
        sex: g.sex,
        nationality: g.nationality,
        dateOfBirth: g.dateOfBirth,
        birthCity: g.birthCity,
        birthProvince: g.birthProvince,
        fiscalCode: g.fiscalCode || null,
        documentType: g.documentType,
        documentNumber: g.documentNumber,
        documentIssuePlace: g.documentIssuePlace,
        documentFrontUrl: g.documentFrontUrl,
        documentBackUrl: g.documentBackUrl,
        isExempt: g.isExempt,
        exemptionReason: g.exemptionReason,
      }))

      const response = await fetch('/api/public/checkin/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoomId,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          // Contatti (opzionali)
          email: email || null,
          phone: phone || null,
          contactPreference: contactPreference || null,
          // Numero totale ospiti e ospiti aggiuntivi
          numGuests: guests.length,
          additionalGuests: additionalGuests.length > 0 ? additionalGuests : null,
          // Dati ospite principale
          firstName: mainGuest.firstName,
          lastName: mainGuest.lastName,
          sex: mainGuest.sex,
          nationality: mainGuest.nationality,
          dateOfBirth: mainGuest.dateOfBirth,
          birthCity: mainGuest.birthCity,
          birthProvince: mainGuest.birthProvince,
          fiscalCode: mainGuest.fiscalCode || null,
          documentType: mainGuest.documentType,
          documentNumber: mainGuest.documentNumber,
          documentIssuePlace: mainGuest.documentIssuePlace,
          documentFrontUrl: mainGuest.documentFrontUrl,
          documentBackUrl: mainGuest.documentBackUrl,
          isExempt: mainGuest.isExempt,
          exemptionReason: mainGuest.exemptionReason,
          touristTaxPaymentProof: paymentProofUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || t.allFieldsRequired)
        setSubmitting(false)
        return
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

              {/* Contact Preference */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {language === 'it'
                    ? 'Dove preferisci ricevere le indicazioni per l\'ingresso?'
                    : 'Where do you prefer to receive check-in instructions?'}
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value as 'whatsapp' | 'email' | '')}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'it' ? 'Seleziona preferenza...' : 'Select preference...'}</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email {contactPreference === 'email' && '*'}
                    <span className="text-slate-500 text-xs ml-1">
                      {language === 'it' ? '(opzionale)' : '(optional)'}
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'it' ? 'esempio@email.com' : 'example@email.com'}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {language === 'it' ? 'Telefono / WhatsApp' : 'Phone / WhatsApp'} {contactPreference === 'whatsapp' && '*'}
                    <span className="text-slate-500 text-xs ml-1">
                      {language === 'it' ? '(opzionale)' : '(optional)'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 333 1234567"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.lastName} *</label>
                        <input type="text" required value={guest.lastName} onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.firstName} *</label>
                        <input type="text" required value={guest.firstName} onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'it' ? 'Sesso' : 'Sex'} *</label>
                        <select required value={guest.sex} onChange={(e) => updateGuest(index, 'sex', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500">
                          <option value="">{language === 'it' ? 'Seleziona...' : 'Select...'}</option>
                          <option value="M">{language === 'it' ? 'Maschio' : 'Male'}</option>
                          <option value="F">{language === 'it' ? 'Femmina' : 'Female'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.dateOfBirth} *</label>
                        <input type="date" required value={guest.dateOfBirth} onChange={(e) => updateGuest(index, 'dateOfBirth', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.nationality} *</label>
                        <select required value={guest.nationality} onChange={(e) => updateGuest(index, 'nationality', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500">
                          <option value="Italia">Italia</option>
                          <option value="Germania">Germania</option>
                          <option value="Francia">Francia</option>
                          <option value="Spagna">Spagna</option>
                          <option value="Regno Unito">Regno Unito</option>
                          <option value="Stati Uniti">Stati Uniti</option>
                          <option value="Paesi Bassi">Paesi Bassi</option>
                          <option value="Belgio">Belgio</option>
                          <option value="Austria">Austria</option>
                          <option value="Svizzera">Svizzera</option>
                          <option value="Polonia">Polonia</option>
                          <option value="Portogallo">Portogallo</option>
                          <option value="Grecia">Grecia</option>
                          <option value="Svezia">Svezia</option>
                          <option value="Norvegia">Norvegia</option>
                          <option value="Danimarca">Danimarca</option>
                          <option value="Finlandia">Finlandia</option>
                          <option value="Irlanda">Irlanda</option>
                          <option value="Repubblica Ceca">Repubblica Ceca</option>
                          <option value="Romania">Romania</option>
                          <option value="Ungheria">Ungheria</option>
                          <option value="Croazia">Croazia</option>
                          <option value="Slovenia">Slovenia</option>
                          <option value="Slovacchia">Slovacchia</option>
                          <option value="Bulgaria">Bulgaria</option>
                          <option value="Lituania">Lituania</option>
                          <option value="Lettonia">Lettonia</option>
                          <option value="Estonia">Estonia</option>
                          <option value="Lussemburgo">Lussemburgo</option>
                          <option value="Malta">Malta</option>
                          <option value="Cipro">Cipro</option>
                          <option value="Australia">Australia</option>
                          <option value="Canada">Canada</option>
                          <option value="Brasile">Brasile</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Giappone">Giappone</option>
                          <option value="Cina">Cina</option>
                          <option value="Corea del Sud">Corea del Sud</option>
                          <option value="India">India</option>
                          <option value="Russia">Russia</option>
                          <option value="Messico">Messico</option>
                          <option value="Altro">Altro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.birthCity} *</label>
                        <input type="text" required value={guest.birthCity} onChange={(e) => updateGuest(index, 'birthCity', e.target.value)}
                          placeholder={language === 'it' ? 'es. Roma' : 'e.g. Rome'}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t.birthProvince} *</label>
                        <input type="text" required maxLength={2} value={guest.birthProvince} onChange={(e) => updateGuest(index, 'birthProvince', e.target.value.toUpperCase())}
                          placeholder={language === 'it' ? 'es. RM' : 'e.g. RM'}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t.fiscalCode}
                          <span className="text-slate-500 text-xs ml-2">
                            {language === 'it' ? '(necessario se richiesta fattura)' : '(required if invoice needed)'}
                          </span>
                        </label>
                        <input type="text" maxLength={16} value={guest.fiscalCode} onChange={(e) => updateGuest(index, 'fiscalCode', e.target.value.toUpperCase())}
                          placeholder="RSSMRA80A01H501U"
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
                          placeholder={language === 'it' ? 'es. AA1234567' : 'e.g. AA1234567'}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {language === 'it' ? 'Luogo rilascio documento' : 'Document issue place'} *
                        </label>
                        <input type="text" required value={guest.documentIssuePlace} onChange={(e) => updateGuest(index, 'documentIssuePlace', e.target.value)}
                          placeholder={language === 'it' ? 'es. Comune di Roma' : 'e.g. Municipality of Rome'}
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

                  {/* Tourist Tax Exemption - Per ogni ospite */}
                  {globalSettings?.touristTaxRate && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                        <DollarSign className="mr-2 text-amber-600" size={18} />
                        {language === 'it' ? 'Esenzione Tassa di Soggiorno' : 'Tourist Tax Exemption'}
                      </h3>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={guest.isExempt}
                            onChange={(e) => updateGuest(index, 'isExempt', e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-medium text-slate-900">
                              {language === 'it' ? 'Sono esente dalla tassa di soggiorno' : 'I am exempt from tourist tax'}
                            </span>
                            <p className="text-sm text-slate-600 mt-1">
                              {language === 'it'
                                ? 'Seleziona se rientri in una delle categorie esenti (es. minori, residenti, accompagnatori di pazienti, ecc.)'
                                : 'Select if you fall into one of the exempt categories (e.g. minors, residents, patient companions, etc.)'}
                            </p>
                          </div>
                        </label>
                        {guest.isExempt && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {language === 'it' ? 'Motivo esenzione *' : 'Exemption reason *'}
                            </label>
                            <select
                              value={guest.exemptionReason}
                              onChange={(e) => updateGuest(index, 'exemptionReason', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">{language === 'it' ? 'Seleziona motivo...' : 'Select reason...'}</option>
                              <option value="MINORE_14">{language === 'it' ? 'Minore di 14 anni' : 'Under 14 years old'}</option>
                              <option value="RESIDENTE">{language === 'it' ? 'Residente nel Comune' : 'Local resident'}</option>
                              <option value="ACCOMPAGNATORE_PAZIENTE">{language === 'it' ? 'Accompagnatore paziente in cura' : 'Patient companion'}</option>
                              <option value="FORZE_ORDINE">{language === 'it' ? 'Forze dell\'ordine in servizio' : 'Law enforcement on duty'}</option>
                              <option value="DISABILE">{language === 'it' ? 'Persona con disabilità' : 'Person with disability'}</option>
                              <option value="AUTISTA_PULLMAN">{language === 'it' ? 'Autista pullman turistico' : 'Tourist bus driver'}</option>
                              <option value="ALTRO">{language === 'it' ? 'Altro (specificare nelle note)' : 'Other (specify in notes)'}</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={addGuest}
                className="w-full bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 py-4 rounded-xl font-medium flex items-center justify-center space-x-2">
                <Plus size={20} /><span>{t.addGuest}</span>
              </button>

              {/* Tourist Tax Section */}
              {globalSettings?.touristTaxRate && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <DollarSign className="text-amber-600 mt-1" size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{t.touristTaxTitle}</h2>
                      <p className="text-sm text-slate-600">{t.touristTaxDesc}</p>
                      <a
                        href="https://www.comune.palermo.it/palermo-informa-dettaglio.php?tp=1&id=34181"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 text-sm text-amber-700 hover:text-amber-800 font-medium underline"
                      >
                        {language === 'it'
                          ? '📋 Regolamento tassa di soggiorno Palermo'
                          : '📋 Palermo tourist tax regulations'}
                      </a>
                    </div>
                  </div>

                  {(() => {
                    const checkIn = new Date(checkInDate)
                    const checkOut = new Date(checkOutDate)
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                    const taxNights = Math.min(nights, globalSettings.touristTaxMaxNights || 4)
                    const exemptCount = guests.filter(g => g.isExempt).length
                    const nonExemptCount = guests.length - exemptCount
                    const totalTax = nonExemptCount * (globalSettings.touristTaxRate || 0) * taxNights

                    return (
                      <div className="space-y-4">
                        {/* Calcolo */}
                        <div className="bg-white rounded-xl p-4 border border-amber-200">
                          <h4 className="font-semibold text-slate-800 mb-3">
                            {language === 'it' ? 'Calcolo tassa di soggiorno' : 'Tourist tax calculation'}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Tariffa per persona/notte:' : 'Rate per person/night:'}</span>
                              <span className="font-bold text-slate-900">€{globalSettings.touristTaxRate?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Numero notti totali:' : 'Total nights:'}</span>
                              <span className="font-bold text-slate-900">{nights}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Notti tassabili:' : 'Taxable nights:'}</span>
                              <span className="font-bold text-slate-900">{taxNights} <span className="text-xs text-slate-500">(max {globalSettings.touristTaxMaxNights || 4})</span></span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Ospiti totali:' : 'Total guests:'}</span>
                              <span className="font-bold text-slate-900">{guests.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Ospiti esenti:' : 'Exempt guests:'}</span>
                              <span className="font-bold text-green-600">{exemptCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-600">{language === 'it' ? 'Ospiti soggetti alla tassa:' : 'Taxable guests:'}</span>
                              <span className="font-bold text-amber-600">{nonExemptCount}</span>
                            </div>

                            {/* Formula */}
                            <div className="bg-slate-50 rounded-lg p-3 mt-3">
                              <p className="text-xs text-slate-500 mb-1">{language === 'it' ? 'Formula:' : 'Formula:'}</p>
                              <p className="font-mono text-sm text-slate-700">
                                €{globalSettings.touristTaxRate?.toFixed(2)} × {taxNights} {language === 'it' ? 'notti' : 'nights'} × {nonExemptCount} {language === 'it' ? 'ospiti' : 'guests'} = <span className="font-bold text-amber-600">€{totalTax.toFixed(2)}</span>
                              </p>
                            </div>

                            <div className="border-t pt-3 mt-3">
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
                                {globalSettings.paypalEmail && (
                                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span className="font-medium text-blue-800">PayPal</span>
                                    <span className="text-blue-600">{globalSettings.paypalEmail}</span>
                                  </div>
                                )}
                                {globalSettings.revolutTag && (
                                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <span className="font-medium text-purple-800">Revolut</span>
                                    <span className="text-purple-600">{globalSettings.revolutTag}</span>
                                  </div>
                                )}
                                {globalSettings.bankAccountIBAN && (
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center mb-1">
                                      <Building2 size={16} className="mr-2 text-green-600" />
                                      <span className="font-medium text-green-800">{language === 'it' ? 'Bonifico Bancario' : 'Bank Transfer'}</span>
                                    </div>
                                    <div className="text-sm text-green-700">
                                      <p><span className="text-green-600">IBAN:</span> {globalSettings.bankAccountIBAN}</p>
                                      {globalSettings.bankAccountHolder && (
                                        <p><span className="text-green-600">{language === 'it' ? 'Intestatario:' : 'Holder:'}</span> {globalSettings.bankAccountHolder}</p>
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
