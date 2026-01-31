/**
 * Script per aggiornare le prenotazioni esistenti senza bookingCode
 * Esegui con: npx tsx src/scripts/update-booking-codes.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateBookingCode } from '../lib/bookingCode'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Cercando prenotazioni senza bookingCode...')

  const bookingsWithoutCode = await prisma.booking.findMany({
    where: {
      bookingCode: null,
    },
  })

  console.log(`📦 Trovate ${bookingsWithoutCode.length} prenotazioni da aggiornare`)

  for (const booking of bookingsWithoutCode) {
    let bookingCode = generateBookingCode()
    let isUnique = false
    let attempts = 0

    // Assicurati che il codice sia univoco
    while (!isUnique && attempts < 10) {
      const existing = await prisma.booking.findUnique({
        where: { bookingCode },
      })

      if (!existing) {
        isUnique = true
      } else {
        bookingCode = generateBookingCode()
        attempts++
      }
    }

    if (isUnique) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { bookingCode },
      })
      console.log(`✅ Aggiornata prenotazione ${booking.id} con codice ${bookingCode}`)
    } else {
      console.error(`❌ Impossibile generare codice univoco per prenotazione ${booking.id}`)
    }
  }

  console.log('✨ Completato!')
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
