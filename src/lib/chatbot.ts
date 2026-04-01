import { prisma } from '@/lib/prisma'
import { ChatbotState } from '@prisma/client'

// Tipo per le lingue supportate
export type Language = 'IT' | 'EN'

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

// Messaggi di sistema in entrambe le lingue
const MESSAGES = {
  IT: {
    welcome: (guestName: string, propertyName: string) => `Ciao ${guestName}! Sono l'assistente automatico di ${propertyName}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`,
    noProperties: `Ciao! Al momento non ci sono strutture disponibili. Un operatore ti rispondera' al piu' presto.`,
    selectProperty: (propertyList: string) => `Ciao! Sono l'assistente automatico.
Per aiutarti, seleziona la struttura della tua prenotazione:

${propertyList}

Rispondi con il numero corrispondente.`,
    invalidPropertySelection: (max: number) => `Per favore, rispondi con un numero da 1 a ${max}.`,
    propertySelected: (name: string) => `Perfetto! Ho selezionato ${name}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`,
    selectRoom: (roomList: string) => `Perfetto! Ora seleziona la tua stanza:

${roomList}

Rispondi con il numero.`,
    invalidRoomSelection: (max: number) => `Per favore, rispondi con un numero da 1 a ${max}.`,
    roomSelected: (name: string) => `Ottimo! Ho selezionato ${name}.

Posso aiutarti con informazioni su:
- Orari check-in/check-out
- Codici accesso e WiFi
- Servizi disponibili
- Come arrivare

Scrivi la tua domanda!`,
    howCanIHelp: `Perfetto! Come posso aiutarti?`,
    handoffToOperator: `Ti metto in contatto con un operatore.
Riceverai risposta al piu' presto!`,
    notUnderstood: `Non ho trovato informazioni su questo argomento.
Prova a riformulare la domanda oppure scrivi "operatore" per parlare con una persona.`,
    offerOperator: `Non ho capito la tua richiesta.
Vuoi che ti metta in contatto con un operatore?

Rispondi SI per parlare con una persona.`,
    error: `Si e' verificato un errore. Ricominciamo.`,
  },
  EN: {
    welcome: (guestName: string, propertyName: string) => `Hi ${guestName}! I'm the automated assistant for ${propertyName}.

I can help you with information about:
- Check-in/check-out times
- Access codes and WiFi
- Available services
- How to get here

Write your question!`,
    noProperties: `Hello! There are no properties available at the moment. An operator will respond as soon as possible.`,
    selectProperty: (propertyList: string) => `Hello! I'm the automated assistant.
To help you, please select your booking's property:

${propertyList}

Reply with the corresponding number.`,
    invalidPropertySelection: (max: number) => `Please reply with a number from 1 to ${max}.`,
    propertySelected: (name: string) => `Perfect! I've selected ${name}.

I can help you with information about:
- Check-in/check-out times
- Access codes and WiFi
- Available services
- How to get here

Write your question!`,
    selectRoom: (roomList: string) => `Perfect! Now select your room:

${roomList}

Reply with the number.`,
    invalidRoomSelection: (max: number) => `Please reply with a number from 1 to ${max}.`,
    roomSelected: (name: string) => `Great! I've selected ${name}.

I can help you with information about:
- Check-in/check-out times
- Access codes and WiFi
- Available services
- How to get here

Write your question!`,
    howCanIHelp: `Perfect! How can I help you?`,
    handoffToOperator: `I'm connecting you with an operator.
You'll receive a response as soon as possible!`,
    notUnderstood: `I couldn't find information on this topic.
Try rephrasing your question or write "operator" to speak with a person.`,
    offerOperator: `I didn't understand your request.
Would you like me to connect you with an operator?

Reply YES to speak with a person.`,
    error: `An error occurred. Let's start over.`,
  }
}

// Parole chiave per rilevamento lingua inglese
const ENGLISH_INDICATORS = [
  'hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon',
  'what', 'when', 'where', 'how', 'why', 'who',
  'the', 'is', 'are', 'can', 'could', 'would', 'will',
  'please', 'thanks', 'thank you', 'sorry',
  'check-in', 'check-out', 'checkout', 'checkin',
  'wifi', 'password', 'code', 'access',
  'time', 'address', 'directions', 'parking',
  'help', 'need', 'want', 'looking for',
  'room', 'booking', 'reservation',
  'yes', 'no', 'ok', 'okay',
  'i am', "i'm", 'my name', 'arriving'
]

// Parole chiave per rilevamento lingua italiana
const ITALIAN_INDICATORS = [
  'ciao', 'salve', 'buongiorno', 'buonasera', 'buon pomeriggio',
  'qual', 'quale', 'quando', 'dove', 'come', 'perche', 'chi',
  'il', 'la', 'gli', 'le', 'un', 'una', 'dei', 'delle',
  'posso', 'potrei', 'vorrei', 'voglio',
  'per favore', 'grazie', 'scusa', 'scusate',
  'orario', 'indirizzo', 'indicazioni', 'parcheggio',
  'aiuto', 'bisogno', 'cerco', 'stanza', 'camera',
  'prenotazione', 'arrivo', 'partenza',
  'si', 'no', 'va bene',
  'sono', 'mi chiamo', 'arrivo'
]

/**
 * Rileva la lingua del messaggio
 */
function detectLanguage(message: string): Language {
  const normalizedMessage = message.toLowerCase()

  let englishScore = 0
  let italianScore = 0

  for (const word of ENGLISH_INDICATORS) {
    if (normalizedMessage.includes(word)) {
      englishScore++
    }
  }

  for (const word of ITALIAN_INDICATORS) {
    if (normalizedMessage.includes(word)) {
      italianScore++
    }
  }

  // Se l'inglese ha piu' match, usa inglese
  // Altrimenti default italiano
  return englishScore > italianScore ? 'EN' : 'IT'
}

/**
 * Verifica se l'utente sta richiedendo un operatore
 */
function isRequestingOperator(message: string, language: Language): boolean {
  const keywords = language === 'EN'
    ? ['operator', 'person', 'human', 'assistance', 'talk to someone', 'human help', 'yes', 'speak']
    : ['operatore', 'persona', 'umano', 'assistenza', 'parlare con qualcuno', 'aiuto umano', 'si']

  return keywords.some(keyword => message.includes(keyword))
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

  // Rileva la lingua dal messaggio
  const detectedLanguage = detectLanguage(incomingMessage)

  // Se la sessione non esiste, creala con la lingua rilevata
  if (!session) {
    session = await prisma.chatbotSession.create({
      data: {
        conversationId,
        state: ChatbotState.IDLE,
        language: detectedLanguage,
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
  } else {
    // Aggiorna la lingua se cambia significativamente
    // (solo se il messaggio ha indicatori chiari)
    const messageWords = incomingMessage.toLowerCase().split(/\s+/)
    const hasStrongEnglishIndicator = ENGLISH_INDICATORS.some(w => messageWords.includes(w))
    const hasStrongItalianIndicator = ITALIAN_INDICATORS.some(w => messageWords.includes(w))

    if (hasStrongEnglishIndicator && !hasStrongItalianIndicator && session.language !== 'EN') {
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { language: 'EN' }
      })
      session = { ...session, language: 'EN' }
    } else if (hasStrongItalianIndicator && !hasStrongEnglishIndicator && session.language !== 'IT') {
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: { language: 'IT' }
      })
      session = { ...session, language: 'IT' }
    }
  }

  const lang = (session.language || 'IT') as Language
  const msgs = MESSAGES[lang]

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
        response = msgs.welcome(guestName, conversation.booking.property.name)
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
        const result = await getPropertySelectionMessage(lang)
        response = result.message
        newState = result.properties.length > 0 ? ChatbotState.AWAITING_PROPERTY : ChatbotState.IDLE
      }
      break

    case ChatbotState.AWAITING_PROPERTY:
      // L'utente deve selezionare una struttura
      const propertyResult = await handlePropertySelection(normalizedMessage, session.id, lang)
      response = propertyResult.message
      newState = propertyResult.newState
      break

    case ChatbotState.AWAITING_ROOM:
      // L'utente deve selezionare una stanza
      const roomResult = await handleRoomSelection(normalizedMessage, session.id, lang)
      response = roomResult.message
      newState = roomResult.newState
      break

    case ChatbotState.READY:
      // Pronto a rispondere alle FAQ

      // Controlla se l'utente vuole parlare con un operatore
      if (isRequestingOperator(normalizedMessage, lang)) {
        response = msgs.handoffToOperator
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
        lang,
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
          response = msgs.offerOperator
        } else {
          response = msgs.notUnderstood
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
async function getPropertySelectionMessage(lang: Language): Promise<{ message: string; properties: { id: string; name: string }[] }> {
  const msgs = MESSAGES[lang]
  const properties = await prisma.property.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  if (properties.length === 0) {
    return {
      message: msgs.noProperties,
      properties: []
    }
  }

  const propertyList = properties
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join('\n')

  return {
    message: msgs.selectProperty(propertyList),
    properties
  }
}

/**
 * Gestisce la selezione della proprieta'
 */
async function handlePropertySelection(
  message: string,
  sessionId: string,
  lang: Language
): Promise<{ message: string; newState: ChatbotState }> {
  const msgs = MESSAGES[lang]
  const properties = await prisma.property.findMany({
    where: { active: true },
    select: { id: true, name: true, hasRooms: true },
    orderBy: { name: 'asc' }
  })

  // Prova a interpretare il messaggio come numero
  const selection = parseInt(message, 10)

  if (isNaN(selection) || selection < 1 || selection > properties.length) {
    return {
      message: msgs.invalidPropertySelection(properties.length),
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
    const roomsResult = await getRoomSelectionMessage(selectedProperty.id, lang)
    return {
      message: roomsResult.message,
      newState: roomsResult.rooms.length > 0 ? ChatbotState.AWAITING_ROOM : ChatbotState.READY
    }
  }

  // Altrimenti vai direttamente a READY
  return {
    message: msgs.propertySelected(selectedProperty.name),
    newState: ChatbotState.READY
  }
}

/**
 * Genera il messaggio di selezione stanza
 */
async function getRoomSelectionMessage(propertyId: string, lang: Language): Promise<{ message: string; rooms: { id: string; name: string }[] }> {
  const msgs = MESSAGES[lang]
  const rooms = await prisma.room.findMany({
    where: { propertyId, active: true },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  })

  if (rooms.length === 0) {
    return {
      message: msgs.howCanIHelp,
      rooms: []
    }
  }

  const roomList = rooms
    .map((r, i) => `${i + 1}. ${r.name}`)
    .join('\n')

  return {
    message: msgs.selectRoom(roomList),
    rooms
  }
}

/**
 * Gestisce la selezione della stanza
 */
async function handleRoomSelection(
  message: string,
  sessionId: string,
  lang: Language
): Promise<{ message: string; newState: ChatbotState }> {
  const msgs = MESSAGES[lang]
  const session = await prisma.chatbotSession.findUnique({
    where: { id: sessionId },
    select: { selectedPropertyId: true }
  })

  if (!session?.selectedPropertyId) {
    return {
      message: msgs.error,
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
      message: msgs.invalidRoomSelection(rooms.length),
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
    message: msgs.roomSelected(selectedRoom.name),
    newState: ChatbotState.READY
  }
}

/**
 * Cerca una FAQ corrispondente al messaggio
 * Algoritmo migliorato che considera:
 * - Lingua della FAQ
 * - Lunghezza delle keyword (piu' specifiche = piu' peso)
 * - Match di parole intere vs parziali
 * - Priorita' della FAQ
 * - Specificita' del contesto (room > property > global)
 */
async function matchFAQ(
  message: string,
  language: Language,
  propertyId?: string,
  roomId?: string
): Promise<{ answer: string } | null> {
  // Costruisci la query per trovare FAQ pertinenti nella lingua corretta
  const faqs = await prisma.chatbotFAQ.findMany({
    where: {
      isActive: true,
      language: language,
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
  const messageWords = normalizedMessage.split(/\s+/)

  // Cerca la FAQ con il miglior match
  let bestMatch: { answer: string; score: number; debug?: string } | null = null

  for (const faq of faqs) {
    const keywords = faq.keywords as string[]
    let score = 0
    let matchedKeywords: string[] = []

    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase()

      if (normalizedMessage.includes(normalizedKeyword)) {
        matchedKeywords.push(keyword)

        // Peso base: lunghezza della keyword (keyword piu' lunghe = piu' specifiche)
        let keywordScore = normalizedKeyword.length

        // Bonus per match di parola intera (non parziale)
        const keywordWords = normalizedKeyword.split(/\s+/)
        const isWholeWordMatch = keywordWords.every(kw =>
          messageWords.some(mw => mw === kw || mw.startsWith(kw) || mw.endsWith(kw))
        )
        if (isWholeWordMatch) {
          keywordScore *= 1.5
        }

        // Bonus per keyword multi-parola (es. "check-out" vs "ora")
        if (keywordWords.length > 1 || normalizedKeyword.includes('-')) {
          keywordScore *= 1.3
        }

        score += keywordScore
      }
    }

    if (score > 0) {
      // Aggiungi la priorita' della FAQ (scalata)
      score += faq.priority * 2

      // Bonus per specificita' del contesto
      if (faq.roomId) {
        score += 20 // FAQ specifiche per stanza
      } else if (faq.propertyId) {
        score += 10 // FAQ specifiche per proprieta'
      }

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          answer: faq.answer,
          score,
          debug: `FAQ [${language}]: ${faq.question} | Matched: [${matchedKeywords.join(', ')}] | Score: ${score}`
        }
      }
    }
  }

  // Log per debug
  if (bestMatch?.debug) {
    console.log('[Chatbot Match]', bestMatch.debug)
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
