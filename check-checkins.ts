import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Conta check-in per status
  const pending = await prisma.guestCheckIn.count({ where: { status: 'PENDING' } })
  const approved = await prisma.guestCheckIn.count({ where: { status: 'APPROVED' } })
  const rejected = await prisma.guestCheckIn.count({ where: { status: 'REJECTED' } })

  console.log('\n=== Statistiche Check-in ===')
  console.log(`PENDING: ${pending}`)
  console.log(`APPROVED: ${approved}`)
  console.log(`REJECTED: ${rejected}`)

  // Mostra ultimi 5 check-in
  const recent = await prisma.guestCheckIn.findMany({
    take: 5,
    orderBy: { submittedAt: 'desc' },
    include: {
      selectedRoom: { select: { name: true } },
      booking: { select: { guestName: true } }
    }
  })

  console.log('\n=== Ultimi 5 Check-in ===')
  for (const c of recent) {
    const roomName = c.selectedRoom?.name || 'N/A'
    const bookingGuest = c.booking?.guestName || 'Non collegato'
    console.log(`- ${c.firstName} ${c.lastName} | Status: ${c.status} | Stanza: ${roomName} | Booking: ${bookingGuest}`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
