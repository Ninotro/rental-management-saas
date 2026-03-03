import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// FAQ predefinite da creare
const DEFAULT_FAQS = [
  // Categoria CHECK_IN
  {
    category: 'CHECK_IN',
    keywords: ['check-in', 'checkin', 'arrivo', 'orario arrivo', 'a che ora', 'entrare'],
    question: 'A che ora posso fare il check-in?',
    answer: 'Il check-in e\' dalle ore {checkInTime}. Se hai bisogno di un orario diverso, contattaci e cercheremo di venire incontro alle tue esigenze!',
    priority: 10,
  },
  {
    category: 'CHECK_IN',
    keywords: ['check-out', 'checkout', 'partenza', 'uscita', 'lasciare'],
    question: 'A che ora devo fare il check-out?',
    answer: 'Il check-out e\' entro le ore {checkOutTime}. Ti chiediamo di lasciare le chiavi come indicato nelle istruzioni.',
    priority: 10,
  },
  {
    category: 'CHECK_IN',
    keywords: ['codice', 'codici', 'accesso', 'portone', 'chiave', 'chiavi', 'aprire', 'entrare', 'ingresso'],
    question: 'Quali sono i codici di accesso?',
    answer: 'Ecco i codici di accesso:\n{accessCodes}\n\nConservali con cura e non condividerli con estranei!',
    priority: 15,
  },
  // Categoria WIFI
  {
    category: 'WIFI',
    keywords: ['wifi', 'wi-fi', 'internet', 'password wifi', 'rete', 'connessione', 'wireless'],
    question: 'Qual e\' la password del WiFi?',
    answer: 'Ecco i dati per connetterti:\n\nRete: {wifiName}\nPassword: {wifiPassword}\n\nBuona navigazione!',
    priority: 10,
  },
  // Categoria SERVICES
  {
    category: 'SERVICES',
    keywords: ['parcheggio', 'auto', 'macchina', 'parking', 'posteggio', 'garage'],
    question: 'C\'e\' il parcheggio disponibile?',
    answer: '{parkingInfo}',
    priority: 5,
  },
  {
    category: 'SERVICES',
    keywords: ['pulizie', 'pulizia', 'cleaning', 'pulire', 'cambio biancheria', 'asciugamani'],
    question: 'Quando vengono fatte le pulizie?',
    answer: 'Il servizio di pulizia viene effettuato prima del tuo arrivo. Per soggiorni lunghi, contattaci per organizzare pulizie intermedie se necessario.',
    priority: 5,
  },
  {
    category: 'SERVICES',
    keywords: ['riscaldamento', 'caldo', 'freddo', 'aria condizionata', 'climatizzatore', 'ac', 'termosifoni'],
    question: 'Come funziona il riscaldamento/aria condizionata?',
    answer: 'Troverai le istruzioni per il riscaldamento e l\'aria condizionata all\'interno dell\'appartamento. Se hai difficolta\', contattaci!',
    priority: 5,
  },
  // Categoria LOCATION
  {
    category: 'LOCATION',
    keywords: ['arrivare', 'come arrivo', 'indicazioni', 'strada', 'direzioni', 'raggiungere'],
    question: 'Come arrivo alla struttura?',
    answer: '{arrivalInstructions}',
    priority: 10,
  },
  {
    category: 'LOCATION',
    keywords: ['mezzi', 'bus', 'treno', 'metro', 'trasporti', 'autobus', 'fermata', 'stazione'],
    question: 'Quali mezzi pubblici posso usare?',
    answer: '{nearbyTransport}',
    priority: 5,
  },
  {
    category: 'LOCATION',
    keywords: ['indirizzo', 'dove siete', 'posizione', 'ubicazione', 'dove si trova'],
    question: 'Qual e\' l\'indirizzo esatto?',
    answer: 'L\'indirizzo e\':\n{address}, {city}\n\nPuoi trovarlo facilmente su Google Maps cercando "{propertyName}".',
    priority: 5,
  },
  {
    category: 'LOCATION',
    keywords: ['supermercato', 'spesa', 'negozi', 'farmacia', 'ristorante', 'mangiare', 'shopping'],
    question: 'Ci sono negozi o ristoranti nelle vicinanze?',
    answer: 'La zona e\' ben servita! Troverai supermercati, ristoranti e negozi a pochi minuti a piedi. Chiedi pure se vuoi consigli specifici!',
    priority: 3,
  },
  // Categoria OTHER
  {
    category: 'OTHER',
    keywords: ['emergenza', 'urgente', 'problema', 'aiuto', 'guasto', 'rotto'],
    question: 'Ho un\'emergenza, cosa faccio?',
    answer: 'Per emergenze contattaci immediatamente! Cercheremo di risolvere il problema il prima possibile. Per emergenze mediche, chiama il 118.',
    priority: 20,
  },
  {
    category: 'OTHER',
    keywords: ['recensione', 'feedback', 'opinione', 'voto', 'stelle'],
    question: 'Dove posso lasciare una recensione?',
    answer: 'Grazie per voler condividere la tua esperienza! Puoi lasciare una recensione sulla piattaforma dove hai prenotato (Booking, Airbnb, etc.). La tua opinione e\' preziosa per noi!',
    priority: 2,
  },
]

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
      data: DEFAULT_FAQS.map(faq => ({
        ...faq,
        propertyId: null,
        roomId: null,
        isActive: true,
      }))
    })

    return NextResponse.json({
      message: `Create ${created.count} FAQ predefinite!`,
      created: created.count
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

    return NextResponse.json({
      existingFaqs: existingCount,
      defaultFaqsCount: DEFAULT_FAQS.length,
      defaultFaqs: DEFAULT_FAQS.map(f => ({
        category: f.category,
        question: f.question,
        keywords: f.keywords,
      }))
    })
  } catch (error) {
    console.error('Error getting FAQ info:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero informazioni FAQ' },
      { status: 500 }
    )
  }
}
