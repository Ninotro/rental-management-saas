import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ical, { ICalEventBusyStatus, ICalEventTransparency } from 'ical-generator';

/**
 * GET /api/rooms/[id]/ical-export
 * Genera un feed iCal con tutte le prenotazioni della stanza
 * Questo URL va inserito in Airbnb/Booking.com per esportare le tue prenotazioni
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    // Recupera la stanza
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 });
    }

    // Recupera tutte le prenotazioni confermate e in check-in
    // Escludi quelle cancellate
    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'],
        },
      },
      orderBy: {
        checkIn: 'asc',
      },
    });

    // Crea il calendario iCal
    const calendar = ical({
      name: `${room.property.name} - ${room.name}`,
      description: `Calendario prenotazioni per ${room.name}`,
      timezone: 'Europe/Rome',
      ttl: 3600, // Refresh ogni ora
    });

    // Aggiungi ogni prenotazione come evento
    bookings.forEach((booking) => {
      const event = calendar.createEvent({
        start: booking.checkIn,
        end: booking.checkOut,
        summary: `Occupato - ${booking.guestName || 'Prenotazione'}`,
        description: `Prenotazione ${booking.bookingCode || booking.id}`,
      });

      // Imposta uid, busystatus e transparency usando i metodi
      event.uid(booking.externalCalendarId || booking.id);
      event.busystatus(ICalEventBusyStatus.BUSY);
      event.transparency(ICalEventTransparency.OPAQUE);
    });

    // Genera il feed iCal come stringa
    const icalString = calendar.toString();

    // Ritorna con header corretto per iCal
    return new NextResponse(icalString, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${room.name}-calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Errore durante la generazione del feed iCal:', error);
    return NextResponse.json(
      { error: 'Errore durante la generazione del calendario', details: error.message },
      { status: 500 }
    );
  }
}
