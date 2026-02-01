'use client'

import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Calendar, User, MapPin, CreditCard, Eye, Search, Filter, Copy, X, ExternalLink, CheckCircle2, AlertTriangle, Clock, Edit3, Trash2, ChevronDown, Users, Shield, Mail, Phone } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GuestCheckIn {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  email: string | null
  phone: string | null
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
  isExempt: boolean
  exemptionReason: string | null
  touristTaxPaymentProof: string | null
  submittedAt: string
  submittedToPolice: boolean
  submittedToPoliceAt: string | null
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCheckIn, setEditingCheckIn] = useState<GuestCheckIn | null>(null)
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCheckIns()
  }, [])

  useEffect(() => {
    filterCheckIns()
  }, [checkIns, searchTerm, startDate, endDate, statusFilter])

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

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fiscalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getPropertyName(c).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

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

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_police') {
        filtered = filtered.filter(c => !c.submittedToPolice && isOverdue(c))
      } else if (statusFilter === 'submitted') {
        filtered = filtered.filter(c => c.submittedToPolice)
      } else {
        filtered = filtered.filter(c => c.status === statusFilter)
      }
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

    doc.setFontSize(18)
    doc.text('Registro Check-in Ospiti', 14, 15)

    doc.setFontSize(10)
    doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 14, 22)
    doc.text(`Totale ospiti: ${filteredCheckIns.length}`, 14, 27)

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

  const isOverdue = (checkIn: GuestCheckIn) => {
    if (checkIn.submittedToPolice) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkInDateStr = getCheckInDate(checkIn)
    const checkInDate = new Date(checkInDateStr)
    checkInDate.setHours(0, 0, 0, 0)

    return checkInDate < today
  }

  const getPendingCount = () => {
    return checkIns.filter(c => !c.submittedToPolice && isOverdue(c)).length
  }

  const getSubmittedCount = () => {
    return checkIns.filter(c => c.submittedToPolice).length
  }

  const togglePoliceSubmission = async (checkInId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/guest-checkins/${checkInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submittedToPolice: !currentStatus }),
      })

      if (response.ok) {
        setCheckIns(checkIns.map(c =>
          c.id === checkInId
            ? { ...c, submittedToPolice: !currentStatus, submittedToPoliceAt: !currentStatus ? new Date().toISOString() : null }
            : c
        ))
        window.dispatchEvent(new CustomEvent('checkInStatusUpdated'))
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
    }
  }

  const handleDelete = async (checkIn: GuestCheckIn) => {
    if (!confirm(`Sei sicuro di voler eliminare il check-in di ${checkIn.firstName} ${checkIn.lastName}? Questa azione non può essere annullata.`)) {
      return
    }

    try {
      const response = await fetch(`/api/guest-checkins/${checkIn.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCheckIns(checkIns.filter(c => c.id !== checkIn.id))
        window.dispatchEvent(new CustomEvent('checkInStatusUpdated'))
      } else {
        alert('Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      alert('Errore durante l\'eliminazione')
    }
  }

  const openEditModal = (checkIn: GuestCheckIn) => {
    setEditingCheckIn({ ...checkIn })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCheckIn) return

    setSaving(true)
    try {
      const response = await fetch(`/api/guest-checkins/${editingCheckIn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCheckIn),
      })

      if (response.ok) {
        setCheckIns(checkIns.map(c => c.id === editingCheckIn.id ? editingCheckIn : c))
        setShowEditModal(false)
        setEditingCheckIn(null)
      } else {
        alert('Errore durante il salvataggio')
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'In Attesa', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconColor: 'text-amber-500' }
      case 'APPROVED':
        return { label: 'Approvato', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconColor: 'text-emerald-500' }
      case 'REJECTED':
        return { label: 'Rifiutato', icon: X, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', iconColor: 'text-red-500' }
      default:
        return { label: status, icon: Clock, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', iconColor: 'text-gray-500' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento check-in...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header con statistiche */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3d4a3c] via-[#4a5a49] to-[#3d4a3c] rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Check-in Ospiti</h1>
              <p className="text-[#d4cdb0] text-lg">
                Gestione dati ospiti per registrazione Questura
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
                    <p className="text-2xl font-bold">{checkIns.length}</p>
                    <p className="text-xs text-[#d4cdb0]">Totale</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-400/30 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getSubmittedCount()}</p>
                    <p className="text-xs text-[#d4cdb0]">Comunicati</p>
                  </div>
                </div>
              </div>

              {getPendingCount() > 0 && (
                <div className="bg-red-500/30 backdrop-blur-sm rounded-2xl px-5 py-3 border border-red-400/30 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-400/30 rounded-xl">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getPendingCount()}</p>
                      <p className="text-xs text-red-100">Da comunicare</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Cerca ospite, CF, struttura..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
              showFilters
                ? 'bg-[#d4cdb0]/30 text-[#3d4a3c] shadow-inner border border-[#3d4a3c]/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow-md'
            }`}
          >
            <Filter size={18} />
            <span>Filtri</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <a
            href="https://alloggiatiweb.poliziadistato.it/AlloggiatiWeb/Default.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-[#3d4a3c] border border-[#3d4a3c]/20 hover:bg-[#d4cdb0]/20 px-4 py-3 rounded-2xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Shield size={18} />
            <span className="hidden sm:inline">Alloggiati Web</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-3 rounded-2xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-3 rounded-2xl font-medium shadow-lg shadow-rose-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data inizio</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data fine</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stato</label>
              <select
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="pending_police">Da comunicare</option>
                <option value="submitted">Comunicati</option>
                <option value="PENDING">In attesa approvazione</option>
                <option value="APPROVED">Approvati</option>
                <option value="REJECTED">Rifiutati</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setStatusFilter('all')
                  setSearchTerm('')
                }}
                className="w-full px-4 py-2.5 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Azzera filtri
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Cards Grid */}
      {filteredCheckIns.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Nessun check-in trovato</h3>
          <p className="text-slate-500">Prova a modificare i filtri di ricerca</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCheckIns.map((checkIn, index) => {
            const statusConfig = getStatusConfig(checkIn.status)
            const StatusIcon = statusConfig.icon
            const overdueStatus = isOverdue(checkIn)

            return (
              <div
                key={checkIn.id}
                className={`group bg-white rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  overdueStatus
                    ? 'border-l-4 border-l-red-500 border-red-100'
                    : 'border-slate-100 hover:border-[#3d4a3c]/20'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Avatar & Main Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        overdueStatus
                          ? 'bg-gradient-to-br from-red-500 to-rose-600'
                          : 'bg-gradient-to-br from-[#3d4a3c] to-[#4a5a49]'
                      }`}>
                        {checkIn.firstName.charAt(0)}{checkIn.lastName.charAt(0)}
                        {checkIn.submittedToPolice && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 text-lg truncate">
                            {checkIn.firstName} {checkIn.lastName}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                            <StatusIcon size={12} className={statusConfig.iconColor} />
                            {statusConfig.label}
                          </span>
                          {overdueStatus && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                              <AlertTriangle size={12} />
                              SCADUTO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 font-mono">{checkIn.fiscalCode}</p>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                      <MapPin size={18} className="text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{getPropertyName(checkIn)}</p>
                        <p className="text-xs text-slate-500">{getRoomName(checkIn)} - {getPropertyCity(checkIn)}</p>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-[#d4cdb0]/20 rounded-xl">
                      <Calendar size={18} className="text-[#3d4a3c] flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900">{formatDate(getCheckInDate(checkIn))}</p>
                        <p className="text-xs text-slate-500">Check-in</p>
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-xl">
                      <CreditCard size={18} className="text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{getDocumentTypeLabel(checkIn.documentType)}</p>
                        <p className="text-xs text-slate-500 font-mono">{checkIn.documentNumber}</p>
                      </div>
                    </div>

                    {/* Police Status Toggle */}
                    <div className="flex items-center">
                      <button
                        onClick={() => togglePoliceSubmission(checkIn.id, checkIn.submittedToPolice)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          checkIn.submittedToPolice
                            ? 'bg-emerald-500 focus:ring-emerald-500'
                            : 'bg-slate-300 focus:ring-slate-400'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          checkIn.submittedToPolice ? 'translate-x-8' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCheckIn(checkIn)
                          setShowDetailModal(true)
                        }}
                        className="p-2.5 text-slate-400 hover:text-[#3d4a3c] hover:bg-[#d4cdb0]/20 rounded-xl transition-all duration-200"
                        title="Visualizza dettagli"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => openEditModal(checkIn)}
                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
                        title="Modifica"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(checkIn)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Elimina"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Results count */}
      {filteredCheckIns.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Visualizzati <span className="font-semibold text-slate-700">{filteredCheckIns.length}</span> di <span className="font-semibold text-slate-700">{checkIns.length}</span> check-in
        </div>
      )}

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

      {/* Modal Modifica */}
      {showEditModal && editingCheckIn && (
        <EditCheckInModal
          checkIn={editingCheckIn}
          setCheckIn={setEditingCheckIn}
          onClose={() => { setShowEditModal(false); setEditingCheckIn(null); }}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}
    </div>
  )
}

// Componente Modal Modifica
function EditCheckInModal({
  checkIn,
  setCheckIn,
  onClose,
  onSave,
  saving,
}: {
  checkIn: GuestCheckIn
  setCheckIn: (c: GuestCheckIn) => void
  onClose: () => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Edit3 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Modifica Check-in</h2>
                <p className="text-[#d4cdb0] text-sm">{checkIn.firstName} {checkIn.lastName}</p>
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
            {/* Status */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Stato Richiesta</label>
              <div className="flex gap-3">
                {['PENDING', 'APPROVED', 'REJECTED'].map((status) => {
                  const config = {
                    PENDING: { label: 'In Attesa', icon: Clock, color: 'amber' },
                    APPROVED: { label: 'Approvato', icon: CheckCircle2, color: 'emerald' },
                    REJECTED: { label: 'Rifiutato', icon: X, color: 'red' },
                  }[status]!
                  const Icon = config.icon
                  const isSelected = checkIn.status === status

                  return (
                    <button
                      key={status}
                      onClick={() => setCheckIn({ ...checkIn, status: status as any })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `bg-${config.color}-50 border-${config.color}-500 text-${config.color}-700`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                      style={isSelected ? {
                        backgroundColor: config.color === 'amber' ? '#fffbeb' : config.color === 'emerald' ? '#ecfdf5' : '#fef2f2',
                        borderColor: config.color === 'amber' ? '#f59e0b' : config.color === 'emerald' ? '#10b981' : '#ef4444',
                        color: config.color === 'amber' ? '#b45309' : config.color === 'emerald' ? '#047857' : '#b91c1c',
                      } : {}}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contatti */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-[#3d4a3c]" />
                Contatti
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={checkIn.email || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Telefono</label>
                  <input
                    type="tel"
                    value={checkIn.phone || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dati Anagrafici */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <User size={16} className="text-[#3d4a3c]" />
                Dati Anagrafici
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={checkIn.firstName}
                    onChange={(e) => setCheckIn({ ...checkIn, firstName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Cognome</label>
                  <input
                    type="text"
                    value={checkIn.lastName}
                    onChange={(e) => setCheckIn({ ...checkIn, lastName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Codice Fiscale</label>
                  <input
                    type="text"
                    value={checkIn.fiscalCode}
                    onChange={(e) => setCheckIn({ ...checkIn, fiscalCode: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase font-mono focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Data di Nascita</label>
                  <input
                    type="date"
                    value={checkIn.dateOfBirth?.split('T')[0] || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, dateOfBirth: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Città di Nascita</label>
                  <input
                    type="text"
                    value={checkIn.birthCity}
                    onChange={(e) => setCheckIn({ ...checkIn, birthCity: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Provincia di Nascita</label>
                  <input
                    type="text"
                    value={checkIn.birthProvince}
                    onChange={(e) => setCheckIn({ ...checkIn, birthProvince: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Residenza */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#3d4a3c]" />
                Residenza
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Indirizzo</label>
                  <input
                    type="text"
                    value={checkIn.residenceStreet}
                    onChange={(e) => setCheckIn({ ...checkIn, residenceStreet: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">CAP</label>
                  <input
                    type="text"
                    value={checkIn.residencePostalCode}
                    onChange={(e) => setCheckIn({ ...checkIn, residencePostalCode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Città</label>
                  <input
                    type="text"
                    value={checkIn.residenceCity}
                    onChange={(e) => setCheckIn({ ...checkIn, residenceCity: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Provincia</label>
                  <input
                    type="text"
                    value={checkIn.residenceProvince}
                    onChange={(e) => setCheckIn({ ...checkIn, residenceProvince: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Documento */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-[#3d4a3c]" />
                Documento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo Documento</label>
                  <select
                    value={checkIn.documentType}
                    onChange={(e) => setCheckIn({ ...checkIn, documentType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  >
                    <option value="CARTA_IDENTITA">Carta d'Identità</option>
                    <option value="PASSAPORTO">Passaporto</option>
                    <option value="PATENTE">Patente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Numero Documento</label>
                  <input
                    type="text"
                    value={checkIn.documentNumber}
                    onChange={(e) => setCheckIn({ ...checkIn, documentNumber: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 uppercase font-mono focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Data Rilascio</label>
                  <input
                    type="date"
                    value={checkIn.documentIssueDate?.split('T')[0] || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, documentIssueDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Data Scadenza</label>
                  <input
                    type="date"
                    value={checkIn.documentExpiryDate?.split('T')[0] || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, documentExpiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Esenzione */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={checkIn.isExempt}
                    onChange={(e) => setCheckIn({ ...checkIn, isExempt: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${checkIn.isExempt ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 translate-y-1 ${checkIn.isExempt ? 'translate-x-6' : 'translate-x-1'}`}></div>
                  </div>
                </div>
                <span className="font-medium text-slate-900">Esente dalla tassa di soggiorno</span>
              </label>

              {checkIn.isExempt && (
                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Motivo Esenzione</label>
                  <select
                    value={checkIn.exemptionReason || ''}
                    onChange={(e) => setCheckIn({ ...checkIn, exemptionReason: e.target.value })}
                    className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seleziona motivo...</option>
                    <option value="MINORE_14">Minore di 14 anni</option>
                    <option value="RESIDENTE">Residente nel Comune</option>
                    <option value="ACCOMPAGNATORE_PAZIENTE">Accompagnatore paziente</option>
                    <option value="FORZE_ORDINE">Forze dell'ordine</option>
                    <option value="DISABILE">Persona con disabilità</option>
                    <option value="AUTISTA_PULLMAN">Autista pullman</option>
                    <option value="ALTRO">Altro</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            Annulla
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] hover:from-[#4a5a49] hover:to-[#5a6a59] text-white rounded-xl font-medium shadow-lg shadow-[#3d4a3c]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </div>
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
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200 text-xs font-medium ${
        copiedField === fieldName
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 scale-95'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {copiedField === fieldName ? (
        <>
          <CheckCircle2 size={12} />
          Copiato!
        </>
      ) : (
        <>
          <Copy size={12} />
          Copia
        </>
      )}
    </button>
  )

  const DataRow = ({ label, value, fieldName, mono = false }: { label: string; value: string; fieldName: string; mono?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
        <CopyButton text={value} fieldName={fieldName} />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3d4a3c] to-[#4a5a49] px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                {checkIn.firstName.charAt(0)}{checkIn.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{checkIn.firstName} {checkIn.lastName}</h2>
                <p className="text-[#d4cdb0] font-mono">{checkIn.fiscalCode}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Prenotazione */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MapPin size={16} className="text-[#3d4a3c]" />
                </div>
                Prenotazione
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Struttura</p>
                  <p className="font-medium text-slate-900">{getPropertyName(checkIn)}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Stanza</p>
                  <p className="font-medium text-slate-900">{getRoomName(checkIn)}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Check-in</p>
                  <p className="font-medium text-slate-900">{formatDate(getCheckInDate(checkIn))}</p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Check-out</p>
                  <p className="font-medium text-slate-900">{formatDate(getCheckOutDate(checkIn))}</p>
                </div>
              </div>
            </div>

            {/* Dati Personali */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <User size={16} className="text-[#3d4a3c]" />
                  Dati Personali
                </h3>
              </div>
              <div className="p-5">
                <DataRow label="Nome" value={checkIn.firstName} fieldName="firstName" />
                <DataRow label="Cognome" value={checkIn.lastName} fieldName="lastName" />
                <DataRow label="Data di Nascita" value={formatDate(checkIn.dateOfBirth)} fieldName="dateOfBirth" />
                <DataRow label="Luogo di Nascita" value={`${checkIn.birthCity} (${checkIn.birthProvince})`} fieldName="birthPlace" />
                <DataRow label="Codice Fiscale" value={checkIn.fiscalCode} fieldName="fiscalCode" mono />
                <DataRow label="Residenza" value={`${checkIn.residenceStreet}, ${checkIn.residencePostalCode} ${checkIn.residenceCity} (${checkIn.residenceProvince})`} fieldName="residence" />
                {checkIn.email && <DataRow label="Email" value={checkIn.email} fieldName="email" />}
                {checkIn.phone && <DataRow label="Telefono" value={checkIn.phone} fieldName="phone" />}
              </div>
            </div>

            {/* Documento */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-[#3d4a3c]" />
                  Documento Identità
                </h3>
              </div>
              <div className="p-5">
                <DataRow label="Tipo Documento" value={getDocumentTypeLabel(checkIn.documentType)} fieldName="documentType" />
                <DataRow label="Numero" value={checkIn.documentNumber} fieldName="documentNumber" mono />
                <DataRow label="Data Rilascio" value={formatDate(checkIn.documentIssueDate)} fieldName="documentIssueDate" />
                <DataRow label="Data Scadenza" value={formatDate(checkIn.documentExpiryDate)} fieldName="documentExpiryDate" />
              </div>

              {/* Immagini Documento */}
              {(checkIn.documentFrontUrl || checkIn.documentBackUrl) && (
                <div className="px-5 pb-5">
                  <p className="text-sm font-medium text-slate-700 mb-3">Foto Documento</p>
                  <div className="grid grid-cols-2 gap-4">
                    {checkIn.documentFrontUrl && (
                      <div className="group relative">
                        <p className="text-xs text-slate-500 mb-2">Fronte</p>
                        <img
                          src={checkIn.documentFrontUrl}
                          alt="Fronte documento"
                          className="w-full rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.open(checkIn.documentFrontUrl!, '_blank')}
                        />
                      </div>
                    )}
                    {checkIn.documentBackUrl && (
                      <div className="group relative">
                        <p className="text-xs text-slate-500 mb-2">Retro</p>
                        <img
                          src={checkIn.documentBackUrl}
                          alt="Retro documento"
                          className="w-full rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.open(checkIn.documentBackUrl!, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tassa di Soggiorno */}
            {(checkIn.isExempt || checkIn.touristTaxPaymentProof || checkIn.booking?.touristTaxPaymentProof) && (
              <div className={`rounded-2xl p-5 border ${checkIn.isExempt ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard size={16} className={checkIn.isExempt ? 'text-emerald-600' : 'text-amber-600'} />
                  Tassa di Soggiorno
                </h3>

                {checkIn.isExempt ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700">ESENTE</p>
                      {checkIn.exemptionReason && (
                        <p className="text-sm text-emerald-600">{checkIn.exemptionReason}</p>
                      )}
                    </div>
                  </div>
                ) : (checkIn.touristTaxPaymentProof || checkIn.booking?.touristTaxPaymentProof) ? (
                  <div>
                    <p className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Prova di pagamento caricata
                    </p>
                    <img
                      src={checkIn.touristTaxPaymentProof || checkIn.booking?.touristTaxPaymentProof || ''}
                      alt="Conferma pagamento"
                      className="max-w-md rounded-xl border border-amber-300 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                      onClick={() => window.open(checkIn.touristTaxPaymentProof || checkIn.booking?.touristTaxPaymentProof!, '_blank')}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
