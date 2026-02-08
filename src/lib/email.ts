import nodemailer from 'nodemailer'

// Configurazione del trasportatore email
// Usa le variabili d'ambiente per la configurazione
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true per 465, false per altri
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Variabili disponibili per i template
export const TEMPLATE_VARIABLES = {
  guest_name: 'Nome dell\'ospite',
  guest_email: 'Email dell\'ospite',
  guest_phone: 'Telefono dell\'ospite',
  check_in_date: 'Data check-in',
  check_out_date: 'Data check-out',
  num_guests: 'Numero ospiti',
  total_price: 'Prezzo totale',
  property_name: 'Nome struttura',
  property_address: 'Indirizzo struttura',
  property_city: 'Città struttura',
  room_name: 'Nome stanza',
  booking_code: 'Codice prenotazione',
  checkin_link: 'Link per il check-in online',
}

interface BookingData {
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  checkIn: Date
  checkOut: Date
  guests: number
  totalPrice: number
  bookingCode?: string | null
  property: {
    name: string
    address: string
    city: string
  }
  room?: {
    name: string
  } | null
}

// Sostituisce le variabili nel template con i valori effettivi
export function replaceTemplateVariables(template: string, booking: BookingData): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const replacements: Record<string, string> = {
    '{guest_name}': booking.guestName || '',
    '{guest_email}': booking.guestEmail || '',
    '{guest_phone}': booking.guestPhone || '',
    '{check_in_date}': new Date(booking.checkIn).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    '{check_out_date}': new Date(booking.checkOut).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    '{num_guests}': booking.guests?.toString() || '1',
    '{total_price}': `€${booking.totalPrice?.toLocaleString('it-IT') || '0'}`,
    '{property_name}': booking.property?.name || '',
    '{property_address}': booking.property?.address || '',
    '{property_city}': booking.property?.city || '',
    '{room_name}': booking.room?.name || '',
    '{booking_code}': booking.bookingCode || '',
    '{checkin_link}': booking.bookingCode
      ? `${baseUrl}/checkin/${booking.bookingCode}`
      : '',
  }

  let result = template
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
  }

  return result
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

// Invia un'email
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Verifica che le credenziali SMTP siano configurate
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('Credenziali SMTP non configurate')
      return { success: false, error: 'Credenziali SMTP non configurate' }
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback a testo semplice
      html,
    })

    console.log('Email inviata:', info.messageId)
    return { success: true }
  } catch (error: any) {
    console.error('Errore invio email:', error)
    return { success: false, error: error.message }
  }
}

// Converte il testo del messaggio in HTML semplice
export function textToHtml(text: string): string {
  // Converti i ritorni a capo in <br> e wrappa in un container
  const htmlContent = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        p {
          margin: 0 0 1em 0;
        }
      </style>
    </head>
    <body>
      <p>${htmlContent}</p>
    </body>
    </html>
  `
}
