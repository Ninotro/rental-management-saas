import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export async function sendWhatsAppMessage({ to, body, mediaUrl }: WhatsAppMessage) {
  if (!client) {
    throw new Error('Twilio client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  }

  // Formatta il numero se non ha già il prefisso whatsapp:
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const message = await client.messages.create({
    from: whatsappFrom,
    to: formattedTo,
    body,
    ...(mediaUrl && { mediaUrl }),
  });

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    body: message.body,
  };
}

export async function sendWhatsAppTemplate({
  to,
  contentSid,
  contentVariables,
}: {
  to: string;
  contentSid: string;
  contentVariables?: Record<string, string>;
}) {
  if (!client) {
    throw new Error('Twilio client not initialized');
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const message = await client.messages.create({
    from: whatsappFrom,
    to: formattedTo,
    contentSid,
    ...(contentVariables && { contentVariables: JSON.stringify(contentVariables) }),
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}
