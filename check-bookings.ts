import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      bookingCode: true,
      guestName: true,
      createdAt: true,
    },
  })

  console.log('📋 Prenotazioni nel database:')
  console.log(JSON.stringify(bookings, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
