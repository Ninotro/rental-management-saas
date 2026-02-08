'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  User,
  Calendar,
  Home,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Plus,
  X,
  Loader2,
} from 'lucide-react'

interface Conversation {
  id: string
  phoneNumber: string
  guestName: string
  unreadCount: number
  lastMessageAt: string
  booking?: {
    id: string
    guestName: string
    checkIn: string
    checkOut: string
    property: { id: string; name: string }
  }
  lastMessage?: {
    body: string
    direction: 'INCOMING' | 'OUTGOING'
    sentAt: string
    status: string
  }
}

interface Message {
  id: string
  direction: 'INCOMING' | 'OUTGOING'
  body: string
  mediaUrl?: string
  status: string
  sentAt: string
}

interface ConversationDetail {
  id: string
  phoneNumber: string
  guestName: string
  unreadCount: number
  booking?: {
    id: string
    guestName: string
    guestEmail: string
    guestPhone: string
    checkIn: string
    checkOut: string
    status: string
    property: { id: string; name: string }
    room?: { id: string; name: string }
  }
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [newChatName, setNewChatName] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carica conversazioni
  useEffect(() => {
    fetchConversations()

    // Polling ogni 10 secondi
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [searchQuery])

  // Carica messaggi quando cambia conversazione
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  // Scroll ai nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling messaggi della conversazione attiva
  useEffect(() => {
    if (!selectedConversation) return

    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id, true) // silent fetch
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConversation?.id])

  const fetchConversations = async () => {
    try {
      const url = searchQuery
        ? `/api/whatsapp/conversations?search=${encodeURIComponent(searchQuery)}`
        : '/api/whatsapp/conversations'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const response = await fetch(`/api/whatsapp/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        if (!silent) {
          setSelectedConversation(data.conversation)
        }
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/whatsapp/conversations/${conversationId}`, {
        method: 'PATCH',
      })
      // Aggiorna il conteggio nella lista
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !newMessage.trim() || sending) return

    setSending(true)
    const messageBody = newMessage.trim()
    setNewMessage('')

    // Aggiungi messaggio ottimisticamente
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      direction: 'OUTGOING',
      body: messageBody,
      status: 'SENDING',
      sentAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const response = await fetch(`/api/whatsapp/conversations/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: messageBody }),
      })

      if (response.ok) {
        const data = await response.json()
        // Sostituisci messaggio ottimistico con quello reale
        setMessages(prev =>
          prev.map(m => m.id === optimisticMessage.id ? data.message : m)
        )
        // Aggiorna lista conversazioni
        fetchConversations()
      } else {
        // Segna come fallito
        setMessages(prev =>
          prev.map(m => m.id === optimisticMessage.id ? { ...m, status: 'FAILED' } : m)
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev =>
        prev.map(m => m.id === optimisticMessage.id ? { ...m, status: 'FAILED' } : m)
      )
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const createNewChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChatPhone.trim()) return

    try {
      const response = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: newChatPhone.trim(),
          guestName: newChatName.trim() || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShowNewChat(false)
        setNewChatPhone('')
        setNewChatName('')
        await fetchConversations()
        // Seleziona la nuova conversazione
        setSelectedConversation(data.conversation)
        setMobileShowChat(true)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ieri'
    }

    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
  }

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENDING':
        return <Clock size={14} className="text-slate-400" />
      case 'SENT':
      case 'QUEUED':
        return <Check size={14} className="text-slate-400" />
      case 'DELIVERED':
        return <CheckCheck size={14} className="text-slate-400" />
      case 'READ':
        return <CheckCheck size={14} className="text-blue-500" />
      case 'FAILED':
        return <AlertCircle size={14} className="text-red-500" />
      default:
        return null
    }
  }

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation({
      id: conv.id,
      phoneNumber: conv.phoneNumber,
      guestName: conv.guestName,
      unreadCount: conv.unreadCount,
      booking: conv.booking ? {
        ...conv.booking,
        guestEmail: '',
        guestPhone: conv.phoneNumber,
        status: 'CONFIRMED',
      } : undefined,
    })
    setMobileShowChat(true)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3d4a3c]/20 rounded-full animate-spin border-t-[#3d4a3c]"></div>
          <MessageSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#3d4a3c]" size={24} />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Caricamento chat...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3d4a3c] to-[#2d3a2c] rounded-2xl p-6 text-white mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare size={28} />
            <div>
              <h1 className="text-2xl font-bold">Chat WhatsApp</h1>
              <p className="text-white/70 text-sm">Comunica con i tuoi ospiti</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuova Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca conversazione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Nessuna conversazione</p>
                <p className="text-slate-400 text-sm mt-1">
                  I messaggi degli ospiti appariranno qui
                </p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors border-b border-slate-100 text-left ${
                    selectedConversation?.id === conv.id ? 'bg-[#3d4a3c]/5' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-[#3d4a3c] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.guestName?.charAt(0).toUpperCase() || <User size={20} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {conv.guestName}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.direction === 'OUTGOING' && (
                            <span className="text-slate-400">Tu: </span>
                          )}
                          {conv.lastMessage.body}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Nessun messaggio</span>
                      )}
                    </p>
                    {conv.booking && (
                      <p className="text-xs text-[#3d4a3c] mt-1 flex items-center">
                        <Home size={12} className="mr-1" />
                        {conv.booking.property.name}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#3d4a3c] text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="w-10 h-10 bg-[#3d4a3c] rounded-full flex items-center justify-center text-white font-bold">
                  {selectedConversation.guestName?.charAt(0).toUpperCase() || <User size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900 truncate">
                    {selectedConversation.guestName || 'Ospite'}
                  </h2>
                  <p className="text-sm text-slate-500 flex items-center">
                    <Phone size={12} className="mr-1" />
                    {selectedConversation.phoneNumber}
                  </p>
                </div>

                {selectedConversation.booking && (
                  <div className="hidden lg:block text-right text-sm">
                    <p className="text-slate-900 font-medium">{selectedConversation.booking.property.name}</p>
                    <p className="text-slate-500 flex items-center justify-end">
                      <Calendar size={12} className="mr-1" />
                      {new Date(selectedConversation.booking.checkIn).toLocaleDateString('it-IT')} - {new Date(selectedConversation.booking.checkOut).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-[#3d4a3c]" size={32} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">Nessun messaggio</p>
                      <p className="text-slate-400 text-sm">Invia il primo messaggio</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOutgoing = message.direction === 'OUTGOING'
                      const showDate = index === 0 ||
                        new Date(messages[index - 1].sentAt).toDateString() !==
                        new Date(message.sentAt).toDateString()

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="bg-white text-slate-500 text-xs px-3 py-1 rounded-full shadow-sm">
                                {new Date(message.sentAt).toLocaleDateString('it-IT', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isOutgoing
                                  ? 'bg-[#3d4a3c] text-white rounded-br-md'
                                  : 'bg-white text-slate-900 shadow-sm rounded-bl-md'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                              <div className={`flex items-center justify-end space-x-1 mt-1 ${
                                isOutgoing ? 'text-white/60' : 'text-slate-400'
                              }`}>
                                <span className="text-xs">{formatMessageTime(message.sentAt)}</span>
                                {isOutgoing && getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-[#3d4a3c] hover:bg-[#2d3a2c] text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={40} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Seleziona una conversazione</h3>
                <p className="text-slate-500 mt-1">Scegli una chat dalla lista per iniziare</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewChat(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Nuova Chat</h2>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createNewChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Numero WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Inserisci il numero con prefisso internazionale
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome (opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Nome ospite"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#3d4a3c]/30 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!newChatPhone.trim()}
                  className="flex-1 bg-[#3d4a3c] hover:bg-[#2d3a2c] text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Crea Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
