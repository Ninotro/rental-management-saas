'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Home,
  Bed,
  Info,
  Copy,
  Mail,
  Phone,
  X,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShieldX
} from 'lucide-react'

interface Property {
  id: string
  name: string
  city: string
  rooms: Room[]
}

interface Room {
  id: string
  name: string
  type: string
}

interface RoomMessage {
  id: string
  roomId: string
  type: 'CHECK_IN_INSTRUCTIONS' | 'WELCOME' | 'CHECKOUT' | 'CUSTOM'
  name: string
  subject: string | null
  messageText: string
  trigger: 'ON_CONFIRMATION' | 'BEFORE_CHECKIN' | 'ON_CHECKIN_DAY' | 'AFTER_CHECKIN' | 'BEFORE_CHECKOUT' | 'ON_CHECKOUT_DAY' | 'MANUAL'
  triggerOffsetHours: number
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH'
  sendTime: string | null
  twilioContentSid: string | null
  twilioApprovalStatus: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const MESSAGE_TYPES = [
  { value: 'CHECK_IN_INSTRUCTIONS', label: 'Istruzioni Check-in', description: 'Istruzioni per l\'ingresso nella struttura' },
  { value: 'WELCOME', label: 'Benvenuto', description: 'Messaggio di benvenuto all\'arrivo' },
  { value: 'CHECKOUT', label: 'Checkout', description: 'Istruzioni per il checkout' },
  { value: 'CUSTOM', label: 'Personalizzato', description: 'Messaggio personalizzato' },
]

const MESSAGE_TRIGGERS = [
  { value: 'MANUAL', label: 'Manuale', description: 'Invio manuale tramite tasto' },
  { value: 'ON_CONFIRMATION', label: 'Alla conferma', description: 'Quando la prenotazione viene confermata' },
  { value: 'BEFORE_CHECKIN', label: 'Prima del check-in', description: 'X ore/giorni prima del check-in' },
  { value: 'ON_CHECKIN_DAY', label: 'Giorno check-in', description: 'Il giorno del check-in' },
  { value: 'AFTER_CHECKIN', label: 'Dopo check-in', description: 'Dopo il check-in effettivo' },
  { value: 'BEFORE_CHECKOUT', label: 'Prima del check-out', description: 'X ore/giorni prima del check-out' },
  { value: 'ON_CHECKOUT_DAY', label: 'Giorno check-out', description: 'Il giorno del check-out' },
]

const MESSAGE_CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: 'Mail' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'Phone' },
  { value: 'BOTH', label: 'Entrambi', icon: 'MessageSquare' },
]

const OFFSET_OPTIONS = [
  { value: -168, label: '1 settimana prima' },
  { value: -72, label: '3 giorni prima' },
  { value: -48, label: '2 giorni prima' },
  { value: -24, label: '1 giorno prima' },
  { value: -12, label: '12 ore prima' },
  { value: -6, label: '6 ore prima' },
  { value: -2, label: '2 ore prima' },
  { value: 0, label: 'Al momento' },
  { value: 2, label: '2 ore dopo' },
  { value: 24, label: '1 giorno dopo' },
]

const AVAILABLE_VARIABLES = [
  { variable: '{guest_name}', description: 'Nome dell\'ospite' },
  { variable: '{property_name}', description: 'Nome della struttura' },
  { variable: '{room_name}', description: 'Nome della stanza' },
  { variable: '{check_in_date}', description: 'Data di check-in' },
  { variable: '{check_out_date}', description: 'Data di check-out' },
]

export default function RoomMessagesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [checkingApproval, setCheckingApproval] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingMessage, setEditingMessage] = useState<RoomMessage | null>(null)
  const [formData, setFormData] = useState({
    type: 'CHECK_IN_INSTRUCTIONS' as RoomMessage['type'],
    name: '',
    subject: '',
    messageText: '',
    trigger: 'MANUAL' as RoomMessage['trigger'],
    triggerOffsetHours: 0,
    channel: 'EMAIL' as RoomMessage['channel'],
    sendTime: '',
    isActive: true,
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [selectedRoomId])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
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

  const fetchMessages = async () => {
    if (!selectedRoomId) return

    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/rooms/${selectedRoomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedRoom = selectedProperty?.rooms?.find(r => r.id === selectedRoomId)

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
    setSelectedRoomId('')
    setMessages([])
  }

  const openCreateModal = () => {
    setEditingMessage(null)
    setFormData({
      type: 'CHECK_IN_INSTRUCTIONS',
      name: 'Istruzioni Check-in',
      subject: 'Istruzioni per il tuo arrivo',
      messageText: `Ciao {guest_name}!

Benvenuto/a presso {property_name}!

Ecco le istruzioni per il tuo arrivo:

**Data check-in:** {check_in_date}
**Data check-out:** {check_out_date}

Se hai bisogno di assistenza, non esitare a contattarci.

A presto!`,
      trigger: 'MANUAL',
      triggerOffsetHours: 0,
      channel: 'EMAIL',
      sendTime: '',
      isActive: true,
    })
    setShowModal(true)
  }

  const openEditModal = (message: RoomMessage) => {
    setEditingMessage(message)
    setFormData({
      type: message.type,
      name: message.name,
      subject: message.subject || '',
      messageText: message.messageText,
      trigger: message.trigger || 'MANUAL',
      triggerOffsetHours: message.triggerOffsetHours || 0,
      channel: message.channel || 'EMAIL',
      sendTime: message.sendTime || '',
      isActive: message.isActive,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMessage(null)
    setError('')
  }

  const handleSave = async () => {
    if (!selectedRoomId) return

    setSaving(true)
    setError('')

    try {
      const url = editingMessage
        ? `/api/rooms/${selectedRoomId}/messages/${editingMessage.id}`
        : `/api/rooms/${selectedRoomId}/messages`

      const method = editingMessage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(editingMessage ? 'Messaggio aggiornato!' : 'Messaggio creato!')
        setTimeout(() => setSuccess(''), 3000)
        closeModal()
        fetchMessages()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore nel salvataggio')
      }
    } catch (err) {
      setError('Errore di connessione')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) return

    try {
      const response = await fetch(`/api/rooms/${selectedRoomId}/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Messaggio eliminato!')
        setTimeout(() => setSuccess(''), 3000)
        fetchMessages()
      }
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setSuccess(`Copiato: ${variable}`)
    setTimeout(() => setSuccess(''), 2000)
  }

  const getMessageTypeLabel = (type: string) => {
    return MESSAGE_TYPES.find(t => t.value === type)?.label || type
  }

  const checkApprovalStatus = async (messageId: string) => {
    setCheckingApproval(messageId)
    try {
      const response = await fetch(`/api/rooms/${selectedRoomId}/messages/${messageId}/check-approval`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setSuccess(`Stato template: ${data.status}`)
        setTimeout(() => setSuccess(''), 3000)
        fetchMessages() // Ricarica per aggiornare lo stato
      }
    } catch (err) {
      console.error('Error checking approval:', err)
    } finally {
      setCheckingApproval(null)
    }
  }

  const getApprovalStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <ShieldCheck size={12} className="mr-1" />
            Approvato
          </span>
        )
      case 'pending':
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <Clock size={12} className="mr-1" />
            In attesa
          </span>
        )
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <ShieldX size={12} className="mr-1" />
            Rifiutato
          </span>
        )
      case 'error':
        return (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <AlertCircle size={12} className="mr-1" />
            Errore
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <MessageSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3d4a3c] to-[#2d3a2c] rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <MessageSquare size={32} />
          <h1 className="text-3xl font-bold">Messaggi Stanze</h1>
        </div>
        <p className="text-white/80">
          Configura i messaggi personalizzati da inviare agli ospiti per ogni stanza
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center animate-in fade-in">
          <CheckCircle size={20} className="mr-3 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {/* Selection */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <Home size={20} className="mr-2 text-[#3d4a3c]" />
          Seleziona Stanza
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Struttura</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent"
            >
              <option value="">Seleziona struttura...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stanza</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              disabled={!selectedPropertyId}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">Seleziona stanza...</option>
              {selectedProperty?.rooms?.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {selectedRoomId && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Bed size={20} className="mr-2 text-[#3d4a3c]" />
              Messaggi per: {selectedRoom?.name}
            </h2>
            <button
              onClick={openCreateModal}
              className="bg-[#3d4a3c] hover:bg-[#2d3a2c] text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <Plus size={18} />
              <span>Nuovo Messaggio</span>
            </button>
          </div>

          {loadingMessages ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d4a3c] mx-auto"></div>
              <p className="mt-2 text-slate-600">Caricamento messaggi...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <MessageSquare size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 font-medium">Nessun messaggio configurato</p>
              <p className="text-slate-500 text-sm mt-1">Crea il primo messaggio per questa stanza</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`border rounded-xl p-4 ${message.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="bg-[#3d4a3c]/10 text-[#3d4a3c] text-xs font-medium px-2 py-1 rounded-full">
                          {getMessageTypeLabel(message.type)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          message.channel === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
                          message.channel === 'WHATSAPP' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {message.channel === 'EMAIL' ? 'Email' : message.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email + WhatsApp'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          message.trigger === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {MESSAGE_TRIGGERS.find(t => t.value === message.trigger)?.label || 'Manuale'}
                          {message.trigger !== 'MANUAL' && message.triggerOffsetHours !== 0 && (
                            <span className="ml-1">
                              ({OFFSET_OPTIONS.find(o => o.value === message.triggerOffsetHours)?.label || `${message.triggerOffsetHours}h`})
                            </span>
                          )}
                        </span>
                        {!message.isActive && (
                          <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                            Disattivo
                          </span>
                        )}
                        {/* Stato template WhatsApp */}
                        {(message.channel === 'WHATSAPP' || message.channel === 'BOTH') && message.twilioApprovalStatus && (
                          getApprovalStatusBadge(message.twilioApprovalStatus)
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{message.name}</h3>
                      {message.subject && (
                        <p className="text-sm text-slate-600 mt-1">
                          <Mail size={14} className="inline mr-1" />
                          Oggetto: {message.subject}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                        {message.messageText.substring(0, 150)}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Pulsante per controllare stato template WhatsApp */}
                      {(message.channel === 'WHATSAPP' || message.channel === 'BOTH') && message.twilioContentSid && (
                        <button
                          onClick={() => checkApprovalStatus(message.id)}
                          disabled={checkingApproval === message.id}
                          className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Controlla stato approvazione"
                        >
                          <RefreshCw size={18} className={checkingApproval === message.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(message)}
                        className="p-2 text-slate-600 hover:text-[#3d4a3c] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Variables Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <Info size={20} className="mr-2" />
          Variabili Disponibili
        </h3>
        <p className="text-blue-800 text-sm mb-4">
          Usa queste variabili nei tuoi messaggi. Verranno sostituite automaticamente con i dati reali.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {AVAILABLE_VARIABLES.map(v => (
            <button
              key={v.variable}
              onClick={() => copyVariable(v.variable)}
              className="bg-white border border-blue-200 rounded-lg p-2 text-left hover:bg-blue-100 transition-colors group"
              title={`Clicca per copiare: ${v.variable}`}
            >
              <code className="text-blue-700 text-sm font-mono">{v.variable}</code>
              <p className="text-xs text-slate-600 mt-1">{v.description}</p>
              <Copy size={12} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-blue-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingMessage ? 'Modifica Messaggio' : 'Nuovo Messaggio'}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-center">
                  <AlertCircle size={18} className="mr-2" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo Messaggio</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RoomMessage['type'] })}
                  disabled={!!editingMessage}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 disabled:bg-slate-100"
                >
                  {MESSAGE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label} - {t.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Messaggio *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Istruzioni Check-in Villa Rosa"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Oggetto Email
                  <span className="text-slate-500 text-xs ml-2">(usato se invii via email)</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="es. Istruzioni per il tuo arrivo"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Testo Messaggio *</label>
                <textarea
                  value={formData.messageText}
                  onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
                  rows={12}
                  placeholder="Scrivi il tuo messaggio qui. Puoi usare le variabili come {guest_name}, {property_name}, etc."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 font-mono text-sm"
                />
              </div>

              {/* Sezione Automazione Invio */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Mail size={18} className="mr-2 text-[#3d4a3c]" />
                  Configurazione Invio
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Canale di invio</label>
                    <select
                      value={formData.channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value as RoomMessage['channel'] })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                    >
                      {MESSAGE_CHANNELS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quando inviare</label>
                    <select
                      value={formData.trigger}
                      onChange={(e) => setFormData({ ...formData, trigger: e.target.value as RoomMessage['trigger'] })}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                    >
                      {MESSAGE_TRIGGERS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.trigger !== 'MANUAL' && formData.trigger !== 'ON_CONFIRMATION' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Anticipo/Ritardo</label>
                      <select
                        value={formData.triggerOffsetHours}
                        onChange={(e) => setFormData({ ...formData, triggerOffsetHours: parseInt(e.target.value) })}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                      >
                        {OFFSET_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ora specifica
                        <span className="text-slate-500 text-xs ml-1">(opzionale)</span>
                      </label>
                      <input
                        type="time"
                        value={formData.sendTime}
                        onChange={(e) => setFormData({ ...formData, sendTime: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                      />
                    </div>
                  </div>
                )}

                {formData.trigger === 'MANUAL' && (
                  <p className="text-sm text-slate-500 mt-3 bg-slate-50 p-3 rounded-lg">
                    Il messaggio verra inviato manualmente dalla pagina prenotazioni cliccando sul tasto "Invia messaggio".
                  </p>
                )}

                {(formData.channel === 'WHATSAPP' || formData.channel === 'BOTH') && !editingMessage && (
                  <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-medium text-green-800 flex items-center mb-2">
                      <Phone size={16} className="mr-2" />
                      Template WhatsApp
                    </h4>
                    <p className="text-sm text-green-700">
                      Quando salvi, il messaggio verrà automaticamente inviato a WhatsApp per l'approvazione come template.
                      L'approvazione richiede solitamente da 5 minuti a 24 ore.
                      Una volta approvato, potrai inviare questo messaggio agli ospiti anche se non hanno mai scritto al tuo numero.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#3d4a3c] focus:ring-[#3d4a3c]/30"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Messaggio attivo
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.messageText}
                className="bg-[#3d4a3c] hover:bg-[#2d3a2c] text-white px-6 py-2 rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Salva</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
