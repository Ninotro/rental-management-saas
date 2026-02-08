/**
 * Twilio Content API - Gestione Template WhatsApp
 *
 * Questo modulo permette di creare, gestire e inviare template WhatsApp
 * tramite la Content API di Twilio.
 */

import { logTwilio } from './logger'

const TWILIO_CONTENT_API = 'https://content.twilio.com/v1';

interface ContentTemplateVariable {
  key: string;
  defaultValue: string;
}

interface CreateTemplateParams {
  name: string;
  body: string;
  variables?: ContentTemplateVariable[];
}

interface TwilioContentTemplate {
  sid: string;
  friendly_name: string;
  language: string;
  approval_requests?: {
    whatsapp?: {
      status: string;
      rejection_reason?: string;
    };
  };
}

/**
 * Converte le variabili del nostro formato ({guest_name}) al formato Twilio ({{1}})
 * e restituisce la mappa delle variabili
 */
export function convertVariablesToTwilioFormat(text: string): {
  convertedText: string;
  variables: Record<string, number>;
} {
  const variableMap: Record<string, number> = {};
  let counter = 1;

  // Pattern per trovare le nostre variabili
  const variablePattern = /\{([a-z_]+)\}/g;

  const convertedText = text.replace(variablePattern, (match, varName) => {
    if (!variableMap[varName]) {
      variableMap[varName] = counter++;
    }
    return `{{${variableMap[varName]}}}`;
  });

  return { convertedText, variables: variableMap };
}

/**
 * Genera valori di esempio per le variabili (richiesti da WhatsApp per l'approvazione)
 */
function getDefaultValueForVariable(varName: string): string {
  const defaults: Record<string, string> = {
    guest_name: 'Mario Rossi',
    property_name: 'Villa Palermo',
    room_name: 'Camera Deluxe',
    check_in_date: '15/03/2025',
    check_out_date: '18/03/2025',
    booking_code: 'BOOK-ABC123',
    access_codes: 'Portone: 1234, Appartamento: 5678',
    num_guests: '2',
    total_price: '€ 350,00',
  };
  return defaults[varName] || 'valore';
}

/**
 * Crea un template su Twilio Content API
 */
export async function createWhatsAppTemplate(params: CreateTemplateParams): Promise<{
  success: boolean;
  contentSid?: string;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  logTwilio('INFO', '=== INIZIO CREAZIONE TEMPLATE ===', {
    name: params.name,
    bodyPreview: params.body.substring(0, 100) + '...',
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
  });

  if (!accountSid || !authToken) {
    logTwilio('ERROR', 'Credenziali Twilio mancanti', {
      accountSid: accountSid ? 'presente' : 'MANCANTE',
      authToken: authToken ? 'presente' : 'MANCANTE',
    });
    return { success: false, error: 'Credenziali Twilio non configurate' };
  }

  try {
    // Converti le variabili al formato Twilio
    const { convertedText, variables } = convertVariablesToTwilioFormat(params.body);

    logTwilio('DEBUG', 'Testo convertito per Twilio', {
      originalBody: params.body,
      convertedText,
      variables,
    });

    // Costruisci l'array di variabili con valori di default
    const twilioVariables: Record<string, string> = {};
    Object.entries(variables).forEach(([varName, index]) => {
      twilioVariables[index.toString()] = getDefaultValueForVariable(varName);
    });

    // Crea il template
    const templateData = {
      friendly_name: params.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      language: 'it',
      types: {
        'twilio/text': {
          body: convertedText,
        },
      },
      ...(Object.keys(twilioVariables).length > 0 && { variables: twilioVariables }),
    };

    logTwilio('INFO', 'Invio richiesta a Twilio Content API', {
      url: `${TWILIO_CONTENT_API}/Content`,
      templateData,
    });

    const response = await fetch(`${TWILIO_CONTENT_API}/Content`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    const data = await response.json();

    logTwilio('INFO', 'Risposta da Twilio', {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    if (!response.ok) {
      logTwilio('ERROR', 'Errore dalla Content API di Twilio', {
        status: response.status,
        error: data,
      });
      return {
        success: false,
        error: data.message || `Errore ${response.status}: ${JSON.stringify(data)}`
      };
    }

    logTwilio('INFO', '=== TEMPLATE CREATO CON SUCCESSO ===', {
      contentSid: data.sid,
      friendlyName: data.friendly_name,
    });

    return {
      success: true,
      contentSid: data.sid
    };

  } catch (error) {
    logTwilio('ERROR', 'Eccezione durante creazione template', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Invia il template per l'approvazione WhatsApp
 */
export async function submitTemplateForApproval(contentSid: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  logTwilio('INFO', '=== INVIO TEMPLATE PER APPROVAZIONE ===', { contentSid });

  if (!accountSid || !authToken) {
    logTwilio('ERROR', 'Credenziali mancanti per approvazione');
    return { success: false, error: 'Credenziali Twilio non configurate' };
  }

  try {
    const approvalData = {
      name: contentSid,
      category: 'UTILITY', // UTILITY per messaggi transazionali
    };

    logTwilio('INFO', 'Invio richiesta approvazione', {
      url: `${TWILIO_CONTENT_API}/Content/${contentSid}/ApprovalRequests/whatsapp`,
      approvalData,
    });

    const response = await fetch(`${TWILIO_CONTENT_API}/Content/${contentSid}/ApprovalRequests/whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approvalData),
    });

    const data = await response.json();

    logTwilio('INFO', 'Risposta approvazione', {
      status: response.status,
      data,
    });

    if (!response.ok) {
      logTwilio('ERROR', 'Errore approvazione template', {
        status: response.status,
        error: data,
      });
      return {
        success: false,
        error: data.message || 'Errore nell\'invio per approvazione'
      };
    }

    logTwilio('INFO', '=== TEMPLATE INVIATO PER APPROVAZIONE ===', {
      status: data.status || 'pending',
    });

    return {
      success: true,
      status: data.status || 'pending'
    };

  } catch (error) {
    logTwilio('ERROR', 'Eccezione durante invio approvazione', {
      error: error instanceof Error ? error.message : error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Controlla lo stato di approvazione di un template
 */
export async function checkTemplateApprovalStatus(contentSid: string): Promise<{
  success: boolean;
  status?: string;
  rejectionReason?: string;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return { success: false, error: 'Credenziali Twilio non configurate' };
  }

  try {
    const response = await fetch(`${TWILIO_CONTENT_API}/Content/${contentSid}/ApprovalRequests`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    // Cerca lo stato WhatsApp
    const whatsappApproval = data.whatsapp;

    return {
      success: true,
      status: whatsappApproval?.status || 'unknown',
      rejectionReason: whatsappApproval?.rejection_reason,
    };

  } catch (error) {
    console.error('Error checking template status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Elimina un template da Twilio
 */
export async function deleteWhatsAppTemplate(contentSid: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return { success: false, error: 'Credenziali Twilio non configurate' };
  }

  try {
    const response = await fetch(`${TWILIO_CONTENT_API}/Content/${contentSid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json();
      return { success: false, error: data.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Invia un messaggio usando un template approvato
 */
export async function sendWhatsAppTemplateMessage(params: {
  to: string;
  contentSid: string;
  variables: Record<string, string>;
}): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { success: false, error: 'Credenziali Twilio non configurate' };
  }

  try {
    // Converti le variabili nel formato richiesto da Twilio
    const contentVariables: Record<string, string> = {};
    Object.entries(params.variables).forEach(([key, value], index) => {
      contentVariables[(index + 1).toString()] = value;
    });

    const formattedTo = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: formattedTo,
        ContentSid: params.contentSid,
        ContentVariables: JSON.stringify(contentVariables),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio message error:', data);
      return {
        success: false,
        error: data.message || 'Errore nell\'invio del messaggio'
      };
    }

    return {
      success: true,
      messageSid: data.sid
    };

  } catch (error) {
    console.error('Error sending template message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}
