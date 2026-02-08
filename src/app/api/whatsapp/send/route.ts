import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { to, body, mediaUrl } = await request.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Numero destinatario (to) e messaggio (body) sono richiesti' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage({ to, body, mediaUrl });

    return NextResponse.json({
      success: true,
      message: result,
    });
  } catch (error) {
    console.error('Errore invio WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore invio messaggio' },
      { status: 500 }
    );
  }
}
