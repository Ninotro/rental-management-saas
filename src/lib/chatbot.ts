import { prisma } from '@/lib/prisma'
import { ChatbotState } from '@prisma/client'

// Interfaccia per la risposta del chatbot
export interface ChatbotResponse {
  message: string | null
  handedOff: boolean
  newState: ChatbotState
}

// Variabili supportate nei template FAQ
interface TemplateVariables {
  guestName?: string
  propertyName?: string
  roomName?: string
  checkInTime?: string
  checkOutTime?: string
  wifiName?: string
  wifiPassword?: string
  parkingInfo?: string
  arrivalInstructions?: string
  nearbyTransport?: string
  accessCodes?: string
  address?: string
  city?: string
}

/**
 * Processa un messaggio in arrivo e genera la risposta del chatbot
 */
export async function processChatbotMessage(
  conversationId: string,
  incomingMessage: string,
  phoneNumber: string
): Promise<ChatbotResponse> {
  // Recupera o crea la sessione chatbot
  let session = await prisma.chatbotSession.findUnique({
    where: { conversationId },
    include: {
      selectedProperty: true,
      selectedRoom: true,
      booking: {
        include: {
          property: true,
          room: true,
        }
      }
    }
  })

  // Recupera la conversazione con il booking collegato
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: {
        include: {
          property: true,
          room: true,
        }
      }
    }
  })

  if (!conversation) {
    return {
      message: null,
      handedOff: false,
      newState: ChatbotState.IDLE
    }
  }

  // Se la sessione non esiste, creala
  if (!session) {
    session = await prisma.chatbotSession.create({
      data: {
        conversationId,
        state: ChatbotState.IDLE,
        bookingId: conversation.bookingId,
      },
      include: {
        selectedProperty: true,
        selectedRoom: true,
        booking: {
          include: {
            property: true,
            room: true,
          }
        }
      }
    })
  }

  // Se la conversazione e' gia' stata passata a un operatore, non rispondere
  if (session.isHandedOff) {
    return {
      message: null,
      handedOff: true,
      newState: ChatbotState.HANDOFF_TO_OPERATOR
    }
  }

  const normalizedMessage = incomingMessage.toLowerCase().trim()
  let response: string | null = null
  let newState = session.state
  let handedOff = false

  // Gestisci i diversi stati
  switch (session.state) {
    case ChatbotState.IDLE:
      // Prima interazione - verifica se c'e' un booking collegato
      if (conversation.booking) {
        // Booking trovato, vai direttamente a READY
        const guestName = conversation.booking.guestName.split(' ')[0]
        response = `Ciao ${guestName}! Sono l'assistente automatico di ${conversation.booking.property.name}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`
        newState = ChatbotState.READY

        // Aggiorna la sessione con i dati del booking
        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: {
            selectedPropertyId: conversation.booking.propertyId,
            selectedRoomId: conversation.booking.roomId,
            bookingId: conversation.booking.id,
          }
        })
      } else {
        // Nessun booking, chiedi di selezionare la struttura
        const result = await getPropertySelectionMessage()
        response = result.message
        newState = result.properties.length > 0 ? ChatbotState.AWAITING_PROPERTY : ChatbotState.IDLE
      }
      break

    case ChatbotState.AWAITING_PROPERTY:
      // L'utente deve selezionare una struttura
      const propertyResult = await handlePropertySelection(normalizedMessage, session.id)
      response = propertyResult.message
      newState = propertyResult.newState
      break

    case ChatbotState.AWAITING_ROOM:
      // L'utente deve selezionare una stanza
      const roomResult = await handleRoomSelection(normalizedMessage, session.id)
      response = roomResult.message
      newState = roomResult.newState
      break

    case ChatbotState.READY:
      // Pronto a rispondere alle FAQ

      // Controlla se l'utente vuole parlare con un operatore
      if (isRequestingOperator(normalizedMessage)) {
        response = `Ti metto in contatto con un operatore.
Riceverai risposta al piu' presto!`
        newState = ChatbotState.HANDOFF_TO_OPERATOR
        handedOff = true

        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: { isHandedOff: true }
        })
        break
      }

      // Cerca una FAQ corrispondente
      const faqResult = await matchFAQ(
        normalizedMessage,
        session.selectedPropertyId || undefined,
        session.selectedRoomId || undefined
      )

      if (faqResult) {
        // Prepara le variabili per il template
        const variables = await getTemplateVariables(
          session.selectedPropertyId,
          session.selectedRoomId,
          session.bookingId
        )
        response = replaceTemplateVariables(faqResult.answer, variables)

        // Reset fallback count dopo una risposta valida
        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: { fallbackCount: 0 }
        })
      } else {
        // Nessuna FAQ trovata
        const newFallbackCount = session.fallbackCount + 1

        if (newFallbackCount >= 2) {
          // Dopo 2 fallback, offri di passare a operatore
          response = `Non ho capito la tua richiesta.
Vuoi che ti metta in contatto con un operatore?

Rispondi SI per parlare con una persona.`
        } else {
          response = `Non ho trovato informazioni su questo argomento.
Prova a riformulare la domanda oppure scrivi "operatore" per parlare con una persona.`
        }

        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: { fallbackCount: newFallbackCount }
        })
      }
      break

    case ChatbotState.HANDOFF_TO_OPERATOR:
      // Gia' passato a operatore, non rispondere
      return {
        message: null,
        handedOff: true,
        newState: ChatbotState.HANDOFF_TO_OPERATOR
      }
  }

  // Aggiorna lo stato della sessione
  if (newState !== session.state) {
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: {
        state: newState,
        lastInteraction: new Date()
      }
    })
  } else {
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: { lastInteraction: new Date() }
    })
  }

  return {
    message: response,
    handedOff,
    newState
  }
}

/**
 * Genera il messaggio di selezione proprieta'
 */
async function getPropertySelectionMessage(): Promise<{ message: string; properties: { id: string; name: string }[] }> {
  const properties = await prisma.property.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  if (properties.length === 0) {
    return {
      message: `Ciao! Al momento non ci sono strutture disponibili. Un operatore ti rispondera' al piu' presto.`,
      properties: []
    }
  }

  const propertyList = properties
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join('\n')

  return {
    message: `Ciao! Sono l'assistente automatico.
Per aiutarti, seleziona la struttura della tua prenotazione:

${propertyList}

Rispondi con il numero corrispondente.`,
    properties
  }
}

/**
 * Gestisce la selezione della proprieta'
 */
async function handlePropertySelection(
  message: string,
  sessionId: string
): Promise<{ message: string; newState: ChatbotState }> {
  const properties = await prisma.property.findMany({
    where: { active: true },
    select: { id: true, name: true, hasRooms: true },
    orderBy: { name: 'asc' }
  })

  // Prova a interpretare il messaggio come numero
  const selection = parseInt(message, 10)

  if (isNaN(selection) || selection < 1 || selection > properties.length) {
    return {
      message: `Per favore, rispondi con un numero da 1 a ${properties.length}.`,
      newState: ChatbotState.AWAITING_PROPERTY
    }
  }

  const selectedProperty = properties[selection - 1]

  // Aggiorna la sessione con la proprieta' selezionata
  await prisma.chatbotSession.update({
    where: { id: sessionId },
    data: { selectedPropertyId: selectedProperty.id }
  })

  // Se la proprieta' ha stanze, chiedi di selezionare
  if (selectedProperty.hasRooms) {
    const roomsResult = await getRoomSelectionMessage(selectedProperty.id)
    return {
      message: roomsResult.message,
      newState: roomsResult.rooms.length > 0 ? ChatbotState.AWAITING_ROOM : ChatbotState.READY
    }
  }

  // Altrimenti vai direttamente a READY
  return {
    message: `Perfetto! Ho selezionato ${selectedProperty.name}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`,
    newState: ChatbotState.READY
  }
}

/**
 * Genera il messaggio di selezione stanza
 */
async function getRoomSelectionMessage(propertyId: string): Promise<{ message: string; rooms: { id: string; name: string }[] }> {
  const rooms = await prisma.room.findMany({
    where: { propertyId, active: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  })

  if (rooms.length === 0) {
    return {
      message: `Perfetto! Come posso aiutarti?`,
      rooms: []
    }
  }

  const roomList = rooms
    .map((r, i) => `${i + 1}. ${r.name}`)
    .join('\n')

  return {
    message: `Perfetto! Ora seleziona la tua stanza:

${roomList}

Rispondi con il numero.`,
    rooms
  }
}

/**
 * Gestisce la selezione della stanza
 */
async function handleRoomSelection(
  message: string,
  sessionId: string
): Promise<{ message: string; newState: ChatbotState }> {
  const session = await prisma.chatbotSession.findUnique({
    where: { id: sessionId },
    select: { selectedPropertyId: true }
  })

  if (!session?.selectedPropertyId) {
    return {
      message: `Si e' verificato un errore. Ricominciamo.`,
      newState: ChatbotState.IDLE
    }
  }

  const rooms = await prisma.room.findMany({
    where: { propertyId: session.selectedPropertyId, active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  const selection = parseInt(message, 10)

  if (isNaN(selection) || selection < 1 || selection > rooms.length) {
    return {
      message: `Per favore, rispondi con un numero da 1 a ${rooms.length}.`,
      newState: ChatbotState.AWAITING_ROOM
    }
  }

  const selectedRoom = rooms[selection - 1]

  // Aggiorna la sessione con la stanza selezionata
  await prisma.chatbotSession.update({
    where: { id: sessionId },
    data: { selectedRoomId: selectedRoom.id }
  })

  return {
    message: `Ottimo! Ho selezionato ${selectedRoom.name}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`,
    newState: ChatbotState.READY
  }
}

/**
 * Cerca una FAQ corrispondente al messaggio
 */
async function matchFAQ(
  message: string,
  propertyId?: string,
  roomId?: string
): Promise<{ answer: string } | null> {
  // Costruisci la query per trovare FAQ pertinenti
  const faqs = await prisma.chatbotFAQ.findMany({
    where: {
      isActive: true,
      OR: [
        { propertyId: null, roomId: null }, // FAQ globali
        { propertyId, roomId: null }, // FAQ della proprieta'
        { propertyId, roomId }, // FAQ della stanza specifica
      ].filter(condition => {
        // Rimuovi condizioni non valide
        if (condition.propertyId === undefined && condition.roomId === undefined) {
          return condition.propertyId === null
        }
        return true
      })
    },
    orderBy: { priority: 'desc' }
  })

  const normalizedMessage = message.toLowerCase()

  // Cerca la FAQ con il miglior match
  let bestMatch: { answer: string; score: number } | null = null

  for (const faq of faqs) {
    const keywords = faq.keywords as string[]
    let matchCount = 0

    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        matchCount++
      }
    }

    if (matchCount > 0) {
      const score = matchCount + faq.priority
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { answer: faq.answer, score }
      }
    }
  }

  return bestMatch ? { answer: bestMatch.answer } : null
}

/**
 * Recupera le variabili per il template
 */
async function getTemplateVariables(
  propertyId?: string | null,
  roomId?: string | null,
  bookingId?: string | null
): Promise<TemplateVariables> {
  const variables: TemplateVariables = {}

  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        name: true,
        address: true,
        city: true,
        checkInTime: true,
        checkOutTime: true,
        wifiName: true,
        wifiPassword: true,
        parkingInfo: true,
        arrivalInstructions: true,
        nearbyTransport: true,
        accessCodes: true,
      }
    })

    if (property) {
      variables.propertyName = property.name
      variables.address = property.address
      variables.city = property.city
      variables.checkInTime = property.checkInTime || '15:00'
      variables.checkOutTime = property.checkOutTime || '11:00'
      variables.wifiName = property.wifiName || 'Non disponibile'
      variables.wifiPassword = property.wifiPassword || 'Non disponibile'
      variables.parkingInfo = property.parkingInfo || 'Contattaci per informazioni sul parcheggio'
      variables.arrivalInstructions = property.arrivalInstructions || 'Contattaci per le istruzioni di arrivo'
      variables.nearbyTransport = property.nearbyTransport || 'Contattaci per informazioni sui trasporti'

      // Formatta i codici di accesso
      if (property.accessCodes && typeof property.accessCodes === 'object') {
        const codes = property.accessCodes as Record<string, string>
        variables.accessCodes = Object.entries(codes)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      } else {
        variables.accessCodes = 'Contattaci per i codici di accesso'
      }
    }
  }

  if (roomId) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { name: true }
    })
    if (room) {
      variables.roomName = room.name
    }
  }

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestName: true }
    })
    if (booking) {
      variables.guestName = booking.guestName.split(' ')[0]
    }
  }

  return variables
}

/**
 * Sostituisce le variabili nel template
 */
function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template

  const replacements: Record<string, string | undefined> = {
    '{guestName}': variables.guestName,
    '{propertyName}': variables.propertyName,
    '{roomName}': variables.roomName,
    '{checkInTime}': variables.checkInTime,
    '{checkOutTime}': variables.checkOutTime,
    '{wifiName}': variables.wifiName,
    '{wifiPassword}': variables.wifiPassword,
    '{parkingInfo}': variables.parkingInfo,
    '{arrivalInstructions}': variables.arrivalInstructions,
    '{nearbyTransport}': variables.nearbyTransport,
    '{accessCodes}': variables.accessCodes,
    '{address}': variables.address,
    '{city}': variables.city,
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value) {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
  }

  return result
}

/**
 * Verifica se l'utente sta richiedendo un operatore
 */
function isRequestingOperator(message: string): boolean {
  const operatorKeywords = [
    'operatore',
    'persona',
    'umano',
    'assistenza',
    'parlare con qualcuno',
    'aiuto umano',
    'si', // Risposta al fallback
    'yes',
  ]

  return operatorKeywords.some(keyword => message.includes(keyword))
}

/**
 * Resetta la sessione chatbot per una conversazione
 */
export async function resetChatbotSession(conversationId: string): Promise<void> {
  await prisma.chatbotSession.deleteMany({
    where: { conversationId }
  })
}

/**
 * Segna la conversazione come gestita da operatore
 */
export async function handoffToOperator(conversationId: string): Promise<void> {
  await prisma.chatbotSession.upsert({
    where: { conversationId },
    update: {
      state: ChatbotState.HANDOFF_TO_OPERATOR,
      isHandedOff: true,
    },
    create: {
      conversationId,
      state: ChatbotState.HANDOFF_TO_OPERATOR,
      isHandedOff: true,
    }
  })
}
