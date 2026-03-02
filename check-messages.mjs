import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Cerca conversazioni con questo numero
  const conversations = await prisma.whatsAppConversation.findMany({
    where: {
      phoneNumber: { contains: '3913210542' }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  console.log('Conversazioni trovate:', conversations.length)
  if (conversations.length > 0) {
    console.log(JSON.stringify(conversations, null, 2))
  }

  // Cerca anche messaggi inviati recenti
  const sentMessages = await prisma.sentMessage.findMany({
    where: {
      recipientPhone: { contains: '3913210542' }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  console.log('\nSent Messages:', sentMessages.length)
  if (sentMessages.length > 0) {
    console.log(JSON.stringify(sentMessages, null, 2))
  }

  // Cerca tutti i messaggi WhatsApp recenti
  const allMessages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  console.log('\nUltimi 10 messaggi WhatsApp:')
  allMessages.forEach(m => {
    console.log(`- ${m.direction}: ${m.body?.substring(0, 50)}... [${m.status}] SID: ${m.twilioSid}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
