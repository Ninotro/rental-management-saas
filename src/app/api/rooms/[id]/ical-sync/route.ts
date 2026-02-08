import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBookingCode } from '@/lib/bookingCode';
import ICAL from 'ical.js';

/**
 * POST /api/rooms/[id]/ical-sync
 * Sincronizza i calendari iCal esterni (Airbnb e/o Booking.com)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id: roomId } = await params;

    // Recupera la stanza con i link iCal
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 });
    }

    let totalImported = 0;
    let totalRemoved = 0;
    const results: any[] = [];

    // Sincronizza Airbnb se configurato
    if (room.airbnbIcalUrl) {
      const airbnbResult = await syncIcalFeed(
        roomId,
        room.airbnbIcalUrl,
        'AIRBNB',
        session.user.id
      );
      results.push({ source: 'AIRBNB', ...airbnbResult });
      totalImported += airbnbResult.imported;
      totalRemoved += airbnbResult.removed || 0;
    }

    // Sincronizza Booking.com se configurato
    if (room.bookingComIcalUrl) {
      const bookingResult = await syncIcalFeed(
        roomId,
        room.bookingComIcalUrl,
        'BOOKING_COM',
        session.user.id
      );
      results.push({ source: 'BOOKING_COM', ...bookingResult });
      totalImported += bookingResult.imported;
      totalRemoved += bookingResult.removed || 0;
    }

    // Aggiorna lastSyncedAt
    await prisma.room.update({
      where: { id: roomId },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      totalImported,
      totalRemoved,
      results,
    });
  } catch (error: any) {
    console.error('Errore durante la sincronizzazione iCal:', error);
    return NextResponse.json(
      { error: 'Errore durante la sincronizzazione', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Funzione helper per sincronizzare un singolo feed iCal
 */
async function syncIcalFeed(
  roomId: string,
  icalUrl: string,
  source: 'AIRBNB' | 'BOOKING_COM' | 'OTHER',
  userId: string
) {
  try {
    // Scarica il feed iCal
    const response = await fetch(icalUrl);

    if (!response.ok) {
      // Prova a leggere il corpo dell'errore per messaggi più specifici
      let errorDetail = response.statusText;
      try {
        const errorBody = await response.text();
        if (errorBody.includes('Invalid Token')) {
          throw new Error(`URL iCal scaduto o non valido. Rigenera l'URL su ${source === 'BOOKING_COM' ? 'Booking.com Extranet' : 'Airbnb'} e aggiornalo nelle impostazioni della stanza.`);
        }
        errorDetail = errorBody.substring(0, 200); // Limita la lunghezza
      } catch (e) {
        // Ignora errori nella lettura del body
      }
      throw new Error(`Errore nel download del calendario (${response.status}): ${errorDetail}`);
    }

    const icalData = await response.text();

    // Parsa il contenuto iCal
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    let imported = 0;
    let removed = 0;
    const errors: string[] = [];
    const currentFeedUids: string[] = [];

    // Recupera le informazioni della stanza
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { propertyId: true, maxGuests: true },
    });

    if (!room) {
      throw new Error('Stanza non trovata');
    }

    // Processa ogni evento
    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);

        // Estrai i dati dell'evento
        const uid = event.uid || `event-${Date.now()}`;
        const summary = event.summary || 'Prenotazione importata';
        const startDate = event.startDate;
        const endDate = event.endDate;

        // Traccia UID per rimozione prenotazioni non più presenti
        currentFeedUids.push(uid);

        // Valida le date
        if (!startDate || !endDate) {
          errors.push(`Evento ${uid}: date mancanti`);
          continue;
        }

        // Converti in Date JavaScript
        const checkIn = startDate.toJSDate();
        const checkOut = endDate.toJSDate();

        // Verifica se la prenotazione esiste già (usando externalCalendarId)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            roomId,
            externalCalendarId: uid,
          },
          include: {
            _count: {
              select: { guestCheckIns: true },
            },
          },
        });

        if (existingBooking) {
          // Se ha check-in associati, NON aggiornare per preservare i dati ospite
          if (existingBooking._count.guestCheckIns > 0) {
            // Aggiorna solo le date se cambiate, ma NON il nome
            await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                checkIn,
                checkOut,
                updatedAt: new Date(),
              },
            });
          } else {
            // Nessun check-in associato, aggiorna tutto
            await prisma.booking.update({
              where: { id: existingBooking.id },
              data: {
                checkIn,
                checkOut,
                guestName: summary,
                updatedAt: new Date(),
              },
            });
          }
        } else {
          // Genera un bookingCode univoco
          let bookingCode = generateBookingCode();

          // Verifica che il codice non esista già
          let codeExists = await prisma.booking.findUnique({
            where: { bookingCode },
          });

          // Se il codice esiste, genera un nuovo codice (max 10 tentativi)
          let attempts = 0;
          while (codeExists && attempts < 10) {
            bookingCode = generateBookingCode();
            codeExists = await prisma.booking.findUnique({
              where: { bookingCode },
            });
            attempts++;
          }

          // Crea nuova prenotazione
          await prisma.booking.create({
            data: {
              bookingCode,
              propertyId: room.propertyId,
              roomId,
              guestName: summary,
              guestEmail: `import-${source.toLowerCase()}@placeholder.com`,
              checkIn,
              checkOut,
              guests: 1,
              totalPrice: 0,
              status: 'CONFIRMED',
              channel: source === 'AIRBNB' ? 'AIRBNB' : 'BOOKING_COM',
              importedFromIcal: true,
              externalCalendarId: uid,
              createdById: userId,
            },
          });
          imported++;
        }
      } catch (eventError: any) {
        errors.push(`Errore nell'elaborazione evento: ${eventError.message}`);
      }
    }

    // Rimuovi prenotazioni che non esistono più nel feed iCal
    // Solo per prenotazioni importate, stesso canale, con checkIn futuro
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingsToRemove = await prisma.booking.findMany({
      where: {
        roomId,
        importedFromIcal: true,
        channel: source === 'AIRBNB' ? 'AIRBNB' : 'BOOKING_COM',
        externalCalendarId: {
          not: null,
          notIn: currentFeedUids,
        },
        checkIn: {
          gte: today,
        },
      },
      include: {
        _count: {
          select: { guestCheckIns: true },
        },
      },
    });

    // Elimina solo le prenotazioni senza check-in associati
    for (const booking of bookingsToRemove) {
      if (booking._count.guestCheckIns === 0) {
        await prisma.booking.delete({
          where: { id: booking.id },
        });
        removed++;
      }
    }

    // Registra la sincronizzazione
    await prisma.iCalSync.create({
      data: {
        roomId,
        source,
        success: true,
        eventsImported: imported,
        syncedAt: new Date(),
      },
    });

    return { success: true, imported, removed, errors };
  } catch (error: any) {
    // Registra l'errore
    await prisma.iCalSync.create({
      data: {
        roomId,
        source,
        success: false,
        eventsImported: 0,
        errorMessage: error.message,
        syncedAt: new Date(),
      },
    });

    return { success: false, imported: 0, removed: 0, error: error.message };
  }
}
