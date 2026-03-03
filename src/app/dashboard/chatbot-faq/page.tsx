'use client'

import { useState, useEffect } from 'react'
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Home,
  Bed,
  Info,
  Save,
  X,
  Tag,
  MessageCircleQuestion,
  ToggleLeft,
  ToggleRight
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

interface ChatbotFAQ {
  id: string
  propertyId: string | null
  roomId: string | null
  category: string
  keywords: string[]
  question: string
  answer: string
  priority: number
  isActive: boolean
  createdAt: string
  property?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

const FAQ_CATEGORIES = [
  { value: 'CHECK_IN', label: 'Check-in/Check-out', color: 'bg-blue-100 text-blue-700' },
  { value: 'WIFI', label: 'WiFi e Internet', color: 'bg-purple-100 text-purple-700' },
  { value: 'SERVICES', label: 'Servizi', color: 'bg-green-100 text-green-700' },
  { value: 'LOCATION', label: 'Posizione e Trasporti', color: 'bg-orange-100 text-orange-700' },
  { value: 'OTHER', label: 'Altro', color: 'bg-slate-100 text-slate-700' },
]

const AVAILABLE_VARIABLES = [
  { variable: '{guestName}', description: 'Nome ospite' },
  { variable: '{propertyName}', description: 'Nome struttura' },
  { variable: '{roomName}', description: 'Nome stanza' },
  { variable: '{checkInTime}', description: 'Orario check-in' },
  { variable: '{checkOutTime}', description: 'Orario check-out' },
  { variable: '{wifiName}', description: 'Nome rete WiFi' },
  { variable: '{wifiPassword}', description: 'Password WiFi' },
  { variable: '{parkingInfo}', description: 'Info parcheggio' },
  { variable: '{arrivalInstructions}', description: 'Istruzioni arrivo' },
  { variable: '{nearbyTransport}', description: 'Trasporti vicini' },
  { variable: '{accessCodes}', description: 'Codici accesso' },
  { variable: '{address}', description: 'Indirizzo' },
  { variable: '{city}', description: 'Citta' },
]

export default function ChatbotFAQPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [faqs, setFaqs] = useState<ChatbotFAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Filtri
  const [filterPropertyId, setFilterPropertyId] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [seeding, setSeeding] = useState(false)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<ChatbotFAQ | null>(null)
  const [formData, setFormData] = useState({
    propertyId: '',
    roomId: '',
    category: 'CHECK_IN',
    keywords: '',
    question: '',
    answer: '',
    priority: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchProperties()
    fetchFaqs()
  }, [])

  useEffect(() => {
    fetchFaqs()
  }, [filterPropertyId, filterCategory])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    }
  }

  const fetchFaqs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPropertyId) params.append('propertyId', filterPropertyId)
      if (filterCategory) params.append('category', filterCategory)

      const response = await fetch(`/api/chatbot/faq?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFaqs(data)
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedProperty = properties.find(p => p.id === formData.propertyId)

  const openCreateModal = () => {
    setEditingFaq(null)
    setFormData({
      propertyId: '',
      roomId: '',
      category: 'CHECK_IN',
      keywords: '',
      question: '',
      answer: '',
      priority: 0,
      isActive: true,
    })
    setShowModal(true)
  }

  const openEditModal = (faq: ChatbotFAQ) => {
    setEditingFaq(faq)
    setFormData({
      propertyId: faq.propertyId || '',
      roomId: faq.roomId || '',
      category: faq.category,
      keywords: faq.keywords.join(', '),
      question: faq.question,
      answer: faq.answer,
      priority: faq.priority,
      isActive: faq.isActive,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingFaq(null)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      // Converti keywords da stringa a array
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0)

      if (keywordsArray.length === 0) {
        setError('Inserisci almeno una keyword')
        setSaving(false)
        return
      }

      const payload = {
        propertyId: formData.propertyId || null,
        roomId: formData.roomId || null,
        category: formData.category,
        keywords: keywordsArray,
        question: formData.question,
        answer: formData.answer,
        priority: formData.priority,
        isActive: formData.isActive,
      }

      const url = editingFaq
        ? `/api/chatbot/faq/${editingFaq.id}`
        : '/api/chatbot/faq'

      const method = editingFaq ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingFaq ? 'FAQ aggiornata!' : 'FAQ creata!')
        setTimeout(() => setSuccess(''), 3000)
        closeModal()
        fetchFaqs()
      } else {
        setError(data.error || 'Errore nel salvataggio')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (faqId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa FAQ?')) return

    try {
      const response = await fetch(`/api/chatbot/faq/${faqId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('FAQ eliminata!')
        setTimeout(() => setSuccess(''), 3000)
        fetchFaqs()
      }
    } catch (err) {
      console.error('Error deleting FAQ:', err)
    }
  }

  const toggleFaqActive = async (faq: ChatbotFAQ) => {
    try {
      const response = await fetch(`/api/chatbot/faq/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faq.isActive }),
      })

      if (response.ok) {
        fetchFaqs()
      }
    } catch (err) {
      console.error('Error toggling FAQ:', err)
    }
  }

  const seedDefaultFaqs = async () => {
    if (!confirm('Vuoi creare le FAQ predefinite? Funziona solo se non esistono gia\' FAQ nel sistema.')) return

    setSeeding(true)
    try {
      const response = await fetch('/api/chatbot/seed-faq', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => setSuccess(''), 5000)
        fetchFaqs()
      } else {
        setError(data.error || 'Errore nel seeding')
        setTimeout(() => setError(''), 5000)
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setSeeding(false)
    }
  }

  const getCategoryStyle = (category: string) => {
    return FAQ_CATEGORIES.find(c => c.value === category)?.color || 'bg-slate-100 text-slate-700'
  }

  const getCategoryLabel = (category: string) => {
    return FAQ_CATEGORIES.find(c => c.value === category)?.label || category
  }

  if (loading && faqs.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <Bot className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
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
          <Bot size={32} />
          <h1 className="text-3xl font-bold">Chatbot FAQ</h1>
        </div>
        <p className="text-white/80">
          Gestisci le domande frequenti a cui il chatbot risponde automaticamente
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center animate-in fade-in">
          <CheckCircle size={20} className="mr-3 flex-shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center animate-in fade-in">
          <AlertCircle size={20} className="mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Filtri e Azioni */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Struttura</label>
              <select
                value={filterPropertyId}
                onChange={(e) => setFilterPropertyId(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
              >
                <option value="">Tutte le strutture</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
              >
                <option value="">Tutte le categorie</option>
                {FAQ_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {faqs.length === 0 && (
              <button
                onClick={seedDefaultFaqs}
                disabled={seeding}
                className="border border-[#3d4a3c] text-[#3d4a3c] hover:bg-[#3d4a3c]/10 px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3d4a3c]"></div>
                    <span>Creazione...</span>
                  </>
                ) : (
                  <>
                    <Bot size={18} />
                    <span>Carica FAQ Predefinite</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="bg-[#3d4a3c] hover:bg-[#2d3a2c] text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
            >
              <Plus size={18} />
              <span>Nuova FAQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista FAQ */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <MessageCircleQuestion size={20} className="mr-2 text-[#3d4a3c]" />
          FAQ Configurate ({faqs.length})
        </h2>

        {faqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <Bot size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 font-medium">Nessuna FAQ configurata</p>
            <p className="text-slate-500 text-sm mt-1">Crea la prima FAQ per il chatbot</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map(faq => (
              <div
                key={faq.id}
                className={`border rounded-xl p-4 transition-all ${
                  faq.isActive
                    ? 'border-slate-200 bg-white hover:shadow-md'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryStyle(faq.category)}`}>
                        {getCategoryLabel(faq.category)}
                      </span>
                      {faq.property && (
                        <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                          <Home size={12} className="mr-1" />
                          {faq.property.name}
                        </span>
                      )}
                      {faq.room && (
                        <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                          <Bed size={12} className="mr-1" />
                          {faq.room.name}
                        </span>
                      )}
                      {!faq.property && !faq.room && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded-full">
                          Globale
                        </span>
                      )}
                      {faq.priority > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                          Priorita: {faq.priority}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-1">{faq.question}</h3>

                    <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                      {faq.answer}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {faq.keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full flex items-center"
                        >
                          <Tag size={10} className="mr-1" />
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleFaqActive(faq)}
                      className={`p-2 rounded-lg transition-colors ${
                        faq.isActive
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={faq.isActive ? 'Disattiva' : 'Attiva'}
                    >
                      {faq.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button
                      onClick={() => openEditModal(faq)}
                      className="p-2 text-slate-600 hover:text-[#3d4a3c] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
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

      {/* Variables Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
          <Info size={20} className="mr-2" />
          Variabili Disponibili
        </h3>
        <p className="text-blue-800 text-sm mb-4">
          Usa queste variabili nelle risposte. Verranno sostituite con i dati reali della struttura/stanza.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {AVAILABLE_VARIABLES.map(v => (
            <div
              key={v.variable}
              className="bg-white border border-blue-200 rounded-lg p-2 text-left"
            >
              <code className="text-blue-700 text-xs font-mono">{v.variable}</code>
              <p className="text-xs text-slate-600 mt-1">{v.description}</p>
            </div>
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
                  {editingFaq ? 'Modifica FAQ' : 'Nuova FAQ'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-center">
                  <AlertCircle size={18} className="mr-2" />
                  {error}
                </div>
              )}

              {/* Ambito FAQ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Struttura
                    <span className="text-slate-500 text-xs ml-1">(opzionale)</span>
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, roomId: '' })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                  >
                    <option value="">FAQ Globale (tutte le strutture)</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Stanza
                    <span className="text-slate-500 text-xs ml-1">(opzionale)</span>
                  </label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    disabled={!formData.propertyId}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30 disabled:bg-slate-100"
                  >
                    <option value="">Tutta la struttura</option>
                    {selectedProperty?.rooms?.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categoria e Priorita */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                  >
                    {FAQ_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priorita
                    <span className="text-slate-500 text-xs ml-1">(piu alto = piu importante)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Keywords *
                  <span className="text-slate-500 text-xs ml-1">(separate da virgola)</span>
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="es: wifi, password, internet, connessione"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Il chatbot cerchera queste parole nel messaggio dell'ospite
                </p>
              </div>

              {/* Domanda esempio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Domanda Esempio *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="es: Qual e' la password del WiFi?"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                />
              </div>

              {/* Risposta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Risposta *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  placeholder="es: La rete WiFi si chiama {wifiName} e la password e' {wifiPassword}"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#3d4a3c]/30"
                />
              </div>

              {/* Attivo */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#3d4a3c] focus:ring-[#3d4a3c]/30"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  FAQ attiva
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
                disabled={saving || !formData.keywords || !formData.question || !formData.answer}
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
