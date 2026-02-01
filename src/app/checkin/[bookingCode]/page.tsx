'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, Upload, Plus, Trash2 } from 'lucide-react'
import { translations, Language } from '@/lib/translations'

interface BookingInfo {
  id: string
  bookingCode: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: string
  property: {
    name: string
    address: string
    city: string
    country: string
    touristTaxRate: number | null
    touristTaxMaxNights: number | null
    touristTaxExemptAge: number | null
    paypalEmail: string | null
    revolutTag: string | null
    bankAccountIBAN: string | null
    bankAccountHolder: string | null
  }
  room: {
    name: string
    type: string
  }
  hasCheckInData: boolean
  checkInsCount: number
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
  paymentProofFile: File | null
  uploadingProof: boolean
}

export default function GuestCheckInPage() {
  const params = useParams()
  const bookingCode = params.bookingCode as string

  const [language, setLanguage] = useState<Language>('it')
  const t = translations[language]

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [guests, setGuests] = useState<GuestFormData[]>([createEmptyGuest()])

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
      paymentProofFile: null,
      uploadingProof: false,
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [bookingCode])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/public/checkin/${bookingCode}`)

      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else {
        setError(t.bookingNotFound)
      }
    } catch (err) {
      setError(t.loadingError)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, guestIndex: number, type: 'front' | 'back' | 'proof') => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const newGuests = [...guests]
      if (type === 'front') newGuests[guestIndex].uploadingFront = true
      else if (type === 'back') newGuests[guestIndex].uploadingBack = true
      else if (type === 'proof') newGuests[guestIndex].uploadingProof = true
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
        } else if (type === 'back') {
          updatedGuests[guestIndex].documentBackUrl = data.url
          updatedGuests[guestIndex].documentBackFile = file
        } else if (type === 'proof') {
          updatedGuests[guestIndex].paymentProofFile = file
          updatedGuests[guestIndex].documentFrontUrl = data.url // Store URL temporarily
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
      else if (type === 'back') newGuests[guestIndex].uploadingBack = false
      else if (type === 'proof') newGuests[guestIndex].uploadingProof = false
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Submit each guest
      for (const guest of guests) {
        const response = await fetch('/api/public/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingCode,
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
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || t.allFieldsRequired)
          return
        }
      }

      // Update booking with payment proof if uploaded
      if (guests[0].paymentProofFile && guests[0].documentFrontUrl && booking) {
        await fetch(`/api/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touristTaxPaymentProof: guests[0].documentFrontUrl,
          }),
        })
      }

      setSuccess(true)
    } catch (err) {
      setError(t.allFieldsRequired)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'it' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d4cdb0]/30 to-[#3d4a3c]/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#d4cdb0] rounded-full animate-spin border-t-[#3d4a3c]"></div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d4cdb0]/30 to-[#3d4a3c]/10 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/50">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#3d4a3c] mb-2">{t.error}</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d4cdb0]/30 to-[#3d4a3c]/10 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/50">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#3d4a3c] mb-2">{t.successTitle}</h1>
          <p className="text-slate-600 mb-6">{t.successMessage}</p>
          <p className="text-sm text-slate-500">{t.confirmationEmail}</p>
        </div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4cdb0]/30 to-[#3d4a3c]/10 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-2 flex space-x-2 border border-white/50">
            <button
              onClick={() => setLanguage('it')}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${language === 'it'
                ? 'bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white shadow-md'
                : 'text-[#3d4a3c] hover:bg-[#d4cdb0]/30'
                }`}
            >
              <span className="text-xl">🇮🇹</span>
              <span className="font-medium">IT</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-all ${language === 'en'
                ? 'bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] text-white shadow-md'
                : 'text-[#3d4a3c] hover:bg-[#d4cdb0]/30'
                }`}
            >
              <span className="text-xl">🇬🇧</span>
              <span className="font-medium">EN</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#3d4a3c] mb-2">{t.title}</h1>
          <p className="text-[#3d4a3c]/70">{t.subtitle}</p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-6 border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#3d4a3c]">{t.bookingSummary}</h2>
            <span className="px-4 py-1.5 bg-[#d4cdb0]/40 text-[#3d4a3c] rounded-full text-sm font-bold">
              {bookingCode}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-[#d4cdb0]/30 rounded-xl">
                <MapPin className="text-[#3d4a3c]" size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.structure}</p>
                <p className="font-semibold text-[#3d4a3c]">{booking.property.name}</p>
                <p className="text-sm text-slate-600">{booking.room.name}</p>
                <p className="text-sm text-slate-500">
                  {booking.property.address}, {booking.property.city}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-[#d4cdb0]/30 rounded-xl">
                <Calendar className="text-[#3d4a3c]" size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.stayDates}</p>
                <p className="font-semibold text-[#3d4a3c]">
                  {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-[#d4cdb0]/30 rounded-xl">
                <Users className="text-[#3d4a3c]" size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.guests}</p>
                <p className="font-semibold text-[#3d4a3c]">
                  {booking.guests} {booking.guests === 1 ? t.guest : t.guests}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">{t.total}</p>
              <p className="text-2xl font-bold text-[#3d4a3c]">{formatCurrency(booking.totalPrice)}</p>
            </div>
          </div>
        </div>

        {/* Check-in Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {guests.map((guest, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#3d4a3c]">
                  {t.guestNumber} {index + 1} {t.requiredByLaw}
                </h2>
                {guests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuest(index)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {error && index === 0 && (
                <div className="bg-red-50 text-red-800 p-4 rounded-2xl mb-4 flex items-center border border-red-200">
                  <AlertCircle size={18} className="mr-2" />
                  {error}
                </div>
              )}

              {/* Personal Data */}
              <div className="mb-6">
                <h3 className="font-bold text-[#3d4a3c] mb-4">{t.personalData}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.firstName} *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.firstName}
                      onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.lastName} *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.lastName}
                      onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.dateOfBirth} *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.dateOfBirth}
                      onChange={(e) => updateGuest(index, 'dateOfBirth', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col space-y-4 bg-[#d4cdb0]/20 p-4 rounded-2xl border border-[#d4cdb0]/40">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 border-slate-300 rounded text-[#3d4a3c] focus:ring-2 focus:ring-[#3d4a3c]/30"
                        checked={guest.isExempt}
                        onChange={(e) => updateGuest(index, 'isExempt', e.target.checked)}
                      />
                      <span className="text-sm font-medium text-[#3d4a3c]">{t.touristTaxExempt}</span>
                    </label>

                    {guest.isExempt && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t.touristTaxExemptReason} *
                        </label>
                        <select
                          required
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                          value={guest.exemptionReason}
                          onChange={(e) => updateGuest(index, 'exemptionReason', e.target.value)}
                        >
                          <option value="">{t.touristTaxExemptSelect}</option>
                          <option value="UNDER_12">{t.touristTaxExemptUnder12}</option>
                          <option value="RESIDENT">{t.touristTaxExemptResident}</option>
                          <option value="ASSISTANT">{t.touristTaxExemptAssistant}</option>
                          <option value="STUDENT">{t.touristTaxExemptStudent}</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.birthCity} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeholderCity}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.birthCity}
                      onChange={(e) => updateGuest(index, 'birthCity', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.birthProvince} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder={t.placeholderProvince}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.birthProvince}
                      onChange={(e) => updateGuest(index, 'birthProvince', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.residenceStreet} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeholderStreet}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.residenceStreet}
                      onChange={(e) => updateGuest(index, 'residenceStreet', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.postalCode} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeholderPostalCode}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.residencePostalCode}
                      onChange={(e) => updateGuest(index, 'residencePostalCode', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.residenceCity} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeholderCity}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.residenceCity}
                      onChange={(e) => updateGuest(index, 'residenceCity', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.residenceProvince} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder={t.placeholderProvince}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.residenceProvince}
                      onChange={(e) => updateGuest(index, 'residenceProvince', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.fiscalCode} *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder={t.placeholderFiscalCode}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.fiscalCode}
                      onChange={(e) => updateGuest(index, 'fiscalCode', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              </div>

              {/* Document */}
              <div className="border-t border-slate-100 pt-6 mb-6">
                <h3 className="font-bold text-[#3d4a3c] mb-4">{t.identityDocument}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.documentType} *
                    </label>
                    <select
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.documentType}
                      onChange={(e) => updateGuest(index, 'documentType', e.target.value)}
                    >
                      <option value="CARTA_IDENTITA">{t.idCard}</option>
                      <option value="PASSAPORTO">{t.passport}</option>
                      <option value="PATENTE">{t.drivingLicense}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.documentNumber} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.placeholderDocNumber}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.documentNumber}
                      onChange={(e) => updateGuest(index, 'documentNumber', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.issueDate} *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.documentIssueDate}
                      onChange={(e) => updateGuest(index, 'documentIssueDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.expiryDate} *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                      value={guest.documentExpiryDate}
                      onChange={(e) => updateGuest(index, 'documentExpiryDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Upload Documents */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-[#3d4a3c] mb-2">{t.uploadDocument}</h3>
                <p className="text-sm text-slate-600 mb-4">{t.uploadDocumentDesc}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.documentFront}
                    </label>
                    <input
                      type="file"
                      id={`docFront-${index}`}
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, index, 'front')
                      }}
                    />
                    <label
                      htmlFor={`docFront-${index}`}
                      className={`block border-2 border-dashed rounded-lg p-4 text-center hover:border-[#3d4a3c] transition-colors cursor-pointer ${guest.documentFrontFile ? 'border-green-500 bg-green-50' : 'border-slate-300'
                        }`}
                    >
                      {guest.uploadingFront ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#d4cdb0] border-t-[#3d4a3c] mb-2"></div>
                          <p className="text-sm text-slate-600">{t.uploadingFile}</p>
                        </div>
                      ) : guest.documentFrontFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="text-green-600 mb-2" size={32} />
                          <p className="text-sm text-green-700 font-medium">{guest.documentFrontFile.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{t.changeFile}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="text-slate-400 mb-2" size={32} />
                          <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                          <p className="text-xs text-slate-500 mt-1">JPG, PNG, PDF ({t.maxSize})</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.documentBack}
                    </label>
                    <input
                      type="file"
                      id={`docBack-${index}`}
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, index, 'back')
                      }}
                    />
                    <label
                      htmlFor={`docBack-${index}`}
                      className={`block border-2 border-dashed rounded-lg p-4 text-center hover:border-[#3d4a3c] transition-colors cursor-pointer ${guest.documentBackFile ? 'border-green-500 bg-green-50' : 'border-slate-300'
                        }`}
                    >
                      {guest.uploadingBack ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#d4cdb0] border-t-[#3d4a3c] mb-2"></div>
                          <p className="text-sm text-slate-600">{t.uploadingFile}</p>
                        </div>
                      ) : guest.documentBackFile ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle className="text-green-600 mb-2" size={32} />
                          <p className="text-sm text-green-700 font-medium">{guest.documentBackFile.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{t.changeFile}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="text-slate-400 mb-2" size={32} />
                          <p className="text-sm text-slate-600">{t.clickToUpload}</p>
                          <p className="text-xs text-slate-500 mt-1">JPG, PNG, PDF ({t.maxSize})</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Guest Button */}
          {guests.length < booking.guests && (
            <button
              type="button"
              onClick={addGuest}
              className="w-full bg-white/80 backdrop-blur-sm border-2 border-dashed border-[#d4cdb0] hover:border-[#3d4a3c] text-[#3d4a3c] py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all hover:bg-[#d4cdb0]/20"
            >
              <Plus size={20} />
              <span>{t.addGuest}</span>
            </button>
          )}

          {/* Privacy Notice */}
          <div className="bg-[#d4cdb0]/20 rounded-2xl p-4 border border-[#d4cdb0]/40">
            <p className="text-xs text-slate-600">{t.privacyNotice}</p>
          </div>

          {/* Tourist Tax Section */}
          {booking.property.touristTaxRate && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-2 border-[#d4cdb0]/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-[#d4cdb0]/40 p-3 rounded-2xl">
                  <CheckCircle className="text-[#3d4a3c]" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#3d4a3c]">{t.touristTaxTitle}</h2>
                  <p className="text-sm text-slate-600">{t.touristTaxDesc}</p>
                </div>
              </div>

              {(() => {
                const checkIn = new Date(booking.checkIn)
                const checkOut = new Date(booking.checkOut)
                const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                const taxNights = Math.min(nights, booking.property.touristTaxMaxNights || 4)
                const nonExemptCount = guests.filter(g => !g.isExempt).length
                const totalTax = nonExemptCount * (booking.property.touristTaxRate || 4) * taxNights

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-[#d4cdb0]/20 rounded-2xl border border-[#d4cdb0]/40">
                      <div>
                        <p className="text-sm text-slate-600">
                          {nonExemptCount} {nonExemptCount === 1 ? t.guest : t.guests} x {taxNights} {t.stayDates}
                        </p>
                        <a
                          href="https://idsportale.comune.palermo.it"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#3d4a3c] hover:underline font-medium"
                        >
                          {t.touristTaxInfo}
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 line-through">
                          {nights > taxNights ? `${nights} notti` : ''}
                        </p>
                        <p className="text-2xl font-bold text-[#3d4a3c]">{formatCurrency(totalTax)}</p>
                      </div>
                    </div>

                    {totalTax > 0 && (
                      <div className="grid gap-3">
                        {booking.property.paypalEmail && (
                          <a
                            href={`https://www.paypal.com/paypalme/${booking.property.paypalEmail}/${totalTax}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-3 w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-3 rounded-xl font-bold transition-all shadow-lg group"
                          >
                            <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-5 rounded" />
                            <span>{t.touristTaxPay}</span>
                          </a>
                        )}

                        {booking.property.revolutTag && (
                          <a
                            href={`https://revolut.me/${booking.property.revolutTag}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-3 w-full bg-black hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-lg group"
                          >
                            <span className="text-xl">R</span>
                            <span>{t.touristTaxRevolut}</span>
                          </a>
                        )}

                        {booking.property.bankAccountIBAN && (
                          <div className="bg-[#d4cdb0]/20 border border-[#d4cdb0]/40 rounded-2xl p-4">
                            <h4 className="font-bold text-[#3d4a3c] mb-2 flex items-center space-x-2">
                              <span>🏦</span>
                              <span>{t.touristTaxBankTransfer}</span>
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p className="flex justify-between">
                                <span className="text-slate-500">{t.touristTaxIBAN}:</span>
                                <span className="font-mono font-bold text-[#3d4a3c]">{booking.property.bankAccountIBAN}</span>
                              </p>
                              {booking.property.bankAccountHolder && (
                                <p className="flex justify-between">
                                  <span className="text-slate-500">{t.touristTaxHolder}:</span>
                                  <span className="font-medium">{booking.property.bankAccountHolder}</span>
                                </p>
                              )}
                              <p className="flex justify-between">
                                <span className="text-slate-500">{t.total}:</span>
                                <span className="font-bold">{formatCurrency(totalTax)}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Screenshot Pagamento */}
                    {totalTax > 0 && (
                      <div className="mt-6 border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-[#3d4a3c] mb-3 flex items-center space-x-2">
                          <Upload size={20} className="text-[#3d4a3c]" />
                          <span>Carica Screenshot Pagamento</span>
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Dopo aver effettuato il pagamento, carica uno screenshot come conferma.
                        </p>
                        <input
                          type="file"
                          id="payment-proof"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, 0, 'proof')
                          }}
                        />
                        <label
                          htmlFor="payment-proof"
                          className={`block border-2 border-dashed rounded-lg p-4 text-center hover:border-[#3d4a3c] transition-colors cursor-pointer ${guests[0].paymentProofFile ? 'border-green-500 bg-green-50' : 'border-slate-300'
                            }`}
                        >
                          {guests[0].uploadingProof ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#d4cdb0] border-t-[#3d4a3c] mb-2"></div>
                              <p className="text-sm text-slate-600">Caricamento...</p>
                            </div>
                          ) : guests[0].paymentProofFile ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="text-green-600 mb-2" size={32} />
                              <p className="text-sm text-green-700 font-medium">{guests[0].paymentProofFile.name}</p>
                              <p className="text-xs text-slate-500 mt-1">Clicca per cambiare</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="text-slate-400 mb-2" size={32} />
                              <p className="text-sm text-slate-600">Clicca per caricare screenshot</p>
                              <p className="text-xs text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white py-4 rounded-2xl font-bold disabled:opacity-50 transition-all shadow-xl text-lg"
          >
            {submitting ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
