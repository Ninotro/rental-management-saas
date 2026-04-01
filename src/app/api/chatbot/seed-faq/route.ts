import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// FAQ predefinite in ITALIANO
const DEFAULT_FAQS_IT = [
  // Categoria CHECK_IN
  {
    language: 'IT',
    category: 'CHECK_IN',
    keywords: ['check-in', 'checkin', 'arrivo', 'orario arrivo', 'a che ora entrare', 'entrare'],
    question: 'A che ora posso fare il check-in?',
    answer: 'Il check-in e\' dalle ore {checkInTime}. Se hai bisogno di un orario diverso, contattaci e cercheremo di venire incontro alle tue esigenze!',
    priority: 10,
  },
  {
    language: 'IT',
    category: 'CHECK_IN',
    keywords: ['check-out', 'checkout', 'partenza', 'uscita', 'lasciare', 'a che ora uscire', 'ora checkout'],
    question: 'A che ora devo fare il check-out?',
    answer: 'Il check-out e\' entro le ore {checkOutTime}. Ti chiediamo di lasciare le chiavi come indicato nelle istruzioni.',
    priority: 10,
  },
  {
    language: 'IT',
    category: 'CHECK_IN',
    keywords: ['codice', 'codici', 'accesso', 'portone', 'chiave', 'chiavi', 'aprire', 'ingresso'],
    question: 'Quali sono i codici di accesso?',
    answer: 'Ecco i codici di accesso:\n{accessCodes}\n\nConservali con cura e non condividerli con estranei!',
    priority: 15,
  },
  // Categoria WIFI
  {
    language: 'IT',
    category: 'WIFI',
    keywords: ['wifi', 'wi-fi', 'internet', 'password wifi', 'rete', 'connessione', 'wireless'],
    question: 'Qual e\' la password del WiFi?',
    answer: 'Ecco i dati per connetterti:\n\nRete: {wifiName}\nPassword: {wifiPassword}\n\nBuona navigazione!',
    priority: 10,
  },
  // Categoria SERVICES
  {
    language: 'IT',
    category: 'SERVICES',
    keywords: ['parcheggio', 'auto', 'macchina', 'parking', 'posteggio', 'garage'],
    question: 'C\'e\' il parcheggio disponibile?',
    answer: '{parkingInfo}',
    priority: 5,
  },
  {
    language: 'IT',
    category: 'SERVICES',
    keywords: ['pulizie', 'pulizia', 'cleaning', 'pulire', 'cambio biancheria', 'asciugamani'],
    question: 'Quando vengono fatte le pulizie?',
    answer: 'Il servizio di pulizia viene effettuato prima del tuo arrivo. Per soggiorni lunghi, contattaci per organizzare pulizie intermedie se necessario.',
    priority: 5,
  },
  {
    language: 'IT',
    category: 'SERVICES',
    keywords: ['riscaldamento', 'caldo', 'freddo', 'aria condizionata', 'climatizzatore', 'ac', 'termosifoni'],
    question: 'Come funziona il riscaldamento/aria condizionata?',
    answer: 'Troverai le istruzioni per il riscaldamento e l\'aria condizionata all\'interno dell\'appartamento. Se hai difficolta\', contattaci!',
    priority: 5,
  },
  // Categoria LOCATION
  {
    language: 'IT',
    category: 'LOCATION',
    keywords: ['arrivare', 'come arrivo', 'indicazioni', 'strada', 'direzioni', 'raggiungere'],
    question: 'Come arrivo alla struttura?',
    answer: '{arrivalInstructions}',
    priority: 10,
  },
  {
    language: 'IT',
    category: 'LOCATION',
    keywords: ['mezzi', 'bus', 'treno', 'metro', 'trasporti', 'autobus', 'fermata', 'stazione'],
    question: 'Quali mezzi pubblici posso usare?',
    answer: '{nearbyTransport}',
    priority: 5,
  },
  {
    language: 'IT',
    category: 'LOCATION',
    keywords: ['indirizzo', 'dove siete', 'posizione', 'ubicazione', 'dove si trova'],
    question: 'Qual e\' l\'indirizzo esatto?',
    answer: 'L\'indirizzo e\':\n{address}, {city}\n\nPuoi trovarlo facilmente su Google Maps cercando "{propertyName}".',
    priority: 5,
  },
  {
    language: 'IT',
    category: 'LOCATION',
    keywords: ['supermercato', 'spesa', 'negozi', 'farmacia', 'ristorante', 'mangiare', 'shopping'],
    question: 'Ci sono negozi o ristoranti nelle vicinanze?',
    answer: 'La zona e\' ben servita! Troverai supermercati, ristoranti e negozi a pochi minuti a piedi. Chiedi pure se vuoi consigli specifici!',
    priority: 3,
  },
  // Categoria OTHER
  {
    language: 'IT',
    category: 'OTHER',
    keywords: ['emergenza', 'urgente', 'problema', 'aiuto', 'guasto', 'rotto'],
    question: 'Ho un\'emergenza, cosa faccio?',
    answer: 'Per emergenze contattaci immediatamente! Cercheremo di risolvere il problema il prima possibile. Per emergenze mediche, chiama il 118.',
    priority: 20,
  },
  {
    language: 'IT',
    category: 'OTHER',
    keywords: ['recensione', 'feedback', 'opinione', 'voto', 'stelle'],
    question: 'Dove posso lasciare una recensione?',
    answer: 'Grazie per voler condividere la tua esperienza! Puoi lasciare una recensione sulla piattaforma dove hai prenotato (Booking, Airbnb, etc.). La tua opinione e\' preziosa per noi!',
    priority: 2,
  },
]

// FAQ predefinite in INGLESE
const DEFAULT_FAQS_EN = [
  // Category CHECK_IN
  {
    language: 'EN',
    category: 'CHECK_IN',
    keywords: ['check-in', 'checkin', 'arrival', 'arrival time', 'what time can i', 'enter', 'get in'],
    question: 'What time can I check in?',
    answer: 'Check-in is from {checkInTime}. If you need a different time, contact us and we\'ll try to accommodate your needs!',
    priority: 10,
  },
  {
    language: 'EN',
    category: 'CHECK_IN',
    keywords: ['check-out', 'checkout', 'departure', 'leave', 'leaving time', 'what time checkout'],
    question: 'What time is check-out?',
    answer: 'Check-out is by {checkOutTime}. Please leave the keys as indicated in the instructions.',
    priority: 10,
  },
  {
    language: 'EN',
    category: 'CHECK_IN',
    keywords: ['code', 'codes', 'access', 'door', 'key', 'keys', 'open', 'entrance', 'entry'],
    question: 'What are the access codes?',
    answer: 'Here are the access codes:\n{accessCodes}\n\nKeep them safe and don\'t share them with strangers!',
    priority: 15,
  },
  // Category WIFI
  {
    language: 'EN',
    category: 'WIFI',
    keywords: ['wifi', 'wi-fi', 'internet', 'wifi password', 'network', 'connection', 'wireless'],
    question: 'What is the WiFi password?',
    answer: 'Here are the connection details:\n\nNetwork: {wifiName}\nPassword: {wifiPassword}\n\nEnjoy browsing!',
    priority: 10,
  },
  // Category SERVICES
  {
    language: 'EN',
    category: 'SERVICES',
    keywords: ['parking', 'car', 'vehicle', 'garage', 'park'],
    question: 'Is parking available?',
    answer: '{parkingInfo}',
    priority: 5,
  },
  {
    language: 'EN',
    category: 'SERVICES',
    keywords: ['cleaning', 'clean', 'housekeeping', 'towels', 'linens', 'sheets'],
    question: 'When is cleaning done?',
    answer: 'Cleaning service is done before your arrival. For longer stays, contact us to arrange intermediate cleaning if needed.',
    priority: 5,
  },
  {
    language: 'EN',
    category: 'SERVICES',
    keywords: ['heating', 'hot', 'cold', 'air conditioning', 'ac', 'temperature', 'thermostat'],
    question: 'How does the heating/air conditioning work?',
    answer: 'You\'ll find instructions for heating and air conditioning inside the apartment. If you have any difficulties, contact us!',
    priority: 5,
  },
  // Category LOCATION
  {
    language: 'EN',
    category: 'LOCATION',
    keywords: ['get there', 'how to arrive', 'directions', 'way', 'reach', 'find'],
    question: 'How do I get to the property?',
    answer: '{arrivalInstructions}',
    priority: 10,
  },
  {
    language: 'EN',
    category: 'LOCATION',
    keywords: ['public transport', 'bus', 'train', 'metro', 'subway', 'tram', 'station', 'stop'],
    question: 'What public transport can I use?',
    answer: '{nearbyTransport}',
    priority: 5,
  },
  {
    language: 'EN',
    category: 'LOCATION',
    keywords: ['address', 'where are you', 'location', 'where is', 'exact address'],
    question: 'What is the exact address?',
    answer: 'The address is:\n{address}, {city}\n\nYou can easily find it on Google Maps by searching "{propertyName}".',
    priority: 5,
  },
  {
    language: 'EN',
    category: 'LOCATION',
    keywords: ['supermarket', 'grocery', 'shops', 'pharmacy', 'restaurant', 'food', 'eat', 'shopping', 'store'],
    question: 'Are there shops or restaurants nearby?',
    answer: 'The area is well served! You\'ll find supermarkets, restaurants and shops within a few minutes walk. Feel free to ask for specific recommendations!',
    priority: 3,
  },
  // Category OTHER
  {
    language: 'EN',
    category: 'OTHER',
    keywords: ['emergency', 'urgent', 'problem', 'help', 'broken', 'not working', 'issue'],
    question: 'I have an emergency, what do I do?',
    answer: 'For emergencies, contact us immediately! We\'ll try to solve the problem as soon as possible. For medical emergencies, call 118 (or 112 for EU emergency).',
    priority: 20,
  },
  {
    language: 'EN',
    category: 'OTHER',
    keywords: ['review', 'feedback', 'opinion', 'rating', 'stars'],
    question: 'Where can I leave a review?',
    answer: 'Thank you for wanting to share your experience! You can leave a review on the platform where you booked (Booking, Airbnb, etc.). Your opinion is valuable to us!',
    priority: 2,
  },
]

// Combina tutte le FAQ
const ALL_DEFAULT_FAQS = [...DEFAULT_FAQS_IT, ...DEFAULT_FAQS_EN]

// POST - Crea le FAQ predefinite
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Controlla se esistono gia' FAQ
    const existingCount = await prisma.chatbotFAQ.count()

    if (existingCount > 0) {
      return NextResponse.json({
        message: `Esistono gia\' ${existingCount} FAQ. Eliminale prima di fare il seed.`,
        created: 0,
        existing: existingCount
      })
    }

    // Crea le FAQ predefinite (globali, senza property/room)
    const created = await prisma.chatbotFAQ.createMany({
      data: ALL_DEFAULT_FAQS.map(faq => ({
        ...faq,
        propertyId: null,
        roomId: null,
        isActive: true,
      }))
    })

    return NextResponse.json({
      message: `Create ${created.count} FAQ predefinite (${DEFAULT_FAQS_IT.length} IT + ${DEFAULT_FAQS_EN.length} EN)!`,
      created: created.count,
      breakdown: {
        italian: DEFAULT_FAQS_IT.length,
        english: DEFAULT_FAQS_EN.length
      }
    })
  } catch (error) {
    console.error('Error seeding FAQs:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione delle FAQ' },
      { status: 500 }
    )
  }
}

// GET - Ottiene info sulle FAQ predefinite
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const existingCount = await prisma.chatbotFAQ.count()
    const existingByLanguage = await prisma.chatbotFAQ.groupBy({
      by: ['language'],
      _count: { id: true }
    })

    return NextResponse.json({
      existingFaqs: existingCount,
      existingByLanguage: existingByLanguage.reduce((acc, item) => {
        acc[item.language] = item._count.id
        return acc
      }, {} as Record<string, number>),
      defaultFaqsCount: ALL_DEFAULT_FAQS.length,
      defaultFaqs: {
        IT: DEFAULT_FAQS_IT.map(f => ({
          category: f.category,
          question: f.question,
          keywords: f.keywords,
        })),
        EN: DEFAULT_FAQS_EN.map(f => ({
          category: f.category,
          question: f.question,
          keywords: f.keywords,
        }))
      }
    })
  } catch (error) {
    console.error('Error getting FAQ info:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero informazioni FAQ' },
      { status: 500 }
    )
  }
}
