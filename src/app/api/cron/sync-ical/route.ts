import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBookingCode } from '@/lib/bookingCode';
import ICAL from 'ical.js';

/**
 * GET /api/cron/sync-ical
 * Cron job per sincronizzare tutti i calendari iCal
 * Protetto da CRON_SECRET per l'uso con Vercel Cron Jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Verifica autorizzazione
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In produzione, verifica il secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Recupera un admin user per le prenotazioni create dal cron
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', active: true },
      select: { id: true },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: 'Nessun utente admin trovato per la sincronizzazione' },
        { status: 500 }
      );
    }

    // Recupera tutte le stanze con URL iCal configurati
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { airbnbIcalUrl: { not: null } },
          { bookingComIcalUrl: { not: null } },
        ],
      },
      include: {
        property: { select: { name: true } },
      },
    });

    if (rooms.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nessuna stanza con calendari iCal configurati',
        synced: 0,
        errors: 0,
      });
    }

    let totalSynced = 0;
    let totalErrors = 0;
    const results: any[] = [];

    // Sincronizza ogni stanza
    for (const room of rooms) {
      const roomResults: any = {
        roomId: room.id,
        roomName: room.name,
        propertyName: room.property.name,
        syncs: [],
      };

      // Sincronizza Airbnb se configurato
      if (room.airbnbIcalUrl) {
        const airbnbResult = await syncIcalFeed(
          room.id,
          room.airbnbIcalUrl,
          'AIRBNB',
          systemUser.id
        );
        roomResults.syncs.push({ source: 'AIRBNB', ...airbnbResult });
        if (airbnbResult.success) {
          totalSynced++;
        } else {
          totalErrors++;
        }
      }

      // Sincronizza Booking.com se configurato
      if (room.bookingComIcalUrl) {
        const bookingResult = await syncIcalFeed(
          room.id,
          room.bookingComIcalUrl,
          'BOOKING_COM',
          systemUser.id
        );
        roomResults.syncs.push({ source: 'BOOKING_COM', ...bookingResult });
        if (bookingResult.success) {
          totalSynced++;
        } else {
          totalErrors++;
        }
      }

      // Aggiorna lastSyncedAt della stanza
      await prisma.room.update({
        where: { id: room.id },
        data: { lastSyncedAt: new Date() },
      });

      results.push(roomResults);
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizzazione completata: ${totalSynced} calendari sincronizzati, ${totalErrors} errori`,
      synced: totalSynced,
      errors: totalErrors,
      timestamp: new Date().toISOString(),
      details: results,
    });
  } catch (error: any) {
    console.error('Errore durante il cron sync iCal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Errore durante la sincronizzazione',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Funzione helper per sincronizzare un singolo feed iCal
 * (Versione per cron job con userId di sistema)
 */
async function syncIcalFeed(
  roomId: string,
  icalUrl: string,
  source: 'AIRBNB' | 'BOOKING_COM' | 'OTHER',
  userId: string
) {
  try {
    // Scarica il feed iCal
    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'RentalManagementSaaS/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore nel download del calendario: ${response.statusText}`);
    }

    const icalData = await response.text();

    // Parsa il contenuto iCal
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

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

        // Valida le date
        if (!startDate || !endDate) {
          errors.push(`Evento ${uid}: date mancanti`);
          continue;
        }

        // Ignora eventi nel passato (più di 30 giorni fa)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Converti in Date JavaScript
        const checkIn = startDate.toJSDate();
        const checkOut = endDate.toJSDate();

        if (checkOut < thirtyDaysAgo) {
          continue; // Salta eventi troppo vecchi
        }

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
          // Se ha check-in associati, NON aggiornare il nome per preservare i dati ospite
          if (existingBooking._count.guestCheckIns > 0) {
            // Aggiorna solo le date
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
          updated++;
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

    return {
      success: true,
      imported,
      updated,
      errors: errors.length > 0 ? errors : undefined
    };
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

    return { success: false, imported: 0, error: error.message };
  }
}
