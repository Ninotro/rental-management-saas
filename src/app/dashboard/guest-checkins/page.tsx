'use client'

import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Calendar, User, MapPin, CreditCard, Eye, Search, Filter, Copy, X, ExternalLink } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GuestCheckIn {
  id: string
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
  documentFrontUrl: string | null
  documentBackUrl: string | null
  submittedAt: string
  submittedToPolice: boolean
  submittedToPoliceAt: string | null
  // Dati dal nuovo flusso (senza prenotazione)
  selectedCheckIn: string | null
  selectedCheckOut: string | null
  selectedRoom: {
    name: string
    property: {
      name: string
      city: string
      address: string
    }
  } | null
  // Dati dal vecchio flusso (con prenotazione)
  booking: {
    checkIn: string
    checkOut: string
    touristTaxPaymentProof: string | null
    property: {
      name: string
      city: string
      address: string
    }
    room: {
      name: string
    } | null
  } | null
}

export default function GuestCheckInsPage() {
  const [checkIns, setCheckIns] = useState<GuestCheckIn[]>([])
  const [filteredCheckIns, setFilteredCheckIns] = useState<GuestCheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCheckIn, setSelectedCheckIn] = useState<GuestCheckIn | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchCheckIns()
  }, [])

  useEffect(() => {
    filterCheckIns()
  }, [checkIns, searchTerm, startDate, endDate])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/guest-checkins')
      if (response.ok) {
        const data = await response.json()
        setCheckIns(data)
        setFilteredCheckIns(data)
      }
    } catch (error) {
      console.error('Errore nel caricamento check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper per ottenere i dati della struttura (da booking o selectedRoom)
  const getPropertyName = (c: GuestCheckIn) =>
    c.booking?.property?.name || c.selectedRoom?.property?.name || 'N/A'

  const getPropertyCity = (c: GuestCheckIn) =>
    c.booking?.property?.city || c.selectedRoom?.property?.city || 'N/A'

  const getRoomName = (c: GuestCheckIn) =>
    c.booking?.room?.name || c.selectedRoom?.name || 'N/A'

  const getCheckInDate = (c: GuestCheckIn) =>
    c.booking?.checkIn || c.selectedCheckIn || c.submittedAt

  const getCheckOutDate = (c: GuestCheckIn) =>
    c.booking?.checkOut || c.selectedCheckOut || c.submittedAt

  const filterCheckIns = () => {
    let filtered = [...checkIns]

    // Filtra per termine di ricerca
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getPropertyName(c).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtra per date
    if (startDate) {
      filtered = filtered.filter(
        (c) => new Date(c.submittedAt) >= new Date(startDate)
      )
    }
    if (endDate) {
      filtered = filtered.filter(
        (c) => new Date(c.submittedAt) <= new Date(endDate)
      )
    }

    setFilteredCheckIns(filtered)
  }

  const exportToCSV = async () => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `/api/guest-checkins/export/csv?${params.toString()}`
    window.open(url, '_blank')
  }

  const exportToPDF = () => {
    const doc = new jsPDF('landscape')

    // Titolo
    doc.setFontSize(18)
    doc.text('Registro Check-in Ospiti', 14, 15)

    doc.setFontSize(10)
    doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 14, 22)
    doc.text(`Totale ospiti: ${filteredCheckIns.length}`, 14, 27)

    // Prepara dati tabella
    const tableData = filteredCheckIns.map((checkIn) => [
      new Date(getCheckInDate(checkIn)).toLocaleDateString('it-IT'),
      getPropertyName(checkIn),
      getPropertyCity(checkIn),
      `${checkIn.firstName} ${checkIn.lastName}`,
      new Date(checkIn.dateOfBirth).toLocaleDateString('it-IT'),
      checkIn.fiscalCode,
      checkIn.documentType.replace('_', ' '),
      checkIn.documentNumber,
    ])

    // Genera tabella
    autoTable(doc, {
      head: [
        [
          'Data Arrivo',
          'Struttura',
          'Città',
          'Nome Completo',
          'Data Nascita',
          'Codice Fiscale',
          'Tipo Doc.',
          'N° Doc.',
        ],
      ],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    // Salva PDF
    doc.save(`check-in-ospiti-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      CARTA_IDENTITA: 'Carta d\'Identità',
      PASSAPORTO: 'Passaporto',
      PATENTE: 'Patente',
    }
    return labels[type] || type
  }

  // Verifica se il check-in è scaduto (data di check-in antecedente a oggi)
  const isOverdue = (checkIn: GuestCheckIn) => {
    if (checkIn.submittedToPolice) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Imposta a mezzanotte per confronto solo delle date

    const checkInDateStr = getCheckInDate(checkIn)
    const checkInDate = new Date(checkInDateStr)
    checkInDate.setHours(0, 0, 0, 0) // Imposta a mezzanotte per confronto solo delle date

    // Considera scaduto se la data di check-in è antecedente (prima) a oggi
    // Esempio: se oggi è il 10 gennaio e il check-in è il 9 gennaio o prima, è scaduto
    return checkInDate < today
  }

  // Conta check-in da comunicare (non comunicati e scaduti)
  const getPendingCount = () => {
    return checkIns.filter(c => !c.submittedToPolice && isOverdue(c)).length
  }

  // Aggiorna stato comunicazione
  const togglePoliceSubmission = async (checkInId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/guest-checkins/${checkInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submittedToPolice: !currentStatus }),
      })

      if (response.ok) {
        // Aggiorna la lista locale
        setCheckIns(checkIns.map(c =>
          c.id === checkInId
            ? { ...c, submittedToPolice: !currentStatus, submittedToPoliceAt: !currentStatus ? new Date().toISOString() : null }
            : c
        ))

        // Emetti evento per aggiornare il badge nel layout immediatamente
        window.dispatchEvent(new CustomEvent('checkInStatusUpdated'))
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-slate-900">Check-in Ospiti</h1>
            {getPendingCount() > 0 && (
              <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold animate-pulse">
                {getPendingCount()} da comunicare
              </span>
            )}
          </div>
          <p className="text-slate-600">
            Dati ospiti per registrazione Questura - {filteredCheckIns.length} check-in completati
          </p>
        </div>
        <div className="flex space-x-3">
          <a
            href="https://alloggiatiweb.poliziadistato.it/AlloggiatiWeb/Default.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-3 rounded-xl font-medium transition-all"
          >
            <ExternalLink size={20} />
            <span>Vai a Alloggiati Web</span>
          </a>
          <a
            href="https://osservatorioturistico.regione.sicilia.it/login/account/signin?ReturnUrl=%2flogin%2fissue%2fwsfed%3fwa%3dwsignin1.0%26wtrealm%3dhttps%253a%252f%252fregione.sicilia.turistat%252fapp%26wctx%3drm%253d0%2526id%253dpassive%2526ru%253d%25252fHome%26wct%3d2026-01-10T17%253a19%253a26Z%26wreply%3dhttps%253a%252f%252fosservatorioturistico.regione.sicilia.it%252fHome%252f&wa=wsignin1.0&wtrealm=https%3a%2f%2fregione.sicilia.turistat%2fapp&wctx=rm%3d0%26id%3dpassive%26ru%3d%252fHome&wct=2026-01-10T17%3a19%3a26Z&wreply=https%3a%2f%2fosservatorioturistico.regione.sicilia.it%2fHome%2f#/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-3 rounded-xl font-medium transition-all"
          >
            <ExternalLink size={20} />
            <span>Vai a Osservatorio Turistico</span>
          </a>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <FileSpreadsheet size={20} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium shadow-lg transition-all"
          >
            <FileText size={20} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="text-blue-600" size={20} />
          <h2 className="text-lg font-semibold text-slate-900">Filtri</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cerca per nome, cognome, CF, struttura..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <input
              type="date"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data inizio"
            />
          </div>
          <div>
            <input
              type="date"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Data fine"
            />
          </div>
        </div>
      </div>

      {/* Lista Check-in */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ospite
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Struttura
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Data Arrivo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Compilato il
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Stato Questura
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCheckIns.map((checkIn) => (
                <tr
                  key={checkIn.id}
                  className={`transition-colors ${isOverdue(checkIn)
                    ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500'
                    : 'hover:bg-slate-50'
                    }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {checkIn.firstName} {checkIn.lastName}
                        </p>
                        <p className="text-sm text-slate-600">{checkIn.fiscalCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{getPropertyName(checkIn)}</p>
                      <p className="text-sm text-slate-600">{getRoomName(checkIn)}</p>
                      <p className="text-xs text-slate-500">{getPropertyCity(checkIn)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-slate-400" size={16} />
                      <span className="text-slate-900">{formatDate(getCheckInDate(checkIn))}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {getDocumentTypeLabel(checkIn.documentType)}
                      </p>
                      <p className="text-xs text-slate-600">{checkIn.documentNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{formatDate(checkIn.submittedAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkIn.submittedToPolice}
                          onChange={() => togglePoliceSubmission(checkIn.id, checkIn.submittedToPolice)}
                          className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                        />
                        <span className={`text-sm font-medium ${checkIn.submittedToPolice ? 'text-green-600' : 'text-slate-600'}`}>
                          {checkIn.submittedToPolice ? 'Comunicato' : 'Da comunicare'}
                        </span>
                      </label>
                      {checkIn.submittedToPoliceAt && (
                        <span className="text-xs text-slate-500">
                          {formatDate(checkIn.submittedToPoliceAt)}
                        </span>
                      )}
                      {isOverdue(checkIn) && (
                        <span className="text-xs font-bold text-red-600">
                          ⚠ SCADUTO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedCheckIn(checkIn)
                        setShowDetailModal(true)
                      }}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Eye size={16} />
                      <span>Dettagli</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCheckIns.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">Nessun check-in trovato</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dettagli */}
      {showDetailModal && selectedCheckIn && (
        <DetailCheckInModal
          checkIn={selectedCheckIn}
          onClose={() => setShowDetailModal(false)}
          formatDate={formatDate}
          getDocumentTypeLabel={getDocumentTypeLabel}
          getPropertyName={getPropertyName}
          getRoomName={getRoomName}
          getCheckInDate={getCheckInDate}
          getCheckOutDate={getCheckOutDate}
        />
      )}
    </div>
  )
}

// Componente Modale Dettagli Check-in
function DetailCheckInModal({
  checkIn,
  onClose,
  formatDate,
  getDocumentTypeLabel,
  getPropertyName,
  getRoomName,
  getCheckInDate,
  getCheckOutDate,
}: {
  checkIn: GuestCheckIn
  onClose: () => void
  formatDate: (date: string) => string
  getDocumentTypeLabel: (type: string) => string
  getPropertyName: (c: GuestCheckIn) => string
  getRoomName: (c: GuestCheckIn) => string
  getCheckInDate: (c: GuestCheckIn) => string
  getCheckOutDate: (c: GuestCheckIn) => string
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Funzione per copiare testo in maiuscolo
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      const upperText = text.toUpperCase()
      await navigator.clipboard.writeText(upperText)
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
      className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-colors text-xs font-medium ${copiedField === fieldName
        ? 'bg-green-50 border-green-300 text-green-700'
        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
        }`}
    >
      <Copy size={12} />
      <span>{copiedField === fieldName ? 'Copiato!' : 'Copia'}</span>
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Dettagli Check-in</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
            title="Chiudi"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Dati Prenotazione */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <MapPin className="mr-2 text-blue-600" size={20} />
              Prenotazione
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Struttura</p>
                    <CopyButton text={getPropertyName(checkIn)} fieldName="property" />
                  </div>
                  <p className="font-medium text-slate-900">{getPropertyName(checkIn)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Stanza</p>
                    <CopyButton text={getRoomName(checkIn)} fieldName="room" />
                  </div>
                  <p className="font-medium text-slate-900">{getRoomName(checkIn)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Check-in</p>
                    <CopyButton text={formatDate(getCheckInDate(checkIn))} fieldName="checkIn" />
                  </div>
                  <p className="font-medium text-slate-900">{formatDate(getCheckInDate(checkIn))}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Check-out</p>
                    <CopyButton text={formatDate(getCheckOutDate(checkIn))} fieldName="checkOut" />
                  </div>
                  <p className="font-medium text-slate-900">{formatDate(getCheckOutDate(checkIn))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dati Personali */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <User className="mr-2 text-blue-600" size={20} />
              Dati Personali
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Nome</p>
                    <CopyButton text={checkIn.firstName} fieldName="firstName" />
                  </div>
                  <p className="font-medium text-slate-900">{checkIn.firstName}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Cognome</p>
                    <CopyButton text={checkIn.lastName} fieldName="lastName" />
                  </div>
                  <p className="font-medium text-slate-900">{checkIn.lastName}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Data di Nascita</p>
                    <CopyButton text={formatDate(checkIn.dateOfBirth)} fieldName="dateOfBirth" />
                  </div>
                  <p className="font-medium text-slate-900">{formatDate(checkIn.dateOfBirth)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Luogo di Nascita</p>
                    <CopyButton text={`${checkIn.birthCity} (${checkIn.birthProvince})`} fieldName="birthPlace" />
                  </div>
                  <p className="font-medium text-slate-900">{checkIn.birthCity} ({checkIn.birthProvince})</p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Indirizzo Residenza</p>
                    <CopyButton text={`${checkIn.residenceStreet}, ${checkIn.residencePostalCode} ${checkIn.residenceCity} (${checkIn.residenceProvince})`} fieldName="residence" />
                  </div>
                  <p className="font-medium text-slate-900">
                    {checkIn.residenceStreet}, {checkIn.residencePostalCode} {checkIn.residenceCity} ({checkIn.residenceProvince})
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Codice Fiscale</p>
                    <CopyButton text={checkIn.fiscalCode} fieldName="fiscalCode" />
                  </div>
                  <p className="font-medium text-slate-900">{checkIn.fiscalCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documento */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              <CreditCard className="mr-2 text-blue-600" size={20} />
              Documento Identità
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Tipo Documento</p>
                    <CopyButton text={getDocumentTypeLabel(checkIn.documentType)} fieldName="documentType" />
                  </div>
                  <p className="font-medium text-slate-900">
                    {getDocumentTypeLabel(checkIn.documentType)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Numero Documento</p>
                    <CopyButton text={checkIn.documentNumber} fieldName="documentNumber" />
                  </div>
                  <p className="font-medium text-slate-900">{checkIn.documentNumber}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Data Rilascio</p>
                    <CopyButton text={formatDate(checkIn.documentIssueDate)} fieldName="documentIssueDate" />
                  </div>
                  <p className="font-medium text-slate-900">
                    {formatDate(checkIn.documentIssueDate)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-600">Data Scadenza</p>
                    <CopyButton text={formatDate(checkIn.documentExpiryDate)} fieldName="documentExpiryDate" />
                  </div>
                  <p className="font-medium text-slate-900">
                    {formatDate(checkIn.documentExpiryDate)}
                  </p>
                </div>
              </div>

              {/* Immagini Documento */}
              {(checkIn.documentFrontUrl || checkIn.documentBackUrl) && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Foto Documento</p>
                  <div className="grid grid-cols-2 gap-4">
                    {checkIn.documentFrontUrl && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Fronte</p>
                        <img
                          src={checkIn.documentFrontUrl}
                          alt="Fronte documento"
                          className="w-full rounded-lg border border-slate-300"
                        />
                      </div>
                    )}
                    {checkIn.documentBackUrl && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Retro</p>
                        <img
                          src={checkIn.documentBackUrl}
                          alt="Retro documento"
                          className="w-full rounded-lg border border-slate-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Screenshot Pagamento Tassa di Soggiorno */}
              {checkIn.booking?.touristTaxPaymentProof && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="text-green-600" size={20} />
                    <p className="font-bold text-slate-900">Screenshot Pagamento Tassa di Soggiorno</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <img
                      src={checkIn.booking?.touristTaxPaymentProof || ''}
                      alt="Conferma pagamento tassa di soggiorno"
                      className="w-full max-w-md mx-auto rounded-lg border-2 border-green-300 shadow-lg"
                    />
                    <p className="text-xs text-green-700 text-center mt-2">
                      ✓ Prova di pagamento caricata dall'ospite
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
