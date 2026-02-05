import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteImage } from '@/lib/cloudinary'

interface CheckInToClean {
  id: string
  documentFrontUrl: string | null
  documentBackUrl: string | null
  touristTaxPaymentProof: string | null
  booking: {
    touristTaxPaymentProof: string | null
  } | null
}

// Helper per estrarre il public_id da un URL Cloudinary
function extractPublicId(url: string | null): string | null {
  if (!url) return null

  try {
    // URL Cloudinary: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  } catch {
    return null
  }
}

// GET - Conta quanti record possono essere puliti (preview)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Data limite: 3 giorni fa
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Conta i check-in che possono essere puliti:
    // - Hanno un booking con checkout passato da più di 3 giorni
    // - Non sono già stati anonimizzati
    // - Sono stati approvati (status APPROVED)
    const eligibleCount = await prisma.guestCheckIn.count({
      where: {
        dataAnonymized: false,
        status: 'APPROVED',
        booking: {
          checkOut: {
            lt: threeDaysAgo
          }
        }
      }
    })

    // Conta anche quelli senza booking ma con selectedCheckOut passato
    const eligibleWithoutBooking = await prisma.guestCheckIn.count({
      where: {
        dataAnonymized: false,
        status: 'APPROVED',
        bookingId: null,
        selectedCheckOut: {
          lt: threeDaysAgo
        }
      }
    })

    return NextResponse.json({
      eligibleCount: eligibleCount + eligibleWithoutBooking,
      threeDaysAgo: threeDaysAgo.toISOString()
    })
  } catch (error) {
    console.error('Errore nel conteggio cleanup:', error)
    return NextResponse.json(
      { error: 'Errore nel conteggio dei record' },
      { status: 500 }
    )
  }
}

// POST - Esegui la pulizia dei dati
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Data limite: 3 giorni fa
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Trova tutti i check-in da pulire
    const checkInsToClean = await prisma.guestCheckIn.findMany({
      where: {
        dataAnonymized: false,
        status: 'APPROVED',
        OR: [
          {
            booking: {
              checkOut: {
                lt: threeDaysAgo
              }
            }
          },
          {
            bookingId: null,
            selectedCheckOut: {
              lt: threeDaysAgo
            }
          }
        ]
      },
      select: {
        id: true,
        documentFrontUrl: true,
        documentBackUrl: true,
        touristTaxPaymentProof: true,
        booking: {
          select: {
            touristTaxPaymentProof: true
          }
        }
      }
    })

    if (checkInsToClean.length === 0) {
      return NextResponse.json({
        success: true,
        cleanedCount: 0,
        deletedFilesCount: 0,
        message: 'Nessun record da pulire'
      })
    }

    let deletedFilesCount = 0
    const errors: string[] = []

    // Cancella i file da Cloudinary per ogni check-in
    for (const checkIn of checkInsToClean) {
      const urlsToDelete = [
        checkIn.documentFrontUrl,
        checkIn.documentBackUrl,
        checkIn.touristTaxPaymentProof,
        checkIn.booking?.touristTaxPaymentProof
      ].filter(Boolean)

      for (const url of urlsToDelete) {
        const publicId = extractPublicId(url as string)
        if (publicId) {
          try {
            await deleteImage(publicId)
            deletedFilesCount++
          } catch (err) {
            errors.push(`Errore eliminazione file ${publicId}: ${err}`)
          }
        }
      }
    }

    // Anonimizza i dati nel database
    // Manteniamo: firstName, lastName, nationality, status, bookingId, selectedRoomId, isExempt
    const now = new Date()

    await prisma.guestCheckIn.updateMany({
      where: {
        id: {
          in: checkInsToClean.map((c: CheckInToClean) => c.id)
        }
      },
      data: {
        // Dati da anonimizzare
        email: null,
        phone: null,
        dateOfBirth: new Date('1900-01-01'), // Data fittizia
        birthCity: '[RIMOSSO]',
        birthProvince: '[RM]',
        fiscalCode: null,
        documentNumber: '[RIMOSSO]',
        documentIssuePlace: '[RIMOSSO]',
        documentFrontUrl: null,
        documentBackUrl: null,
        touristTaxPaymentProof: null,
        exemptionReason: checkInsToClean.some((c: CheckInToClean) => c.id) ? '[RIMOSSO SE PRESENTE]' : null,
        // Flag anonimizzazione
        dataAnonymized: true,
        dataAnonymizedAt: now
      }
    })

    // Aggiorna anche il payment proof nei booking collegati
    const bookingIds = checkInsToClean
      .filter((c: CheckInToClean) => c.booking?.touristTaxPaymentProof)
      .map((c: CheckInToClean) => c.id)

    if (bookingIds.length > 0) {
      // Trova i booking IDs reali
      const checkInsWithBooking = await prisma.guestCheckIn.findMany({
        where: { id: { in: checkInsToClean.map((c: CheckInToClean) => c.id) } },
        select: { bookingId: true }
      })

      const realBookingIds = checkInsWithBooking
        .map((c: { bookingId: string | null }) => c.bookingId)
        .filter(Boolean) as string[]

      if (realBookingIds.length > 0) {
        await prisma.booking.updateMany({
          where: { id: { in: realBookingIds } },
          data: { touristTaxPaymentProof: null }
        })
      }
    }

    return NextResponse.json({
      success: true,
      cleanedCount: checkInsToClean.length,
      deletedFilesCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Puliti ${checkInsToClean.length} record, eliminati ${deletedFilesCount} file`
    })
  } catch (error) {
    console.error('Errore nella pulizia dati:', error)
    return NextResponse.json(
      { error: 'Errore durante la pulizia dei dati' },
      { status: 500 }
    )
  }
}
